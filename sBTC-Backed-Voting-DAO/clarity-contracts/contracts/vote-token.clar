;; vote-token.clar
;; SIP-010 Compliant Vote Token backed by sBTC

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-insufficient-balance (err u102))
(define-constant err-invalid-amount (err u103))
(define-constant err-insufficient-sbtc (err u104))
(define-constant err-transfer-failed (err u105))

;; Exchange rate: 1 VOTE = 0.00001 sBTC (in micro units: 1 VOTE = 1000 sats)
(define-constant exchange-rate u1000)

;; SIP-010 Token Definition
(define-fungible-token vote-token)

;; Data Variables
(define-data-var token-name (string-ascii 32) "Vote Token")
(define-data-var token-symbol (string-ascii 10) "VOTE")
(define-data-var token-decimals uint u6)
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://sbtcvoter.vercel.app/token-metadata.json"))
(define-data-var total-supply uint u0)

;; SIP-010 Functions

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (asserts! (> amount u0) err-invalid-amount)
    (try! (ft-transfer? vote-token amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

(define-read-only (get-name)
  (ok (var-get token-name))
)

(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
  (ok (var-get token-decimals))
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance vote-token who))
)

(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Minting Functions

(define-public (mint (amount uint) (recipient principal))
  (let
    (
      (sbtc-amount (/ (* amount exchange-rate) u1000000))
    )
    (asserts! (> amount u0) err-invalid-amount)
    ;; In production, verify sBTC transfer here
    ;; For now, we'll simulate it
    (try! (ft-mint? vote-token amount recipient))
    (var-set total-supply (+ (var-get total-supply) amount))
    (print {event: "mint", amount: amount, recipient: recipient, sbtc-paid: sbtc-amount})
    (ok true)
  )
)

(define-public (burn (amount uint))
  (let
    (
      (sender tx-sender)
      (sbtc-return (/ (* amount exchange-rate) u1000000))
    )
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= (ft-get-balance vote-token sender) amount) err-insufficient-balance)
    (try! (ft-burn? vote-token amount sender))
    (var-set total-supply (- (var-get total-supply) amount))
    ;; In production, transfer sBTC back to sender here
    (print {event: "burn", amount: amount, sender: sender, sbtc-returned: sbtc-return})
    (ok true)
  )
)

;; Helper Functions

(define-read-only (get-exchange-rate)
  (ok exchange-rate)
)

(define-read-only (calculate-sbtc-cost (vote-amount uint))
  (ok (/ (* vote-amount exchange-rate) u1000000))
)

(define-read-only (calculate-vote-amount (sbtc-amount uint))
  (ok (/ (* sbtc-amount u1000000) exchange-rate))
)

;; Admin Functions

(define-public (set-token-uri (new-uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set token-uri (some new-uri))
    (ok true)
  )
)
