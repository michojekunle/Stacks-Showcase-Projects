;; treasury.clar
;; DAO Treasury Management Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u300))
(define-constant err-unauthorized (err u301))
(define-constant err-insufficient-balance (err u302))
(define-constant err-invalid-amount (err u303))
(define-constant err-transfer-failed (err u304))

;; Data Variables
(define-data-var governance-contract (optional principal) none)
(define-data-var total-deposits uint u0)
(define-data-var total-withdrawals uint u0)

;; Data Maps
(define-map spending-history
  uint
  {
    recipient: principal,
    amount: uint,
    reason: (string-utf8 256),
    block-height: uint,
    approved-by: principal
  }
)

(define-data-var spending-count uint u0)

;; Treasury Functions

(define-public (deposit (amount uint))
  (begin
    (asserts! (> amount u0) err-invalid-amount)
    ;; In production, handle STX or sBTC transfer here
    (var-set total-deposits (+ (var-get total-deposits) amount))
    (print {event: "deposit", sender: tx-sender, amount: amount})
    (ok true)
  )
)

(define-public (withdraw (amount uint) (recipient principal) (reason (string-utf8 256)))
  (let
    (
      (spending-id (+ (var-get spending-count) u1))
    )
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (is-authorized tx-sender) err-unauthorized)
    
    ;; Record spending
    (map-set spending-history spending-id {
      recipient: recipient,
      amount: amount,
      reason: reason,
      block-height: stacks-block-height,
      approved-by: tx-sender
    })
    
    (var-set spending-count spending-id)
    (var-set total-withdrawals (+ (var-get total-withdrawals) amount))
    
    ;; In production, transfer STX or sBTC to recipient here
    (print {
      event: "withdrawal",
      spending-id: spending-id,
      recipient: recipient,
      amount: amount,
      reason: reason
    })
    (ok true)
  )
)

;; Read-Only Functions

(define-read-only (get-balance)
  (ok (- (var-get total-deposits) (var-get total-withdrawals)))
)

(define-read-only (get-total-deposits)
  (ok (var-get total-deposits))
)

(define-read-only (get-total-withdrawals)
  (ok (var-get total-withdrawals))
)

(define-read-only (get-spending-record (spending-id uint))
  (ok (map-get? spending-history spending-id))
)

(define-read-only (get-spending-count)
  (ok (var-get spending-count))
)

;; Helper Functions

(define-private (is-authorized (caller principal))
  (or
    (is-eq caller contract-owner)
    (match (var-get governance-contract)
      gov-contract (is-eq caller gov-contract)
      false
    )
  )
)

;; Admin Functions

(define-public (set-governance-contract (contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set governance-contract (some contract))
    (ok true)
  )
)

(define-public (emergency-withdraw (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (> amount u0) err-invalid-amount)
    ;; In production, transfer STX or sBTC to recipient here
    (print {event: "emergency-withdrawal", recipient: recipient, amount: amount})
    (ok true)
  )
)
