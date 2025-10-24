import { Bitcoin } from "lucide-react";

interface BalanceCardProps {
  voteBalance?: number;
  sbtcBalance?: number;
  loading?: boolean;
}

export const BalanceCard = ({
  voteBalance = 100,
  sbtcBalance = 0.001,
  loading = false,
}: BalanceCardProps) => {
  if (loading) {
    return (
      <div className="glass rounded-md p-6 w-full max-w-sm mx-auto shadow-lg animate-pulse">
        <div className="h-5 bg-muted rounded w-28 mb-4"></div>
        <div className="h-7 bg-muted rounded w-20 mb-2"></div>
        <div className="h-4 bg-muted rounded w-16"></div>
      </div>
    );
  }

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
            {voteBalance} VOTE
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            sBTC Value
          </p>
          <p className="text-base font-medium text-secondary">
            {sbtcBalance} sBTC
          </p>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Secured by Bitcoin via Stacks
        </p>
      </div>
    </div>
  );
};
