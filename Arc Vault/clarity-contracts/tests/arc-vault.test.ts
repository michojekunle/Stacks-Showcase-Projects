import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

// Test constants
const CONTRACT_NAME = "arc-vault";
const PRECISION = 1_000_000;
const MIN_FIRST_DEPOSIT = 1_000_000;

// Error codes
const ERR_UNAUTHORIZED = 1000;
const ERR_PAUSED = 1001;
const ERR_ZERO_AMOUNT = 1002;
const ERR_INSUFFICIENT_BALANCE = 1003;
const ERR_INSUFFICIENT_COLLATERAL = 1004;
const ERR_FIRST_DEPOSIT_TOO_SMALL = 1007;

// Helper to extract Clarity value
const cvToValue = (cv: any): any => {
  if (!cv) return undefined;
  if (cv.type === 'uint') return cv.value;
  if (cv.type === 'int') return cv.value;
  if (cv.type === 'bool') return cv.value;
  if (cv.type === 'address') return cv.value;
  if (cv.type === 'ascii') return cv.value;
  if (cv.type === 'tuple') {
    const result: any = {};
    for (const [key, value] of Object.entries(cv.value)) {
      result[key] = cvToValue(value);
    }
    return result;
  }
  return cv;
};

describe("Arc Vault Contract Tests", () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const user1 = accounts.get("wallet_1")!;
  const user2 = accounts.get("wallet_2")!;
  const user3 = accounts.get("wallet_3")!;

  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  // ========================================
  // DEPLOYMENT & INITIALIZATION TESTS
  // ========================================

  describe("Contract Initialization", () => {
    it("should initialize with correct token metadata", () => {
      const name = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-name",
        [],
        deployer
      );
      expect(name.result).toBeOk(Cl.stringAscii("Arc Vault STX"));

      const symbol = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-symbol",
        [],
        deployer
      );
      expect(symbol.result).toBeOk(Cl.stringAscii("vSTX"));

      const decimals = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-decimals",
        [],
        deployer
      );
      expect(decimals.result).toBeOk(Cl.uint(6));
    });

    it("should initialize with zero balances and correct admin", () => {
      const stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        deployer
      );

      const statsValue = cvToValue(stats.result);
      expect(statsValue["total-stx-collateral"]).toBe(0n);
      expect(statsValue["total-vstx-supply"]).toBe(0n);
      expect(statsValue["share-price"]).toBe(BigInt(PRECISION));
      expect(statsValue["is-paused"].type).toBe("false");
      expect(statsValue["admin"]).toBe(deployer);
    });

    it("should have 1:1 share price initially", () => {
      const sharePrice = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-share-price",
        [],
        deployer
      );
      expect(sharePrice.result).toBeOk(Cl.uint(PRECISION));
    });
  });

  // ========================================
  // DEPOSIT TESTS
  // ========================================

  describe("Deposit Functionality", () => {
    it("should allow first deposit at 1:1 ratio", () => {
      const depositAmount = 10_000_000; // 10 STX
      
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(depositAmount)],
        user1
      );

      expect(result.result).toBeOk(Cl.uint(depositAmount));

      // Check balance
      const balance = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-balance",
        [Cl.principal(user1)],
        user1
      );
      expect(cvToValue(balance.result)).toBe(BigInt(depositAmount));

      // Check stats
      const stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        user1
      );
      const statsValue = cvToValue(stats.result);
      expect(statsValue["total-stx-collateral"]).toBe(BigInt(depositAmount));
      expect(statsValue["total-vstx-supply"]).toBe(BigInt(depositAmount));
    });

    it("should reject first deposit below minimum", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(MIN_FIRST_DEPOSIT - 1)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(ERR_FIRST_DEPOSIT_TOO_SMALL));
    });

    it("should reject zero amount deposits", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(0)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(ERR_ZERO_AMOUNT));
    });

    it("should handle multiple deposits correctly", () => {
      // First deposit
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(10_000_000)],
        user1
      );

      // Second deposit from different user
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(5_000_000)],
        user2
      );

      expect(result.result).toBeOk(Cl.uint(5_000_000));

      const stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        user1
      );
      const statsValue = cvToValue(stats.result);
      expect(statsValue["total-stx-collateral"]).toBe(15_000_000n);
      expect(statsValue["total-vstx-supply"]).toBe(15_000_000n);
    });

    it("should calculate shares correctly after yield addition", () => {
      // Initial deposit
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(10_000_000)],
        user1
      );

      // Admin adds yield (increases share price)
      simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-add-yield",
        [Cl.uint(1_000_000)], // +10% yield
        deployer
      );

      // Check new share price (should be ~1.1)
      const sharePrice = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-share-price",
        [],
        user1
      );
      expect(sharePrice.result).toBeOk(Cl.uint(1_100_000));

      // New user deposits same amount, should get fewer shares
      const preview = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "preview-deposit",
        [Cl.uint(11_000_000)],
        user2
      );
      expect(preview.result).toBeOk(Cl.uint(10_000_000)); // Gets 10M shares for 11M STX

      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(11_000_000)],
        user2
      );
      expect(result.result).toBeOk(Cl.uint(10_000_000));
    });

    it("should emit correct deposit events", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(5_000_000)],
        user1
      );

      // Events include: STX transfer, FT mint, and print event
      expect(result.events.length).toBeGreaterThanOrEqual(2);
      
      const printEvent = result.events.find(e => e.event === "print_event");
      expect(printEvent).toBeDefined();
      
      if (printEvent) {
        const eventData = cvToValue(printEvent.data.value);
        expect(eventData.type).toBe("deposit");
        expect(eventData["stx-amount"]).toBe(5_000_000n);
        expect(eventData["vstx-minted"]).toBe(5_000_000n);
      }
    });
  });

  // ========================================
  // WITHDRAW TESTS
  // ========================================

  describe("Withdraw Functionality", () => {
    beforeEach(() => {
      // Setup: User1 deposits 10 STX
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(10_000_000)],
        user1
      );
    });

    it("should allow full withdrawal", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(10_000_000)],
        user1
      );

      expect(result.result).toBeOk(Cl.uint(10_000_000));

      // Check balance is zero
      const balance = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-balance",
        [Cl.principal(user1)],
        user1
      );
      expect(cvToValue(balance.result)).toBe(0n);

      // Check stats
      const stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        user1
      );
      const statsValue = cvToValue(stats.result);
      expect(statsValue["total-stx-collateral"]).toBe(0n);
      expect(statsValue["total-vstx-supply"]).toBe(0n);
    });

    it("should allow partial withdrawal", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(3_000_000)],
        user1
      );

      expect(result.result).toBeOk(Cl.uint(3_000_000));

      const balance = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-balance",
        [Cl.principal(user1)],
        user1
      );
      expect(cvToValue(balance.result)).toBe(7_000_000n);
    });

    it("should reject withdrawal with insufficient balance", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(11_000_000)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(ERR_INSUFFICIENT_BALANCE));
    });

    it("should reject zero amount withdrawals", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(0)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(ERR_ZERO_AMOUNT));
    });

    it("should calculate withdrawal correctly after yield", () => {
      // Add 20% yield
      simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-add-yield",
        [Cl.uint(2_000_000)],
        deployer
      );

      // Withdraw all shares
      const preview = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "preview-withdraw",
        [Cl.uint(10_000_000)],
        user1
      );
      expect(preview.result).toBeOk(Cl.uint(12_000_000)); // Gets 12 STX back

      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(10_000_000)],
        user1
      );
      expect(result.result).toBeOk(Cl.uint(12_000_000));
    });

    it("should handle multiple users withdrawing proportionally", () => {
      // User2 also deposits
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(10_000_000)],
        user2
      );

      // Add yield
      simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-add-yield",
        [Cl.uint(4_000_000)], // Total: 24M STX, 20M shares
        deployer
      );

      // Each user has 10M shares, should get 12M STX each
      const result1 = simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(10_000_000)],
        user1
      );
      expect(result1.result).toBeOk(Cl.uint(12_000_000));

      const result2 = simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(10_000_000)],
        user2
      );
      expect(result2.result).toBeOk(Cl.uint(12_000_000));
    });

    it("should emit correct withdraw events", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(5_000_000)],
        user1
      );

      const printEvent = result.events.find(e => e.event === "print_event");
      expect(printEvent).toBeDefined();
      
      if (printEvent) {
        const eventData = cvToValue(printEvent.data.value);
        expect(eventData.type).toBe("withdraw");
        expect(eventData["vstx-burned"]).toBe(5_000_000n);
        expect(eventData["stx-returned"]).toBe(5_000_000n);
      }
    });
  });

  // ========================================
  // ADMIN FUNCTION TESTS
  // ========================================

  describe("Admin Functions", () => {
    it("should allow admin to add yield", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(10_000_000)],
        user1
      );

      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-add-yield",
        [Cl.uint(1_000_000)],
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        deployer
      );
      const statsValue = cvToValue(stats.result);
      expect(statsValue["total-stx-collateral"]).toBe(11_000_000n);
      expect(statsValue["share-price"]).toBe(1_100_000n);
    });

    it("should reject non-admin yield addition", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-add-yield",
        [Cl.uint(1_000_000)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(ERR_UNAUTHORIZED));
    });

    it("should allow admin to manage sBTC reserve", () => {
      const deposit = simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-deposit-sbtc",
        [Cl.uint(5_000_000)],
        deployer
      );
      expect(deposit.result).toBeOk(Cl.bool(true));

      let stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        deployer
      );
      let statsValue = cvToValue(stats.result);
      expect(statsValue["total-sbtc-reserve"]).toBe(5_000_000n);

      const withdraw = simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-withdraw-sbtc",
        [Cl.uint(2_000_000)],
        deployer
      );
      expect(withdraw.result).toBeOk(Cl.bool(true));

      stats = simnet.callReadOnlyFn(CONTRACT_NAME, "get-stats", [], deployer);
      statsValue = cvToValue(stats.result);
      expect(statsValue["total-sbtc-reserve"]).toBe(3_000_000n);
    });

    it("should reject non-admin sBTC management", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-deposit-sbtc",
        [Cl.uint(1_000_000)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(ERR_UNAUTHORIZED));
    });

    it("should allow admin to pause contract", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-paused",
        [Cl.bool(true)],
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        deployer
      );
      const statsValue = cvToValue(stats.result);
      expect(statsValue["is-paused"].type).toBe("true");
    });

    it("should reject deposits when paused", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-paused",
        [Cl.bool(true)],
        deployer
      );

      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(5_000_000)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(ERR_PAUSED));
    });

    it("should reject withdrawals when paused", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(5_000_000)],
        user1
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-paused",
        [Cl.bool(true)],
        deployer
      );

      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(1_000_000)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(ERR_PAUSED));
    });

    it("should allow admin transfer", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "transfer-admin",
        [Cl.principal(user1)],
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        deployer
      );
      const statsValue = cvToValue(stats.result);
      expect(statsValue["admin"]).toBe(user1);

      // Old admin can no longer perform admin actions
      const pauseResult = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-paused",
        [Cl.bool(true)],
        deployer
      );
      expect(pauseResult.result).toBeErr(Cl.uint(ERR_UNAUTHORIZED));

      // New admin can perform admin actions
      const newPauseResult = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-paused",
        [Cl.bool(true)],
        user1
      );
      expect(newPauseResult.result).toBeOk(Cl.bool(true));
    });
  });

  // ========================================
  // SIP-010 TRANSFER TESTS
  // ========================================

  describe("SIP-010 Token Transfer", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(10_000_000)],
        user1
      );
    });

    it("should allow token transfers", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "transfer",
        [
          Cl.uint(3_000_000),
          Cl.principal(user1),
          Cl.principal(user2),
          Cl.none(),
        ],
        user1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const balance1 = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-balance",
        [Cl.principal(user1)],
        user1
      );
      expect(cvToValue(balance1.result)).toBe(7_000_000n);

      const balance2 = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-balance",
        [Cl.principal(user2)],
        user2
      );
      expect(cvToValue(balance2.result)).toBe(3_000_000n);
    });

    it("should reject transfers from non-sender", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "transfer",
        [
          Cl.uint(3_000_000),
          Cl.principal(user1),
          Cl.principal(user2),
          Cl.none(),
        ],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(ERR_UNAUTHORIZED));
    });

    it("should allow transfers with memo", () => {
      const memo = new TextEncoder().encode("test transfer");
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "transfer",
        [
          Cl.uint(1_000_000),
          Cl.principal(user1),
          Cl.principal(user2),
          Cl.some(Cl.buffer(memo)),
        ],
        user1
      );

      expect(result.result).toBeOk(Cl.bool(true));

    //   // Check that print event was emitted
    //   const printEvent = result.events.find(e => e.event === "print_event");
    //   expect(printEvent).toBeDefined();
    });
  });

  // ========================================
  // EDGE CASES & STRESS TESTS
  // ========================================

  describe("Edge Cases", () => {
    it("should handle very large deposits", () => {
      const largeAmount = 1_000_000_000_000; // 1M STX
      
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(largeAmount)],
        user1
      );

      expect(result.result).toBeOk(Cl.uint(largeAmount));
    });

    it("should maintain precision across multiple operations", () => {
      // Deposit
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(10_000_000)],
        user1
      );

      // Add small yield multiple times
      for (let i = 0; i < 10; i++) {
        simnet.callPublicFn(
          CONTRACT_NAME,
          "admin-add-yield",
          [Cl.uint(100_000)],
          deployer
        );
      }

      const stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        user1
      );
      const statsValue = cvToValue(stats.result);
      expect(statsValue["total-stx-collateral"]).toBe(11_000_000n);
      expect(statsValue["share-price"]).toBe(1_100_000n);
    });

    it("should handle rapid deposit/withdraw cycles", () => {
      for (let i = 0; i < 5; i++) {
        simnet.callPublicFn(
          CONTRACT_NAME,
          "deposit",
          [Cl.uint(2_000_000)],
          user1
        );

        simnet.callPublicFn(
          CONTRACT_NAME,
          "withdraw",
          [Cl.uint(1_000_000)],
          user1
        );
      }

      const balance = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-balance",
        [Cl.principal(user1)],
        user1
      );
      expect(cvToValue(balance.result)).toBe(5_000_000n);
    });

    it("should handle share price calculation with minimal amounts", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(MIN_FIRST_DEPOSIT)],
        user1
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-add-yield",
        [Cl.uint(1)],
        deployer
      );

      const sharePrice = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-share-price",
        [],
        user1
      );
      expect(sharePrice.result).toBeOk(Cl.uint(PRECISION + 1));
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  describe("Integration Scenarios", () => {
    it("should simulate complete vault lifecycle", () => {
      // 1. Initial deposit
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(100_000_000)],
        user1
      );

      // 2. Second user deposits
      simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(50_000_000)],
        user2
      );

      // 3. Admin adds yield
      simnet.callPublicFn(
        CONTRACT_NAME,
        "admin-add-yield",
        [Cl.uint(15_000_000)],
        deployer
      );

      // 4. Third user deposits at higher share price
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "deposit",
        [Cl.uint(55_000_000)],
        user3
      );
      expect(result.result).toBeOk(Cl.uint(50_000_000)); // Gets 50M shares

      // 5. User1 withdraws half
      simnet.callPublicFn(
        CONTRACT_NAME,
        "withdraw",
        [Cl.uint(50_000_000)],
        user1
      );

      // 6. Check final state
      const stats = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-stats",
        [],
        deployer
      );
      const statsValue = cvToValue(stats.result);
      
      expect(statsValue["total-vstx-supply"]).toBe(150_000_000n);
      expect(Number(statsValue["share-price"])).toBeGreaterThan(PRECISION);
    });
  });
});