import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Vote Token Contract", () => {
  // Test contract deployment
  it("ensures the contract is deployed", () => {
    const contractSource = simnet.getContractSource("vote-token");
    expect(contractSource).toBeDefined();
  });

  // SIP-010 Functions
  describe("SIP-010 Functions", () => {
    it("returns correct token name", () => {
      const result = simnet.callReadOnlyFn(
        "vote-token",
        "get-name",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.stringAscii("Vote Token"));
    });

    it("returns correct token symbol", () => {
      const result = simnet.callReadOnlyFn(
        "vote-token",
        "get-symbol",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.stringAscii("VOTE"));
    });

    it("returns correct token decimals", () => {
      const result = simnet.callReadOnlyFn(
        "vote-token",
        "get-decimals",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(6));
    });

    it("returns correct token URI", () => {
      const result = simnet.callReadOnlyFn(
        "vote-token",
        "get-token-uri",
        [],
        deployer
      );
      expect(result.result).toBeOk(
        Cl.some(
          Cl.stringUtf8("https://sbtcvoter.vercel.app/token-metadata.json")
        )
      );
    });

    it("returns initial total supply as zero", () => {
      const result = simnet.callReadOnlyFn(
        "vote-token",
        "get-total-supply",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(0));
    });

    it("returns zero balance for new account", () => {
      const result = simnet.callReadOnlyFn(
        "vote-token",
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(0));
    });

    it("transfers tokens successfully", () => {
      // Mint 1000 tokens to wallet1
      simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(1000), Cl.principal(wallet1)],
        deployer
      );
      // Transfer 500 tokens from wallet1 to wallet2
      const transferResult = simnet.callPublicFn(
        "vote-token",
        "transfer",
        [Cl.uint(500), Cl.principal(wallet1), Cl.principal(wallet2), Cl.none()],
        wallet1
      );
      expect(transferResult.result).toBeOk(Cl.bool(true));
      // Check balances
      const balance1 = simnet.callReadOnlyFn(
        "vote-token",
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      const balance2 = simnet.callReadOnlyFn(
        "vote-token",
        "get-balance",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(balance1.result).toBeOk(Cl.uint(500));
      expect(balance2.result).toBeOk(Cl.uint(500));
      // Check events
      expect(transferResult.events).toHaveLength(1); // FT transfer event
      // expect(transferResult.events[0].type).toBe("ft_transfer_event");
      expect(transferResult.events[0].data).toMatchObject({
        asset_identifier: expect.stringContaining("vote-token::vote-token"),
        sender: wallet1,
        recipient: wallet2,
        amount: "500",
      });
    });

    it("fails transfer if sender is not tx-sender", () => {
      simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(1000), Cl.principal(wallet1)],
        deployer
      );
      const transferResult = simnet.callPublicFn(
        "vote-token",
        "transfer",
        [Cl.uint(500), Cl.principal(wallet1), Cl.principal(wallet2), Cl.none()],
        wallet2 // Wrong sender
      );
      expect(transferResult.result).toBeErr(Cl.uint(101)); // err-not-token-owner
    });

    it("fails transfer with zero amount", () => {
      simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(1000), Cl.principal(wallet1)],
        deployer
      );
      const transferResult = simnet.callPublicFn(
        "vote-token",
        "transfer",
        [Cl.uint(0), Cl.principal(wallet1), Cl.principal(wallet2), Cl.none()],
        wallet1
      );
      expect(transferResult.result).toBeErr(Cl.uint(103)); // err-invalid-amount
    });

    it("fails transfer with insufficient balance", () => {
      simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(100), Cl.principal(wallet1)],
        deployer
      );
      const transferResult = simnet.callPublicFn(
        "vote-token",
        "transfer",
        [Cl.uint(200), Cl.principal(wallet1), Cl.principal(wallet2), Cl.none()],
        wallet1
      );
      expect(transferResult.result).toBeErr(Cl.uint(1)); // Generic FT error for insufficient balance
    });
  });

  // Minting and Burning
  describe("Minting and Burning Functions", () => {
    it("mints tokens successfully", () => {
      const mintResult = simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(1000), Cl.principal(wallet1)],
        deployer
      );
      expect(mintResult.result).toBeOk(Cl.bool(true));
      // Check balance and total supply
      const balance = simnet.callReadOnlyFn(
        "vote-token",
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      const totalSupply = simnet.callReadOnlyFn(
        "vote-token",
        "get-total-supply",
        [],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(1000));
      expect(totalSupply.result).toBeOk(Cl.uint(1000));
      // Check print event
      expect(mintResult.events).toHaveLength(2); // FT mint event + print event
      expect(mintResult.events[1].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "mint" },
          amount: { type: "uint", value: 1000n },
          recipient: { type: "address", value: wallet1 },
          "sbtc-paid": { type: "uint", value: 1n },
        },
      });
    });

    it("fails mint with zero amount", () => {
      const mintResult = simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(0), Cl.principal(wallet1)],
        deployer
      );
      expect(mintResult.result).toBeErr(Cl.uint(103)); // err-invalid-amount
    });

    it("burns tokens successfully", () => {
      simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(1000), Cl.principal(wallet1)],
        deployer
      );
      const burnResult = simnet.callPublicFn(
        "vote-token",
        "burn",
        [Cl.uint(500)],
        wallet1
      );
      expect(burnResult.result).toBeOk(Cl.bool(true));
      // Check balance and total supply
      const balance = simnet.callReadOnlyFn(
        "vote-token",
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      const totalSupply = simnet.callReadOnlyFn(
        "vote-token",
        "get-total-supply",
        [],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(500));
      expect(totalSupply.result).toBeOk(Cl.uint(500));
      // Check print event
      expect(burnResult.events).toHaveLength(2); // FT burn event + print event
      expect(burnResult.events[1].data.value).toEqual({
        type: "tuple",
        value: {
          event: { type: "ascii", value: "burn" },
          amount: { type: "uint", value: 500n },
          sender: { type: "address", value: wallet1 },
          "sbtc-returned": { type: "uint", value: 0n },
        },
      });
    });

    it("fails burn with zero amount", () => {
      simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(1000), Cl.principal(wallet1)],
        deployer
      );
      const burnResult = simnet.callPublicFn(
        "vote-token",
        "burn",
        [Cl.uint(0)],
        wallet1
      );
      expect(burnResult.result).toBeErr(Cl.uint(103)); // err-invalid-amount
    });

    it("fails burn with insufficient balance", () => {
      simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(100), Cl.principal(wallet1)],
        deployer
      );
      const burnResult = simnet.callPublicFn(
        "vote-token",
        "burn",
        [Cl.uint(200)],
        wallet1
      );
      expect(burnResult.result).toBeErr(Cl.uint(102)); // err-insufficient-balance
    });
  });

  // Helper Functions
  describe("Helper Functions", () => {
    it("returns correct exchange rate", () => {
      const result = simnet.callReadOnlyFn(
        "vote-token",
        "get-exchange-rate",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(1000));
    });

    it("calculates sBTC cost correctly", () => {
      const result = simnet.callReadOnlyFn(
        "vote-token",
        "calculate-sbtc-cost",
        [Cl.uint(1000)],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(1)); // 1000 * 1000 / 1000000 = 1
    });

    it("calculates vote amount from sBTC correctly", () => {
      const result = simnet.callReadOnlyFn(
        "vote-token",
        "calculate-vote-amount",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(1000)); // 1 * 1000000 / 1000 = 1000
    });
  });

  // Admin Functions
  describe("Admin Functions", () => {
    it("sets token URI successfully by owner", () => {
      const newUri = Cl.stringUtf8("https://new-uri.example.com");
      const result = simnet.callPublicFn(
        "vote-token",
        "set-token-uri",
        [newUri],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
      const updatedUri = simnet.callReadOnlyFn(
        "vote-token",
        "get-token-uri",
        [],
        deployer
      );
      expect(updatedUri.result).toBeOk(Cl.some(newUri));
    });

    it("fails to set token URI by non-owner", () => {
      const newUri = Cl.stringUtf8("https://new-uri.example.com");
      const result = simnet.callPublicFn(
        "vote-token",
        "set-token-uri",
        [newUri],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(100)); // err-owner-only
    });
  });

  // Data Variables
  describe("Data Variables", () => {
    it("reads total-supply correctly", () => {
      simnet.callPublicFn(
        "vote-token",
        "mint",
        [Cl.uint(1000), Cl.principal(wallet1)],
        deployer
      );
      const totalSupply = simnet.getDataVar("vote-token", "total-supply");
      expect(totalSupply).toBeUint(1000);
    });

    it("reads token-uri correctly", () => {
      const tokenUri = simnet.getDataVar("vote-token", "token-uri");
      expect(tokenUri).toBeSome(
        Cl.stringUtf8("https://sbtcvoter.vercel.app/token-metadata.json")
      );
    });
  });
});
