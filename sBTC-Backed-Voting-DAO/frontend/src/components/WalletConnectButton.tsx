import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletConnectButtonProps {
  connected?: boolean;
  address?: string;
}

export const WalletConnectButton = ({
  connected = false,
  address,
}: WalletConnectButtonProps) => {
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <Button
      className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-lg px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_hsl(28_94%_54%/0.6)] flex items-center gap-2"
      aria-label={connected ? "Connected to wallet" : "Connect Hiro Wallet"}
    >
      <Wallet className="w-5 h-5" />
      <span className="hidden sm:inline">
        {connected && displayAddress ? displayAddress : "Connect"}
      </span>
    </Button>
  );
};
