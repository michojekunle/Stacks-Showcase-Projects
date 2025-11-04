import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

// Helper function to mine multiple blocks
function mineBlocks(count: number) {
  for (let i = 0; i < count; i++) {
    simnet.mineEmptyBlock();
  }
}

describe("Governance Contract", () => {
  // Test contract deployment
  it("ensures the contract is deployed", () => {
    const contractSource = simnet.getContractSource("governance");
    expect(contractSource).toBeDefined();
  });

  // Proposal Management
  describe("Proposal Management", () => {
    it("creates a proposal successfully", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1; // Block increments before execution
      const title = Cl.stringUtf8("Test Proposal");
      const description = Cl.stringUtf8("A test proposal for governance");
      const createResult = simnet.callPublicFn(
        "governance",
        "create-proposal",
        [title, description],
        wallet1
      );
      expect(createResult.result).toBeOk(Cl.uint(1));
      // Check proposal data
      const proposal = simnet.callReadOnlyFn(
        "governance",
        "get-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(proposal.result).toBeOk(
        Cl.some(
          Cl.tuple({
            creator: Cl.principal(wallet1),
            title,
            description,
            "start-block": Cl.uint(startBlock),
            "end-block": Cl.uint(startBlock + 1008),
            "votes-for": Cl.uint(0),
            "votes-against": Cl.uint(0),
            finalized: Cl.bool(false),
            executed: Cl.bool(false),
            status: Cl.stringAscii("active"),
          })
        )
      );
      // Check proposal count
      const proposalCount = simnet.getDataVar("governance", "proposal-count");
      expect(proposalCount).toBeUint(1);
      // Check print event
      expect(createResult.events).toHaveLength(1);
      expect(createResult.events[0].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "proposal-created" },
          "proposal-id": { type: "uint", value: 1n },
          creator: { type: "address", value: wallet1 },
          title: { type: "utf8", value: "Test Proposal" },
        },
      });
    });

    it("fails to create proposal with empty title", () => {
      const createResult = simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8(""), Cl.stringUtf8("Description")],
        wallet1
      );
      expect(createResult.result).toBeErr(Cl.uint(100));
    });

    it("fails to create proposal with empty description", () => {
      const createResult = simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Title"), Cl.stringUtf8("")],
        wallet1
      );
      expect(createResult.result).toBeErr(Cl.uint(101));
    });
  });

  // Voting
  describe("Voting Functions", () => {
    it("casts vote successfully", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1; // Block increments for create-proposal
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const votePreBlock = simnet.blockHeight;
      const voteBlock = votePreBlock + 1; // Block increments for cast-vote
      // Cast vote
      const voteResult = simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(1000)],
        wallet2
      );
      expect(voteResult.result).toBeOk(Cl.bool(true));
      // Check vote data
      const vote = simnet.callReadOnlyFn(
        "governance",
        "get-vote",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(vote.result).toBeOk(
        Cl.some(
          Cl.tuple({
            vote: Cl.bool(true),
            amount: Cl.uint(1000),
            "block-height": Cl.uint(voteBlock),
          })
        )
      );
      // Check proposal votes
      const proposal = simnet.callReadOnlyFn(
        "governance",
        "get-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(proposal.result).toBeOk(
        Cl.some(
          Cl.tuple({
            creator: Cl.principal(wallet1),
            title: Cl.stringUtf8("Test Proposal"),
            description: Cl.stringUtf8("Description"),
            "start-block": Cl.uint(startBlock),
            "end-block": Cl.uint(startBlock + 1008),
            "votes-for": Cl.uint(1000),
            "votes-against": Cl.uint(0),
            finalized: Cl.bool(false),
            executed: Cl.bool(false),
            status: Cl.stringAscii("active"),
          })
        )
      );
      // Check print event
      expect(voteResult.events).toHaveLength(1);
      expect(voteResult.events[0].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "vote-cast" },
          "proposal-id": { type: "uint", value: 1n },
          voter: { type: "address", value: wallet2 },
          "vote-for": { type: "true" },
          amount: { type: "uint", value: 1000n },
        },
      });
    });

    it("fails to vote on non-existent proposal", () => {
      const voteResult = simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(1000)],
        wallet1
      );
      expect(voteResult.result).toBeErr(Cl.uint(201)); // err-proposal-not-found
    });

    it("fails to vote on finalized proposal", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1;
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      mineBlocks(1010); // Move past end-block (startBlock + 1008 + extra)
      simnet.callPublicFn(
        "governance",
        "finalize-proposal",
        [Cl.uint(1)],
        deployer
      );
      const voteResult = simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(1000)],
        wallet2
      );
      expect(voteResult.result).toBeErr(Cl.uint(202)); // err-proposal-not-active
    });

    it("fails to vote with zero amount", () => {
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const voteResult = simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(0)],
        wallet2
      );
      expect(voteResult.result).toBeErr(Cl.uint(207)); // err-invalid-vote-amount
    });

    it("fails to vote if already voted", () => {
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(1000)],
        wallet2
      );
      const voteResult = simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(false), Cl.uint(500)],
        wallet2
      );
      expect(voteResult.result).toBeErr(Cl.uint(203)); // err-already-voted
    });
  });

  // Finalization
  describe("Finalization Functions", () => {
    it("finalizes proposal successfully (passed)", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1;
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(1000)],
        wallet2
      );
      simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(false), Cl.uint(500)],
        deployer
      );
      mineBlocks(1010); // Move past end-block
      const finalizeResult = simnet.callPublicFn(
        "governance",
        "finalize-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(finalizeResult.result).toBeOk(Cl.bool(true)); // Passed: 1000 > 500
      // Check proposal status
      const proposal = simnet.callReadOnlyFn(
        "governance",
        "get-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(proposal.result).toBeOk(
        Cl.some(
          Cl.tuple({
            creator: Cl.principal(wallet1),
            title: Cl.stringUtf8("Test Proposal"),
            description: Cl.stringUtf8("Description"),
            "start-block": Cl.uint(startBlock),
            "end-block": Cl.uint(startBlock + 1008),
            "votes-for": Cl.uint(1000),
            "votes-against": Cl.uint(500),
            finalized: Cl.bool(true),
            executed: Cl.bool(false),
            status: Cl.stringAscii("passed"),
          })
        )
      );
      // Check print event
      expect(finalizeResult.events).toHaveLength(1);
      expect(finalizeResult.events[0].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "proposal-finalized" },
          "proposal-id": { type: "uint", value: 1n },
          status: { type: "ascii", value: "passed" },
          "votes-for": { type: "uint", value: 1000n },
          "votes-against": { type: "uint", value: 500n },
        },
      });
    });

    it("finalizes proposal successfully (rejected)", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1;
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(500)],
        wallet2
      );
      simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(false), Cl.uint(1000)],
        deployer
      );
      mineBlocks(1010); // Move past end-block
      const finalizeResult = simnet.callPublicFn(
        "governance",
        "finalize-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(finalizeResult.result).toBeOk(Cl.bool(false)); // Rejected: 500 < 1000
      const proposal = simnet.callReadOnlyFn(
        "governance",
        "get-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(proposal.result).toBeOk(
        Cl.some(
          Cl.tuple({
            creator: Cl.principal(wallet1),
            title: Cl.stringUtf8("Test Proposal"),
            description: Cl.stringUtf8("Description"),
            "start-block": Cl.uint(startBlock),
            "end-block": Cl.uint(startBlock + 1008),
            "votes-for": Cl.uint(500),
            "votes-against": Cl.uint(1000),
            finalized: Cl.bool(true),
            executed: Cl.bool(false),
            status: Cl.stringAscii("rejected"),
          })
        )
      );
      // Check print event
      expect(finalizeResult.events).toHaveLength(1);
      expect(finalizeResult.events[0].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "proposal-finalized" },
          "proposal-id": { type: "uint", value: 1n },
          status: { type: "ascii", value: "rejected" },
          "votes-for": { type: "uint", value: 500n },
          "votes-against": { type: "uint", value: 1000n },
        },
      });
    });

    it("fails to finalize non-existent proposal", () => {
      const finalizeResult = simnet.callPublicFn(
        "governance",
        "finalize-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(finalizeResult.result).toBeErr(Cl.uint(201)); // err-proposal-not-found
    });

    it("fails to finalize before end-block", () => {
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const finalizeResult = simnet.callPublicFn(
        "governance",
        "finalize-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(finalizeResult.result).toBeErr(Cl.uint(205)); // err-proposal-not-ended
    });

    it("fails to finalize already finalized proposal", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1;
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      mineBlocks(1010); // Move past end-block
      simnet.callPublicFn(
        "governance",
        "finalize-proposal",
        [Cl.uint(1)],
        deployer
      );
      const finalizeResult = simnet.callPublicFn(
        "governance",
        "finalize-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(finalizeResult.result).toBeErr(Cl.uint(206)); // err-proposal-already-finalized
    });
  });

  // Read-Only Functions
  describe("Read-Only Functions", () => {
    it("gets proposal details", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1;
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const proposal = simnet.callReadOnlyFn(
        "governance",
        "get-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(proposal.result).toBeOk(
        Cl.some(
          Cl.tuple({
            creator: Cl.principal(wallet1),
            title: Cl.stringUtf8("Test Proposal"),
            description: Cl.stringUtf8("Description"),
            "start-block": Cl.uint(startBlock),
            "end-block": Cl.uint(startBlock + 1008),
            "votes-for": Cl.uint(0),
            "votes-against": Cl.uint(0),
            finalized: Cl.bool(false),
            executed: Cl.bool(false),
            status: Cl.stringAscii("active"),
          })
        )
      );
    });

    it("gets vote details", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1;
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const votePreBlock = simnet.blockHeight;
      const voteBlock = votePreBlock + 1;
      simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(1000)],
        wallet2
      );
      const vote = simnet.callReadOnlyFn(
        "governance",
        "get-vote",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(vote.result).toBeOk(
        Cl.some(
          Cl.tuple({
            vote: Cl.bool(true),
            amount: Cl.uint(1000),
            "block-height": Cl.uint(voteBlock),
          })
        )
      );
    });

    it("gets proposal count", () => {
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const count = simnet.callReadOnlyFn(
        "governance",
        "get-proposal-count",
        [],
        deployer
      );
      expect(count.result).toBeOk(Cl.uint(1));
    });

    it("gets proposal status", () => {
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const status = simnet.callReadOnlyFn(
        "governance",
        "get-proposal-status",
        [Cl.uint(1)],
        deployer
      );
      expect(status.result).toBeOk(Cl.stringAscii("active"));
    });

    it("gets proposal votes", () => {
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(1000)],
        wallet2
      );
      const votes = simnet.callReadOnlyFn(
        "governance",
        "get-proposal-votes",
        [Cl.uint(1)],
        deployer
      );
      expect(votes.result).toBeOk(
        Cl.tuple({
          "votes-for": Cl.uint(1000),
          "votes-against": Cl.uint(0),
          total: Cl.uint(1000),
        })
      );
    });

    it("checks if user has voted", () => {
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(1000)],
        wallet2
      );
      const hasVoted = simnet.callReadOnlyFn(
        "governance",
        "has-voted",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(hasVoted.result).toBeOk(Cl.bool(true));
      const hasNotVoted = simnet.callReadOnlyFn(
        "governance",
        "has-voted",
        [Cl.uint(1), Cl.principal(deployer)],
        deployer
      );
      expect(hasNotVoted.result).toBeOk(Cl.bool(false));
    });

    it("checks if proposal is active", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1;
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const isActive = simnet.callReadOnlyFn(
        "governance",
        "is-proposal-active",
        [Cl.uint(1)],
        deployer
      );
      expect(isActive.result).toBeOk(Cl.bool(true));
      mineBlocks(1010); // Move past end-block
      const isNotActive = simnet.callReadOnlyFn(
        "governance",
        "is-proposal-active",
        [Cl.uint(1)],
        deployer
      );
      expect(isNotActive.result).toBeOk(Cl.bool(false));
    });
  });

  // Admin Functions
  describe("Admin Functions", () => {
    it("sets vote token contract successfully", () => {
      const voteTokenContract = Cl.principal(deployer + ".vote-token");
      const result = simnet.callPublicFn(
        "governance",
        "set-vote-token-contract",
        [voteTokenContract],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
      const contractVar = simnet.getDataVar(
        "governance",
        "vote-token-contract"
      );
      expect(contractVar).toEqual(voteTokenContract);
    });

    it("fails to set vote token contract by non-owner", () => {
      const voteTokenContract = Cl.principal(deployer + ".vote-token");
      const result = simnet.callPublicFn(
        "governance",
        "set-vote-token-contract",
        [voteTokenContract],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(200)); // err-owner-only
    });

    it("sets vote token contract with any valid principal", () => {
      const result = simnet.callPublicFn(
        "governance",
        "set-vote-token-contract",
        [Cl.principal("ST000000000000000000002AMW42H")],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true)); // Contract accepts any principal
    });
  });

  // Data Maps and Variables
  describe("Data Maps and Variables", () => {
    it("reads proposals map correctly", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1;
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const proposal = simnet.getMapEntry(
        "governance",
        "proposals",
        Cl.uint(1)
      );
      expect(proposal).toBeSome(
        Cl.tuple({
          creator: Cl.principal(wallet1),
          title: Cl.stringUtf8("Test Proposal"),
          description: Cl.stringUtf8("Description"),
          "start-block": Cl.uint(startBlock),
          "end-block": Cl.uint(startBlock + 1008),
          "votes-for": Cl.uint(0),
          "votes-against": Cl.uint(0),
          finalized: Cl.bool(false),
          executed: Cl.bool(false),
          status: Cl.stringAscii("active"),
        })
      );
    });

    it("reads votes map correctly", () => {
      const preBlock = simnet.blockHeight;
      const startBlock = preBlock + 1;
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const votePreBlock = simnet.blockHeight;
      const voteBlock = votePreBlock + 1;
      simnet.callPublicFn(
        "governance",
        "cast-vote",
        [Cl.uint(1), Cl.bool(true), Cl.uint(1000)],
        wallet2
      );
      const vote = simnet.getMapEntry(
        "governance",
        "votes",
        Cl.tuple({ "proposal-id": Cl.uint(1), voter: Cl.principal(wallet2) })
      );
      expect(vote).toBeSome(
        Cl.tuple({
          vote: Cl.bool(true),
          amount: Cl.uint(1000),
          "block-height": Cl.uint(voteBlock),
        })
      );
    });

    it("reads user-voting-power map correctly", () => {
      const votingPower = simnet.callReadOnlyFn(
        "governance",
        "get-vote",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );
      expect(votingPower.result).toBeOk(Cl.none()); // No voting power set
    });

    it("reads proposal-count variable correctly", () => {
      simnet.callPublicFn(
        "governance",
        "create-proposal",
        [Cl.stringUtf8("Test Proposal"), Cl.stringUtf8("Description")],
        wallet1
      );
      const proposalCount = simnet.getDataVar("governance", "proposal-count");
      expect(proposalCount).toBeUint(1);
    });

    it("reads vote-token-contract variable correctly", () => {
      const voteTokenContract = simnet.getDataVar(
        "governance",
        "vote-token-contract"
      );
      expect(voteTokenContract).toEqual(Cl.principal(deployer));
    });
  });
});
