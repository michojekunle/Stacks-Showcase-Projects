import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Coins, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useVoteToken } from "@/hooks/useVoteToken";
import { useWallet } from "@/contexts/WalletContext";
import { voteToSbtc, sbtcToVote, CONSTANTS } from "@/lib/stacks/config";

const Mint = () => {
  const { isWalletConnected, connectWallet, address } = useWallet();
  const { mint, isMinting, balance } = useVoteToken();
  const [mintAmount, setMintAmount] = useState("1");

  // Calculate sBTC cost
  const calculateSbtcCost = (voteAmount: string): number => {
    const amount = parseFloat(voteAmount || "0");
    return voteToSbtc(amount);
  };

  // Calculate max VOTE tokens from available sBTC
  const calculateMaxVote = (sbtcAmount: number): number => {
    return sbtcToVote(sbtcAmount);
  };

  const handleMint = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await mint({
        amount: mintAmount,
        recipient: address || undefined,
      });
      // Success toast is handled by the hook
      setMintAmount("1"); // Reset amount after successful mint
    } catch (error) {
      // Error toast is handled by the hook
      console.error("Mint failed:", error);
    }
  };

  const handleSetMax = () => {
    // This would calculate based on available sBTC
    // For now, setting a reasonable max
    const availableSbtc = 0.001; // This should come from actual sBTC balance
    const maxVote = calculateMaxVote(availableSbtc);
    setMintAmount(maxVote.toFixed(2));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3 text-foreground">
                Mint VOTE Tokens
              </h1>
              <p className="text-muted-foreground">
                Exchange sBTC for VOTE tokens to participate in governance
              </p>
            </div>

            {!isWalletConnected ? (
              <div className="glass rounded-md p-8 text-center mb-6">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold mb-2 text-foreground">
                  Connect Your Wallet
                </h3>
                <p className="text-muted-foreground mb-6">
                  You need to connect your wallet to mint VOTE tokens
                </p>
                <Button
                  onClick={connectWallet}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="glass rounded-md p-6 mb-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-sm bg-secondary/10 flex items-center justify-center">
                    <Coins className="w-8 h-8 text-secondary" />
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-foreground">
                        Amount to Mint
                      </label>
                      <button
                        onClick={handleSetMax}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        MAX
                      </button>
                    </div>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-lg font-display"
                      min="1"
                      step="0.01"
                      placeholder="0"
                      disabled={isMinting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      VOTE tokens
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="p-4 bg-muted/50 rounded-md border border-border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                        Cost in sBTC
                      </p>
                      <p className="text-2xl font-display font-semibold text-secondary">
                        {calculateSbtcCost(mintAmount).toFixed(8)} sBTC
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Exchange Rate
                      </span>
                      <span className="text-foreground font-medium">
                        1 VOTE ={" "}
                        {(CONSTANTS.EXCHANGE_RATE / 1_000_000).toFixed(8)} sBTC
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Current Balance
                      </span>
                      <span className="text-foreground font-medium">
                        {balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}{" "}
                        VOTE
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Available sBTC
                      </span>
                      <span className="text-foreground font-medium">
                        0.001 sBTC
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleMint}
                  disabled={
                    isMinting || !mintAmount || parseFloat(mintAmount) <= 0
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    "Mint Tokens"
                  )}
                </Button>
              </div>
            )}

            <div className="glass rounded-md p-5">
              <h3 className="text-sm font-display font-semibold mb-3 text-foreground">
                How It Works
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Exchange your sBTC for VOTE tokens at the current rate
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Each VOTE token gives you voting power in governance
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Tokens are instantly available after minting</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Transaction requires wallet confirmation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Mint;
