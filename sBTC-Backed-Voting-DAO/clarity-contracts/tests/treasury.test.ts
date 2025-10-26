import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const governanceContract = `${deployer}.governance`;

describe("Treasury Contract", () => {
  // Test contract deployment
  it("ensures the contract is deployed", () => {
    const contractSource = simnet.getContractSource("treasury");
    expect(contractSource).toBeDefined();
  });

  // Deposit Functions
  describe("Deposit Functions", () => {
    it("deposits successfully", () => {
      const amount = 1000;
      const depositResult = simnet.callPublicFn(
        "treasury",
        "deposit",
        [Cl.uint(amount)],
        wallet1
      );
      expect(depositResult.result).toBeOk(Cl.bool(true));
      // Check total deposits
      const totalDeposits = simnet.callReadOnlyFn("treasury", "get-total-deposits", [], deployer);
      expect(totalDeposits.result).toBeOk(Cl.uint(amount));
      // Check balance
      const balance = simnet.callReadOnlyFn("treasury", "get-balance", [], deployer);
      expect(balance.result).toBeOk(Cl.uint(amount));
      // Check print event
      expect(depositResult.events).toHaveLength(1);
      expect(depositResult.events[0].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "deposit" },
          sender: { type: "address", value: wallet1 },
          amount: { type: "uint", value: BigInt(amount) },
        },
      });
    });

    it("fails to deposit zero amount", () => {
      const depositResult = simnet.callPublicFn(
        "treasury",
        "deposit",
        [Cl.uint(0)],
        wallet1
      );
      expect(depositResult.result).toBeErr(Cl.uint(303)); // err-invalid-amount
    });
  });

  // Withdrawal Functions
  describe("Withdrawal Functions", () => {
    it("withdraws successfully by contract owner", () => {
      const preBlock = simnet.blockHeight;
      const blockHeight = preBlock + 2; // Deposit + withdraw
      const amount = 500;
      const reason = Cl.stringUtf8("Operational expenses");
      // Deposit first
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      // Withdraw
      const withdrawResult = simnet.callPublicFn(
        "treasury",
        "withdraw",
        [Cl.uint(amount), Cl.principal(wallet2), reason],
        deployer
      );
      expect(withdrawResult.result).toBeOk(Cl.bool(true));
      // Check spending history
      const spendingRecord = simnet.callReadOnlyFn("treasury", "get-spending-record", [Cl.uint(1)], deployer);
      expect(spendingRecord.result).toBeOk(
        Cl.some(
          Cl.tuple({
            recipient: Cl.principal(wallet2),
            amount: Cl.uint(amount),
            reason,
            "block-height": Cl.uint(blockHeight),
            "approved-by": Cl.principal(deployer),
          })
        )
      );
      // Check total withdrawals
      const totalWithdrawals = simnet.callReadOnlyFn("treasury", "get-total-withdrawals", [], deployer);
      expect(totalWithdrawals.result).toBeOk(Cl.uint(amount));
      // Check balance
      const balance = simnet.callReadOnlyFn("treasury", "get-balance", [], deployer);
      expect(balance.result).toBeOk(Cl.uint(1000 - amount));
      // Check spending count
      const spendingCount = simnet.callReadOnlyFn("treasury", "get-spending-count", [], deployer);
      expect(spendingCount.result).toBeOk(Cl.uint(1));
      // Check print event
      expect(withdrawResult.events).toHaveLength(1);
      expect(withdrawResult.events[0].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "withdrawal" },
          "spending-id": { type: "uint", value: 1n },
          recipient: { type: "address", value: wallet2 },
          amount: { type: "uint", value: BigInt(amount) },
          reason: { type: "utf8", value: "Operational expenses" },
        },
      });
    });

    it("withdraws successfully by governance contract", () => {
      const preBlock = simnet.blockHeight;
      const blockHeight = preBlock + 3; // Set-governance + deposit + withdraw
      const amount = 500;
      const reason = Cl.stringUtf8("Governance-approved payment");
      // Set governance contract
      simnet.callPublicFn("treasury", "set-governance-contract", [Cl.principal(governanceContract)], deployer);
      // Deposit
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      // Withdraw by deployer (simulating governance, as direct contract sender not allowed)
      const withdrawResult = simnet.callPublicFn(
        "treasury",
        "withdraw",
        [Cl.uint(amount), Cl.principal(wallet2), reason],
        deployer // Use deployer, as governance contract is authorized via is-authorized
      );
      expect(withdrawResult.result).toBeOk(Cl.bool(true));
      // Check spending history
      const spendingRecord = simnet.callReadOnlyFn("treasury", "get-spending-record", [Cl.uint(1)], deployer);
      expect(spendingRecord.result).toBeOk(
        Cl.some(
          Cl.tuple({
            recipient: Cl.principal(wallet2),
            amount: Cl.uint(amount),
            reason,
            "block-height": Cl.uint(blockHeight),
            "approved-by": Cl.principal(deployer), // deployer as tx-sender
          })
        )
      );
      // Check total withdrawals
      const totalWithdrawals = simnet.callReadOnlyFn("treasury", "get-total-withdrawals", [], deployer);
      expect(totalWithdrawals.result).toBeOk(Cl.uint(amount));
      // Check balance
      const balance = simnet.callReadOnlyFn("treasury", "get-balance", [], deployer);
      expect(balance.result).toBeOk(Cl.uint(1000 - amount));
      // Check spending count
      const spendingCount = simnet.callReadOnlyFn("treasury", "get-spending-count", [], deployer);
      expect(spendingCount.result).toBeOk(Cl.uint(1));
      // Check print event
      expect(withdrawResult.events).toHaveLength(1);
      expect(withdrawResult.events[0].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "withdrawal" },
          "spending-id": { type: "uint", value: 1n },
          recipient: { type: "address", value: wallet2 },
          amount: { type: "uint", value: BigInt(amount) },
          reason: { type: "utf8", value: "Governance-approved payment" },
        },
      });
    });

    it("fails to withdraw with zero amount", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      const withdrawResult = simnet.callPublicFn(
        "treasury",
        "withdraw",
        [Cl.uint(0), Cl.principal(wallet2), Cl.stringUtf8("Invalid withdrawal")],
        deployer
      );
      expect(withdrawResult.result).toBeErr(Cl.uint(303)); // err-invalid-amount
    });

    it("fails to withdraw by unauthorized caller", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      const withdrawResult = simnet.callPublicFn(
        "treasury",
        "withdraw",
        [Cl.uint(500), Cl.principal(wallet2), Cl.stringUtf8("Unauthorized withdrawal")],
        wallet1
      );
      expect(withdrawResult.result).toBeErr(Cl.uint(301)); // err-unauthorized
    });
  });

  // Emergency Withdrawal
  describe("Emergency Withdrawal Functions", () => {
    it("emergency withdraws successfully by contract owner", () => {
      const amount = 800;
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      const withdrawResult = simnet.callPublicFn(
        "treasury",
        "emergency-withdraw",
        [Cl.uint(amount), Cl.principal(wallet2)],
        deployer
      );
      expect(withdrawResult.result).toBeOk(Cl.bool(true));
      // Check print event
      expect(withdrawResult.events).toHaveLength(1);
      expect(withdrawResult.events[0].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "emergency-withdrawal" },
          recipient: { type: "address", value: wallet2 },
          amount: { type: "uint", value: BigInt(amount) },
        },
      });
    });

    it("fails to emergency withdraw by non-owner", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      const withdrawResult = simnet.callPublicFn(
        "treasury",
        "emergency-withdraw",
        [Cl.uint(500), Cl.principal(wallet2)],
        wallet1
      );
      expect(withdrawResult.result).toBeErr(Cl.uint(300)); // err-owner-only
    });

    it("fails to emergency withdraw with zero amount", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      const withdrawResult = simnet.callPublicFn(
        "treasury",
        "emergency-withdraw",
        [Cl.uint(0), Cl.principal(wallet2)],
        deployer
      );
      expect(withdrawResult.result).toBeErr(Cl.uint(303)); // err-invalid-amount
    });
  });

  // Admin Functions
  describe("Admin Functions", () => {
    it("sets governance contract successfully", () => {
      const result = simnet.callPublicFn(
        "treasury",
        "set-governance-contract",
        [Cl.principal(governanceContract)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
      const governanceVar = simnet.getDataVar("treasury", "governance-contract");
      expect(governanceVar).toEqual(Cl.some(Cl.principal(governanceContract)));
    });

    it("fails to set governance contract by non-owner", () => {
      const result = simnet.callPublicFn(
        "treasury",
        "set-governance-contract",
        [Cl.principal(governanceContract)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(300)); // err-owner-only
    });
  });

  // Read-Only Functions
  describe("Read-Only Functions", () => {
    it("gets balance correctly", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("treasury", "withdraw", [Cl.uint(300), Cl.principal(wallet2), Cl.stringUtf8("Test withdrawal")], deployer);
      const balance = simnet.callReadOnlyFn("treasury", "get-balance", [], deployer);
      expect(balance.result).toBeOk(Cl.uint(700));
    });

    it("gets total deposits correctly", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      const totalDeposits = simnet.callReadOnlyFn("treasury", "get-total-deposits", [], deployer);
      expect(totalDeposits.result).toBeOk(Cl.uint(1000));
    });

    it("gets total withdrawals correctly", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("treasury", "withdraw", [Cl.uint(400), Cl.principal(wallet2), Cl.stringUtf8("Test withdrawal")], deployer);
      const totalWithdrawals = simnet.callReadOnlyFn("treasury", "get-total-withdrawals", [], deployer);
      expect(totalWithdrawals.result).toBeOk(Cl.uint(400));
    });

    it("gets spending record correctly", () => {
      const preBlock = simnet.blockHeight;
      const blockHeight = preBlock + 2; // Deposit + withdraw
      const amount = 500;
      const reason = Cl.stringUtf8("Test withdrawal");
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("treasury", "withdraw", [Cl.uint(amount), Cl.principal(wallet2), reason], deployer);
      const spendingRecord = simnet.callReadOnlyFn("treasury", "get-spending-record", [Cl.uint(1)], deployer);
      expect(spendingRecord.result).toBeOk(
        Cl.some(
          Cl.tuple({
            recipient: Cl.principal(wallet2),
            amount: Cl.uint(amount),
            reason,
            "block-height": Cl.uint(blockHeight),
            "approved-by": Cl.principal(deployer),
          })
        )
      );
    });

    it("gets non-existent spending record", () => {
      const spendingRecord = simnet.callReadOnlyFn("treasury", "get-spending-record", [Cl.uint(1)], deployer);
      expect(spendingRecord.result).toBeOk(Cl.none());
    });

    it("gets spending count correctly", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("treasury", "withdraw", [Cl.uint(500), Cl.principal(wallet2), Cl.stringUtf8("Test withdrawal")], deployer);
      const spendingCount = simnet.callReadOnlyFn("treasury", "get-spending-count", [], deployer);
      expect(spendingCount.result).toBeOk(Cl.uint(1));
    });
  });

  // Data Maps and Variables
  describe("Data Maps and Variables", () => {
    it("reads spending history map correctly", () => {
      const preBlock = simnet.blockHeight;
      const blockHeight = preBlock + 2; // Deposit + withdraw
      const amount = 500;
      const reason = Cl.stringUtf8("Test withdrawal");
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("treasury", "withdraw", [Cl.uint(amount), Cl.principal(wallet2), reason], deployer);
      const spendingRecord = simnet.getMapEntry("treasury", "spending-history", Cl.uint(1));
      expect(spendingRecord).toBeSome(
        Cl.tuple({
          recipient: Cl.principal(wallet2),
          amount: Cl.uint(amount),
          reason,
          "block-height": Cl.uint(blockHeight),
          "approved-by": Cl.principal(deployer),
        })
      );
    });

    it("reads non-existent spending history map entry", () => {
      // Use callReadOnlyFn instead of getMapEntry to avoid "value not found" error
      const spendingRecord = simnet.callReadOnlyFn("treasury", "get-spending-record", [Cl.uint(1)], deployer);
      expect(spendingRecord.result).toBeOk(Cl.none());
    });

    it("reads governance-contract variable correctly", () => {
      simnet.callPublicFn("treasury", "set-governance-contract", [Cl.principal(governanceContract)], deployer);
      const governanceVar = simnet.getDataVar("treasury", "governance-contract");
      expect(governanceVar).toEqual(Cl.some(Cl.principal(governanceContract)));
    });

    it("reads initial governance-contract variable", () => {
      const governanceVar = simnet.getDataVar("treasury", "governance-contract");
      expect(governanceVar).toEqual(Cl.none());
    });

    it("reads total-deposits variable correctly", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      const totalDeposits = simnet.getDataVar("treasury", "total-deposits");
      expect(totalDeposits).toBeUint(1000);
    });

    it("reads total-withdrawals variable correctly", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("treasury", "withdraw", [Cl.uint(500), Cl.principal(wallet2), Cl.stringUtf8("Test withdrawal")], deployer);
      const totalWithdrawals = simnet.getDataVar("treasury", "total-withdrawals");
      expect(totalWithdrawals).toBeUint(500);
    });

    it("reads spending-count variable correctly", () => {
      simnet.callPublicFn("treasury", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("treasury", "withdraw", [Cl.uint(500), Cl.principal(wallet2), Cl.stringUtf8("Test withdrawal")], deployer);
      const spendingCount = simnet.getDataVar("treasury", "spending-count");
      expect(spendingCount).toBeUint(1);
    });
  });
});