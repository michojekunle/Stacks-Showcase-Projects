;; governance.clar
;; DAO Governance Contract for Proposal Creation, Voting, and Execution

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u200))
(define-constant err-proposal-not-found (err u201))
(define-constant err-proposal-not-active (err u202))
(define-constant err-already-voted (err u203))
(define-constant err-insufficient-votes (err u204))
(define-constant err-proposal-not-ended (err u205))
(define-constant err-proposal-already-finalized (err u206))
(define-constant err-invalid-vote-amount (err u207))
(define-constant err-not-creator (err u208))
(define-constant err-invalid-contract (err u209))

;; Minimum proposal stake: 10 VOTE tokens
(define-constant min-proposal-stake u10000000)

;; Voting duration in blocks (~144 blocks = 1 day on Stacks)
(define-constant voting-duration u1008) ;; ~7 days

;; Data Maps
(define-map proposals
  uint
  {
    creator: principal,
    title: (string-utf8 256),
    description: (string-utf8 2048),
    start-block: uint,
    end-block: uint,
    votes-for: uint,
    votes-against: uint,
    finalized: bool,
    executed: bool,
    status: (string-ascii 20)
  }
)

(define-map votes
  {proposal-id: uint, voter: principal}
  {
    vote: bool, ;; true = for, false = against
    amount: uint,
    block-height: uint
  }
)

(define-map user-voting-power principal uint)

;; Data Variables
(define-data-var proposal-count uint u0)
(define-data-var vote-token-contract principal tx-sender) ;; Will be set to vote-token contract

;; Proposal Management

(define-public (create-proposal (title (string-utf8 256)) (description (string-utf8 2048)))
  (let
    (
      (proposal-id (+ (var-get proposal-count) u1))
      (creator tx-sender)
      (start-block stacks-block-height)
      (end-block (+ stacks-block-height voting-duration))
    )

    ;; Check title length
    (asserts! (and (> (len title) u0) (< (len title) u200)) (err u100))
    ;; Check description length
    (asserts! (and (> (len description) u0) (< (len description) u2000)) (err u101))

    ;; In production, should be a check to verify creator has minimum stake via vote-token contract
    (map-set proposals proposal-id {
      creator: creator,
      title: title,
      description: description,
      start-block: start-block,
      end-block: end-block,
      votes-for: u0,
      votes-against: u0,
      finalized: false,
      executed: false,
      status: "active"
    })
    (var-set proposal-count proposal-id)
    (print {event: "proposal-created", proposal-id: proposal-id, creator: creator, title: title})
    (ok proposal-id)
  )
)

(define-public (cast-vote (proposal-id uint) (vote-for bool) (amount uint))
  (let
    (
      (voter tx-sender)
      (proposal (unwrap! (map-get? proposals proposal-id) err-proposal-not-found))
      (existing-vote (map-get? votes {proposal-id: proposal-id, voter: voter}))
    )
    ;; Validate proposal is active
    (asserts! (is-eq (get status proposal) "active") err-proposal-not-active)
    (asserts! (<= stacks-block-height (get end-block proposal)) err-proposal-not-ended)
    (asserts! (is-none existing-vote) err-already-voted)
    (asserts! (> amount u0) err-invalid-vote-amount)
    
    ;; Record the vote
    (map-set votes {proposal-id: proposal-id, voter: voter} {
      vote: vote-for,
      amount: amount,
      block-height: stacks-block-height
    })
    
    ;; Update proposal vote counts
    (map-set proposals proposal-id
      (merge proposal {
        votes-for: (if vote-for (+ (get votes-for proposal) amount) (get votes-for proposal)),
        votes-against: (if vote-for (get votes-against proposal) (+ (get votes-against proposal) amount))
      })
    )
    
    (print {
      event: "vote-cast",
      proposal-id: proposal-id,
      voter: voter,
      vote-for: vote-for,
      amount: amount
    })
    (ok true)
  )
)

(define-public (finalize-proposal (proposal-id uint))
  (let
    (
      (proposal (unwrap! (map-get? proposals proposal-id) err-proposal-not-found))
      (total-votes (+ (get votes-for proposal) (get votes-against proposal)))
      (votes-for (get votes-for proposal))
      (votes-against (get votes-against proposal))
      (passed (> votes-for votes-against))
    )
    (asserts! (> stacks-block-height (get end-block proposal)) err-proposal-not-ended)
    (asserts! (not (get finalized proposal)) err-proposal-already-finalized)
    
    (map-set proposals proposal-id
      (merge proposal {
        finalized: true,
        status: (if passed "passed" "rejected")
      })
    )
    
    (print {
      event: "proposal-finalized",
      proposal-id: proposal-id,
      status: (if passed "passed" "rejected"),
      votes-for: votes-for,
      votes-against: votes-against
    })
    (ok passed)
  )
)

;; Read-Only Functions

(define-read-only (get-proposal (proposal-id uint))
  (ok (map-get? proposals proposal-id))
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (ok (map-get? votes {proposal-id: proposal-id, voter: voter}))
)

(define-read-only (get-proposal-count)
  (ok (var-get proposal-count))
)

(define-read-only (get-proposal-status (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal (ok (get status proposal))
    err-proposal-not-found
  )
)

(define-read-only (get-proposal-votes (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal (ok {
      votes-for: (get votes-for proposal),
      votes-against: (get votes-against proposal),
      total: (+ (get votes-for proposal) (get votes-against proposal))
    })
    err-proposal-not-found
  )
)

(define-read-only (has-voted (proposal-id uint) (voter principal))
  (ok (is-some (map-get? votes {proposal-id: proposal-id, voter: voter})))
)

(define-read-only (is-proposal-active (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal (ok (and
      (is-eq (get status proposal) "active")
      (<= stacks-block-height (get end-block proposal))
      (not (get finalized proposal))
    ))
    (ok false)
  )
)

;; Admin Functions

(define-public (set-vote-token-contract (contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (not (is-none (some contract))) err-invalid-contract)
    (var-set vote-token-contract contract)
    (ok true)
  )
)
