import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";

export const WalletConnectControls = () => {
  const { address, connectWallet, disconnectWallet, isConnected } = useWallet();

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <div className="flex items-center gap-4">
      {!isConnected && (
        <Button
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-lg px-6 py-3 flex items-center gap-2"
          aria-label="Connect Hiro Wallet"
          onClick={connectWallet}
        >
          <Wallet className="w-5 h-5" />
          <span className="hidden sm:inline">Connect</span>
        </Button>
      )}

      {isConnected && (
        <>
          <Button className="hidden bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-lg p-3 sm:flex items-center gap-2">
            <span>{displayAddress}</span>
          </Button>
          <button
            className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full flex items-center transition-all"
            title="Disconnect"
            onClick={disconnectWallet}
            aria-label="Disconnect"
            type="button"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
