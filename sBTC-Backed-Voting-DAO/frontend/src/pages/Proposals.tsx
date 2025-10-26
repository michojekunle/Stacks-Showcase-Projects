import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/contexts/WalletContext";

const Proposals = () => {
  const navigate = useNavigate();
  const { isWalletConnected, connectWallet } = useWallet();
  const { proposalCount, proposalCountError } = useGovernance();

  // Generate proposal IDs based on count
  const proposalIds = Array.from({ length: proposalCount }, (_, i) => i + 1);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3 text-foreground">
                  Governance Proposals
                </h1>
                <p className="text-muted-foreground">
                  Review and vote on protocol upgrades and community initiatives
                </p>
              </div>
              <Button
                onClick={() => {
                  if (!isWalletConnected) {
                    connectWallet();
                  } else {
                    navigate("/proposals/create");
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>

            {!isWalletConnected ? (
              <div className="glass rounded-md p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold mb-2 text-foreground">
                  Connect Your Wallet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Connect your wallet to view and vote on proposals
                </p>
                <Button
                  onClick={connectWallet}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Connect Wallet
                </Button>
              </div>
            ) : proposalCountError ? (
              <div className="glass rounded-md p-8 text-center border border-destructive/20">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold mb-2 text-foreground">
                  Error Loading Proposals
                </h3>
                <p className="text-sm text-muted-foreground">
                  {proposalCountError instanceof Error
                    ? proposalCountError.message
                    : "Failed to fetch proposals"}
                </p>
              </div>
            ) : proposalCount === 0 ? (
              <div className="glass rounded-md p-12 text-center">
                <p className="text-muted-foreground text-lg mb-4">
                  No proposals yet
                </p>
                <Button
                  onClick={() => navigate("/proposals/create")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Create First Proposal
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {proposalIds.map((id) => (
                  <ProposalCard key={id} proposalId={id} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const ProposalCard = ({ proposalId }: { proposalId: number }) => {
  const { useProposal, useProposalVotes, useIsProposalActive } =
    useGovernance();

  const { data: proposal, isLoading: isLoadingProposal } =
    useProposal(proposalId);
  const { data: votes, isLoading: isLoadingVotes } =
    useProposalVotes(proposalId);
  const { data: isActive } = useIsProposalActive(proposalId);

  if (isLoadingProposal || isLoadingVotes) {
    return (
      <div className="glass rounded-md p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Loading proposal...
          </span>
        </div>
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-muted rounded w-full"></div>
      </div>
    );
  }

  if (!proposal || !votes) {
    return null;
  }

  const getStatusIcon = () => {
    if (isActive) return <Clock className="w-4 h-4" />;
    return votes.votesFor > votes.votesAgainst ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    );
  };

  const getStatusColor = () => {
    if (isActive) return "text-primary bg-primary/10";
    return votes.votesFor > votes.votesAgainst
      ? "text-green-600 bg-green-600/10"
      : "text-red-600 bg-red-600/10";
  };

  const getStatusText = () => {
    if (isActive) return "active";
    return votes.votesFor > votes.votesAgainst ? "passed" : "rejected";
  };

  const totalVotes = votes.total;
  const forPercentage =
    totalVotes > 0 ? (votes.votesFor / totalVotes) * 100 : 0;

  console.log("Votessssssssss", votes)
  console.log("IsActiveeeeeee", isActive)

  // Extract title and description from proposal data
  const title = proposal.value?.title?.value || `Proposal #${proposalId}`;
  const description =
    proposal.value?.description?.value || "No description available";

  return (
    <div className="glass rounded-md p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-display font-semibold text-foreground">
              {title}
            </h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor()}`}
            >
              {getStatusIcon()}
              {getStatusText()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            For: {votes.votesFor.toLocaleString()} votes
          </span>
          <span className="text-muted-foreground">
            Against: {votes.votesAgainst.toLocaleString()} votes
          </span>
        </div>

        <div className="w-full h-2 bg-muted rounded-sm overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${forPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Proposal #{proposalId}
        </span>

        {isActive && (
          <Link to={`/vote?proposalId=${proposalId}`}>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Vote Now
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Proposals;
