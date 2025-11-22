;; Arc Vault - Liquid Staking Vault for STX
;; SIP-010 compliant vSTX token with instant redemptions
;; Share-price model: total-collateral / total-shares

;; ========================================
;; CONSTANTS & ERRORS
;; ========================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_PAUSED (err u1001))
(define-constant ERR_ZERO_AMOUNT (err u1002))
(define-constant ERR_INSUFFICIENT_BALANCE (err u1003))
(define-constant ERR_INSUFFICIENT_COLLATERAL (err u1004))
(define-constant ERR_MATH_OVERFLOW (err u1005))
(define-constant ERR_INVALID_SHARE_PRICE (err u1006))
(define-constant ERR_FIRST_DEPOSIT_TOO_SMALL (err u1007))
(define-constant ERR_DIVISION_BY_ZERO (err u1008))

(define-constant PRECISION u1000000) ;; 6 decimals
(define-constant MIN_FIRST_DEPOSIT u1000000) ;; 1 STX minimum first deposit

;; ========================================
;; DATA VARIABLES
;; ========================================

(define-data-var contract-paused bool false)
(define-data-var admin-address principal CONTRACT_OWNER)
(define-data-var total-stx-collateral uint u0)
(define-data-var total-sbtc-reserve uint u0)
(define-data-var total-vstx-supply uint u0)

;; ========================================
;; SIP-010 TOKEN TRAIT
;; ========================================

(define-fungible-token vSTX)

(define-read-only (get-name)
  (ok "Arc Vault STX"))

(define-read-only (get-symbol)
  (ok "vSTX"))

(define-read-only (get-decimals)
  (ok u6))

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance vSTX account)))

(define-read-only (get-total-supply)
  (ok (ft-get-supply vSTX)))

(define-read-only (get-token-uri)
  (ok (some u"https://arcvault.io/metadata/vstx.json")))

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (try! (ft-transfer? vSTX amount sender recipient))
    ;; (match memo to-print (print {type: "transfer", amount: amount, sender: sender, recipient: recipient, memo: to-print}) 0x)
    (ok true)))

;; ========================================
;; INTERNAL HELPERS
;; ========================================

(define-private (safe-multiply (a uint) (b uint))
  (let ((result (* a b)))
    (asserts! (or (is-eq a u0) (is-eq (/ result a) b)) ERR_MATH_OVERFLOW)
    (ok result)))

(define-private (safe-divide (a uint) (b uint))
  (if (is-eq b u0)
    ERR_DIVISION_BY_ZERO
    (ok (/ a b))))

;; Calculate share price: (total-collateral * PRECISION) / total-shares
(define-read-only (get-share-price)
  (let (
    (collateral (var-get total-stx-collateral))
    (supply (var-get total-vstx-supply))
  )
    (if (is-eq supply u0)
      (ok PRECISION) ;; 1:1 for first depositor
      (if (is-eq collateral u0)
        (ok PRECISION)
        (ok (/ (* collateral PRECISION) supply))))))

;; Calculate shares to mint: (stx-amount * total-shares) / total-collateral
(define-private (calculate-shares-to-mint (stx-amount uint))
  (let (
    (supply (var-get total-vstx-supply))
    (collateral (var-get total-stx-collateral))
  )
    (if (is-eq supply u0)
      ;; First deposit: 1:1 ratio
      (ok stx-amount)
      ;; Subsequent deposits: proportional to share price
      (if (is-eq collateral u0)
        ERR_DIVISION_BY_ZERO
        (ok (/ (* stx-amount supply) collateral))))))

;; Calculate STX to return: (shares * total-collateral) / total-shares
(define-private (calculate-stx-to-return (share-amount uint))
  (let (
    (supply (var-get total-vstx-supply))
    (collateral (var-get total-stx-collateral))
  )
    (if (is-eq supply u0)
      ERR_DIVISION_BY_ZERO
      (ok (/ (* share-amount collateral) supply)))))

;; ========================================
;; PUBLIC READ FUNCTIONS
;; ========================================

(define-read-only (get-stats)
  {
    total-stx-collateral: (var-get total-stx-collateral),
    total-sbtc-reserve: (var-get total-sbtc-reserve),
    total-vstx-supply: (var-get total-vstx-supply),
    share-price: (unwrap-panic (get-share-price)),
    is-paused: (var-get contract-paused),
    admin: (var-get admin-address)
  })

(define-read-only (get-user-balance (user principal))
  (ft-get-balance vSTX user))

(define-read-only (preview-deposit (stx-amount uint))
  (calculate-shares-to-mint stx-amount))

(define-read-only (preview-withdraw (share-amount uint))
  (calculate-stx-to-return share-amount))

