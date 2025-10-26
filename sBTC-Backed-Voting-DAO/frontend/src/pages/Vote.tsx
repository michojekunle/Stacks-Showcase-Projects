import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThumbsUp, ThumbsDown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/contexts/WalletContext";
import { useVoteToken } from "@/hooks/useVoteToken";

const Vote = () => {
  const [searchParams] = useSearchParams();
  const { isWalletConnected, connectWallet } = useWallet();
  const {
    proposalCount,
    useProposal,
    useProposalVotes,
    useHasVoted,
    useIsProposalActive,
    castVote,
    isCastingVote,
  } = useGovernance();
  const { balance } = useVoteToken();

  const [selectedProposal, setSelectedProposal] = useState<string>("");
  const [selectedVote, setSelectedVote] = useState<"for" | "against" | null>(
    null
  );
  const [voteAmount, setVoteAmount] = useState("10");

  const proposalId = selectedProposal ? parseInt(selectedProposal) : 0;

  const { data: proposal } = useProposal(proposalId);
  const { data: votes } = useProposalVotes(proposalId);
  const { data: hasVoted } = useHasVoted(proposalId);
  const { data: isActive } = useIsProposalActive(proposalId);

  useEffect(() => {
    const proposalIdParam = searchParams.get("proposalId");
    if (proposalIdParam) {
      setSelectedProposal(proposalIdParam);
    }
  }, [searchParams]);

  const proposalIds = Array.from({ length: proposalCount }, (_, i) =>
    (i + 1).toString()
  );

  const totalVotes = votes?.total || 0;
  const forPercentage =
    totalVotes > 0
      ? Math.round(((votes?.votesFor || 0) / totalVotes) * 100)
      : 0;
  const againstPercentage =
    totalVotes > 0
      ? Math.round(((votes?.votesAgainst || 0) / totalVotes) * 100)
      : 0;

  const voteAmountNum = parseFloat(voteAmount || "0");
  const hasEnoughBalance = voteAmountNum > 0 && voteAmountNum <= balance;

  const handleVote = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedVote) {
      toast.error("Please select a vote option");
      return;
    }

    if (!hasEnoughBalance) {
      toast.error(
        `Insufficient balance. You have ${balance.toFixed(2)} VOTE tokens.`
      );
      return;
    }

    if (hasVoted) {
      toast.error("You have already voted on this proposal");
      return;
    }

    if (!isActive) {
      toast.error("This proposal is no longer active");
      return;
    }

    try {
      await castVote({
        proposalId,
        voteFor: selectedVote === "for",
        amount: voteAmount,
      });

      // Success is handled by the hook
      setSelectedVote(null);
      setVoteAmount("10");
    } catch (error) {
      console.error("Vote error:", error);
      // Error is handled by the hook
    }
  };

  const handleSetMax = () => {
    setVoteAmount(Math.floor(balance).toString());
  };

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-2xl mx-auto">
              <div className="glass rounded-md p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold mb-2 text-foreground">
                  Connect Your Wallet
                </h3>
                <p className="text-muted-foreground mb-6">
                  You need to connect your wallet to vote on proposals
                </p>
                <Button
                  onClick={connectWallet}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Connect Wallet
                </Button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const title = proposal?.value?.title?.value || `Proposal #${proposalId}`;
  const description =
    proposal?.value?.description?.value || "No description available";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3 text-foreground">
                Cast Your Vote
              </h1>
              <p className="text-muted-foreground">
                Use your VOTE tokens to participate in governance decisions
              </p>
            </div>

            <div className="glass rounded-md p-6 mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Proposal
              </label>
              <Select
                value={selectedProposal}
                onValueChange={setSelectedProposal}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a proposal to vote on" />
                </SelectTrigger>
                <SelectContent>
                  {proposalIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      Proposal #{id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedProposal ? (
              <div className="glass rounded-md p-12 text-center">
                <p className="text-muted-foreground text-lg">
                  Select a proposal to vote
                </p>
              </div>
            ) : (
              <>
                {hasVoted && (
                  <div className="glass rounded-md p-4 mb-6 border border-primary/20 bg-primary/5">
                    <p className="text-sm text-foreground font-medium">
                      ✓ You have already voted on this proposal
                    </p>
                  </div>
                )}

                {!isActive && (
                  <div className="glass rounded-md p-4 mb-6 border border-muted-foreground/20">
                    <p className="text-sm text-muted-foreground">
                      This proposal is no longer active
                    </p>
                  </div>
                )}

                <div className="glass rounded-md p-6 mb-6">
                  <h2 className="text-xl font-display font-semibold mb-3 text-foreground">
                    {title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {description}
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedVote("for")}
                        disabled={hasVoted || !isActive || isCastingVote}
                        className={`p-4 border rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedVote === "for"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ThumbsUp
                            className={`w-6 h-6 ${
                              selectedVote === "for"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              selectedVote === "for"
                                ? "text-primary"
                                : "text-foreground"
                            }`}
                          >
                            Vote For
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedVote("against")}
                        disabled={hasVoted || !isActive || isCastingVote}
                        className={`p-4 border rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedVote === "against"
                            ? "border-destructive bg-destructive/10"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ThumbsDown
                            className={`w-6 h-6 ${
                              selectedVote === "against"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              selectedVote === "against"
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            Vote Against
                          </span>
                        </div>
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-foreground">
                          Vote Amount (VOTE tokens)
                        </label>
                        <button
                          onClick={handleSetMax}
                          disabled={hasVoted || !isActive || isCastingVote}
                          className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                        >
                          MAX
                        </button>
                      </div>
                      <input
                        type="number"
                        value={voteAmount}
                        onChange={(e) => setVoteAmount(e.target.value)}
                        disabled={hasVoted || !isActive || isCastingVote}
                        className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        min="1"
                        step="1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {balance.toFixed(2)} VOTE
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleVote}
                    disabled={
                      isCastingVote ||
                      hasVoted ||
                      !isActive ||
                      !selectedVote ||
                      !hasEnoughBalance
                    }
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCastingVote ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting Vote...
                      </>
                    ) : (
                      "Submit Vote"
                    )}
                  </Button>
                </div>

                <div className="glass rounded-md p-6">
                  <h3 className="text-base font-display font-semibold mb-3 text-foreground">
                    Current Results
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">For</span>
                        <span className="text-foreground font-medium">
                          {(votes?.votesFor || 0).toLocaleString()} votes (
                          {forPercentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${forPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Against</span>
                        <span className="text-foreground font-medium">
                          {(votes?.votesAgainst || 0).toLocaleString()} votes (
                          {againstPercentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-destructive"
                          style={{ width: `${againstPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Vote;
