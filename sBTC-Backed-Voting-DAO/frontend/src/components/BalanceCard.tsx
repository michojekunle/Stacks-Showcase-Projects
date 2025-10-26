import { Bitcoin, AlertCircle, ArrowRight } from "lucide-react";
import { useVoteToken } from "@/hooks/useVoteToken";
import { useWallet } from "@/contexts/WalletContext";
import { voteToSbtc } from "@/lib/stacks/config";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export const BalanceCard = () => {
  const { isWalletConnected } = useWallet();
  const {
    balance: voteBalance,
    isLoadingBalance,
    balanceError,
  } = useVoteToken();

  // Convert VOTE tokens to sBTC equivalent
  const sbtcBalance = voteToSbtc(voteBalance);

  // Show loading state
  if (isLoadingBalance) {
    return (
      <div className="glass rounded-md p-6 w-full max-w-sm mx-auto shadow-lg animate-pulse">
        <div className="h-5 bg-muted rounded w-28 mb-4"></div>
        <div className="h-7 bg-muted rounded w-20 mb-2"></div>
        <div className="h-4 bg-muted rounded w-16"></div>
      </div>
    );
  }

  // Show error state
  if (balanceError) {
    return (
      <div className="glass rounded-md p-6 w-full max-w-sm mx-auto shadow-lg border border-destructive/20">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertCircle className="w-4 h-4" />
          <h2 className="text-sm font-semibold">Error Loading Balance</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {balanceError instanceof Error
            ? balanceError.message
            : "Failed to fetch balance"}
        </p>
      </div>
    );
  }

  // Show connect wallet prompt if not connected
  if (!isWalletConnected) {
    return (
      <div className="glass rounded-md p-6 w-full max-w-sm mx-auto shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Balance
          </h2>
          <div className="w-10 h-10 rounded-sm bg-secondary/10 flex items-center justify-center">
            <Bitcoin className="w-5 h-5 text-secondary" />
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view balance
          </p>
        </div>

        <div className="mt-5 pt-5 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            Secured by Bitcoin via Stacks
          </p>
        </div>
      </div>
    );
  }

  // Show balance
  return (
    <div className="glass rounded-md p-6 w-full max-w-sm mx-auto shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-display font-semibold text-foreground">
          Balance
        </h2>
        <div className="w-10 h-10 rounded-sm bg-secondary/10 flex items-center justify-center">
          <Bitcoin className="w-5 h-5 text-secondary" />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            Vote Tokens
          </p>
          <p className="text-2xl font-display font-semibold text-primary">
            {voteBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}{" "}
            VOTE
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            sBTC Value
          </p>
          <p className="text-base font-medium text-secondary">
            {sbtcBalance.toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 8,
            })}{" "}
            sBTC
          </p>
        </div>
      </div>

      {!voteBalance && (
        <Link to="/mint">
          <Button
            size="lg"
            className="mt-8 cursor-pointer bg-secondary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-5 transition-all duration-200"
          >
            Mint VOTE
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      )}

      <div className="mt-5 pt-5 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Secured by Bitcoin via Stacks
        </p>
      </div>
    </div>
  );
};