;; ========================================
;; CORE VAULT FUNCTIONS
;; ========================================

(define-public (deposit (stx-amount uint))
  (let (
    (caller tx-sender)
    (is-first-deposit (is-eq (var-get total-vstx-supply) u0))
  )
    ;; Checks
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (> stx-amount u0) ERR_ZERO_AMOUNT)
    (asserts! (or (not is-first-deposit) (>= stx-amount MIN_FIRST_DEPOSIT)) ERR_FIRST_DEPOSIT_TOO_SMALL)
    
    ;; Calculate shares after checks
    (let (
      (shares-to-mint (try! (calculate-shares-to-mint stx-amount)))
    )
      ;; Effects
      (var-set total-stx-collateral (+ (var-get total-stx-collateral) stx-amount))
      (var-set total-vstx-supply (+ (var-get total-vstx-supply) shares-to-mint))
      
      ;; Interactions
      (try! (stx-transfer? stx-amount caller (as-contract tx-sender)))
      (try! (ft-mint? vSTX shares-to-mint caller))
      
      ;; Event
      (print {
        type: "deposit",
        user: caller,
        stx-amount: stx-amount,
        vstx-minted: shares-to-mint,
        new-share-price: (unwrap-panic (get-share-price)),
        timestamp: stacks-block-height
      })
      
      (ok shares-to-mint))))

(define-public (withdraw (share-amount uint))
  (let (
    (caller tx-sender)
  )
    ;; Checks
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (> share-amount u0) ERR_ZERO_AMOUNT)
    (asserts! (>= (ft-get-balance vSTX caller) share-amount) ERR_INSUFFICIENT_BALANCE)
    
    ;; Calculate STX after checks
    (let (
      (stx-to-return (try! (calculate-stx-to-return share-amount)))
    )
      (asserts! (>= (var-get total-stx-collateral) stx-to-return) ERR_INSUFFICIENT_COLLATERAL)
      
      ;; Effects
      (var-set total-stx-collateral (- (var-get total-stx-collateral) stx-to-return))
      (var-set total-vstx-supply (- (var-get total-vstx-supply) share-amount))
      
      ;; Interactions
      (try! (ft-burn? vSTX share-amount caller))
      (try! (as-contract (stx-transfer? stx-to-return tx-sender caller)))
      
      ;; Event
      (print {
        type: "withdraw",
        user: caller,
        vstx-burned: share-amount,
        stx-returned: stx-to-return,
        new-share-price: (unwrap-panic (get-share-price)),
        timestamp: stacks-block-height
      })
      
      (ok stx-to-return))))

;; ========================================
;; ADMIN FUNCTIONS
;; ========================================

(define-public (admin-deposit-sbtc (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin-address)) ERR_UNAUTHORIZED)
    (var-set total-sbtc-reserve (+ (var-get total-sbtc-reserve) amount))
    
    (print {
      type: "admin-sbtc-deposit",
      amount: amount,
      new-reserve: (var-get total-sbtc-reserve),
      timestamp: stacks-block-height
    })
    
    (ok true)))

(define-public (admin-withdraw-sbtc (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin-address)) ERR_UNAUTHORIZED)
    (asserts! (>= (var-get total-sbtc-reserve) amount) ERR_INSUFFICIENT_BALANCE)
    (var-set total-sbtc-reserve (- (var-get total-sbtc-reserve) amount))
    
    (print {
      type: "admin-sbtc-withdraw",
      amount: amount,
      new-reserve: (var-get total-sbtc-reserve),
      timestamp: stacks-block-height
    })
    
    (ok true)))

(define-public (admin-add-yield (stx-amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin-address)) ERR_UNAUTHORIZED)
    (asserts! (> stx-amount u0) ERR_ZERO_AMOUNT)
    
    ;; Add yield to collateral without minting shares (increases share price)
    (try! (stx-transfer? stx-amount tx-sender (as-contract tx-sender)))
    (var-set total-stx-collateral (+ (var-get total-stx-collateral) stx-amount))
    
    (print {
      type: "yield-added",
      amount: stx-amount,
      new-share-price: (unwrap-panic (get-share-price)),
      timestamp: stacks-block-height
    })
    
    (ok true)))

(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin-address)) ERR_UNAUTHORIZED)
    (var-set contract-paused paused)
    
    (print {
      type: "pause-state-changed",
      paused: paused,
      timestamp: stacks-block-height
    })
    
    (ok true)))

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin-address)) ERR_UNAUTHORIZED)
    (var-set admin-address new-admin)
    
    (print {
      type: "admin-transferred",
      old-admin: tx-sender,
      new-admin: new-admin,
      timestamp: stacks-block-height
    })
    
    (ok true)))