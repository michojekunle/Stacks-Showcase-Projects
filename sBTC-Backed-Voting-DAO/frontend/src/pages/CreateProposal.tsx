import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/contexts/WalletContext";
import { useVoteToken } from "@/hooks/useVoteToken";
import { CONSTANTS, formatTokenAmount } from "@/lib/stacks/config";

const CreateProposal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isWalletConnected, connectWallet } = useWallet();
  const { createProposal, isCreatingProposal } = useGovernance();
  const { balance } = useVoteToken();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const minStakeRequired = parseFloat(
    formatTokenAmount(CONSTANTS.MIN_PROPOSAL_STAKE)
  );
  const hasEnoughBalance = balance >= minStakeRequired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWalletConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a proposal.",
        variant: "destructive",
      });
      return;
    }

    if (!hasEnoughBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${minStakeRequired} VOTE tokens to create a proposal.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await createProposal({
        title: formData.title,
        description: formData.description,
      });

      toast({
        title: "Proposal Created",
        description: "Your proposal has been submitted to the DAO.",
      });

      setTimeout(() => navigate("/proposals"), 1500);
    } catch (error) {
      console.error("Create proposal error:", error);
      // Error toast is handled by the hook
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-24 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/proposals")}
            className="mb-8 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposals
          </Button>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold mb-2 text-foreground">
                  Connect Your Wallet
                </h3>
                <p className="text-muted-foreground mb-6">
                  You need to connect your wallet to create a proposal
                </p>
                <Button
                  onClick={connectWallet}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-24 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/proposals")}
          className="mb-8 -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Proposals
        </Button>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-display text-3xl">
              Create Proposal
            </CardTitle>
            <CardDescription>
              Submit a new proposal for the DAO to vote on. All proposals
              require a minimum of {minStakeRequired} VOTE tokens to create.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasEnoughBalance && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Insufficient Balance
                    </p>
                    <p className="text-xs text-destructive/80 mt-1">
                      You have {balance.toFixed(2)} VOTE tokens. You need at
                      least {minStakeRequired} VOTE to create a proposal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Implement ZK-Rollup Protocol Upgrade"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isCreatingProposal}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide a detailed description of your proposal..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={8}
                  disabled={isCreatingProposal}
                  className="bg-background/50 resize-none"
                />
              </div>

              <div className="pt-4 space-y-4">
                <div className="p-4 bg-muted/30 rounded border border-border/30">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Requirements:</strong>{" "}
                    Creating a proposal requires {minStakeRequired} VOTE tokens
                    as a deposit. Voting duration is approximately{" "}
                    {Math.floor(CONSTANTS.VOTING_DURATION / 144)} days.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong className="text-foreground">Your Balance:</strong>{" "}
                    {balance.toFixed(2)} VOTE tokens
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isCreatingProposal || !hasEnoughBalance}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isCreatingProposal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Proposal...
                    </>
                  ) : (
                    "Submit Proposal"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default CreateProposal;
