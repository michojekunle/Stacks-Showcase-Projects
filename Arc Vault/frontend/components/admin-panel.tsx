"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStacksWallet } from "@/hooks/use-stacks-wallet";
import { adminDepositSBTC, adminWithdrawSBTC } from "@/lib/stacks-contracts";

const DEPLOYER_ADDRESS = "SP2ZNGJ85ENDY6QHTQ5P6W6CVE4V3NATZZCP69DQ";

export function AdminPanel() {
  const { account } = useStacksWallet();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sbTCAmount, setSBTCAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Only show if user is deployer
  if (!account || account.address !== DEPLOYER_ADDRESS) {
    return null;
  }

  const handleDepositSBTC = async () => {
    if (!sbTCAmount || !account) return;

    setIsLoading(true);
    toast({ title: "Processing sBTC deposit...", description: "Tx pending" });

    try {
      const amountInMicroSBTC = (parseFloat(sbTCAmount) * 100000000).toString();
      const result = await adminDepositSBTC(
        account,
        amountInMicroSBTC,
        account.address
      );

      console.log(` sBTC deposit successful: ${result.txId}`);

      setTimeout(() => {
        setIsLoading(false);
        setSBTCAmount("");
        toast({
          title: "sBTC Deposit Successful",
          description: `Added ${sbTCAmount} sBTC to vault reserve\nTx: ${result.txId.slice(
            0,
            8
          )}...`,
        });
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleWithdrawSBTC = async () => {
    if (!withdrawAmount || !account) return;

    setIsLoading(true);
    toast({
      title: "Processing sBTC withdrawal...",
      description: "Tx pending",
    });

    try {
      const amountInMicroSBTC = (
        parseFloat(withdrawAmount) * 100000000
      ).toString();
      const result = await adminWithdrawSBTC(
        account,
        amountInMicroSBTC,
        account.address
      );

      console.log(` sBTC withdrawal successful: ${result.txId}`);

      setTimeout(() => {
        setIsLoading(false);
        setWithdrawAmount("");
        toast({
          title: "sBTC Withdrawal Successful",
          description: `Removed ${withdrawAmount} sBTC from vault\nTx: ${result.txId.slice(
            0,
            8
          )}...`,
        });
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass border-destructive/20 p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:text-primary transition-colors"
      >
        <h2 className="text-lg font-bold text-destructive">ADMIN PANEL</h2>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-6 pt-6 border-t border-border/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deposit sBTC */}
            <div>
              <h3 className="font-semibold mb-4">Deposit sBTC to Vault</h3>
              <div className="space-y-3">
                <Input
                  type="number"
                  placeholder="sBTC amount"
                  value={sbTCAmount}
                  onChange={(e) => setSBTCAmount(e.target.value)}
                  disabled={isLoading}
                  className="bg-input border-border/50"
                />
                <Button
                  onClick={handleDepositSBTC}
                  disabled={!sbTCAmount || isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? "Processing..." : "Deposit sBTC"}
                </Button>
              </div>
            </div>

            {/* Withdraw sBTC */}
            <div>
              <h3 className="font-semibold mb-4">Withdraw sBTC from Vault</h3>
              <div className="space-y-3">
                <Input
                  type="number"
                  placeholder="sBTC amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isLoading}
                  className="bg-input border-border/50"
                />
                <Button
                  onClick={handleWithdrawSBTC}
                  disabled={!withdrawAmount || isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  {isLoading ? "Processing..." : "Withdraw sBTC"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
