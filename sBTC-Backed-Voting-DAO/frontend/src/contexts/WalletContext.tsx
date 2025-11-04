import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  connect,
  disconnect,
  isConnected,
  getLocalStorage,
} from "@stacks/connect";
import {
  STACKS_MAINNET,
  STACKS_TESTNET,
  type StacksNetwork,
} from "@stacks/network";

// Network configuration from environment
const networkMode = (import.meta.env.VITE_APP_NETWORK || "testnet") as
  | "mainnet"
  | "testnet";
const network: StacksNetwork =
  networkMode === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;

interface WalletContextType {
  address: string | null;
  network: StacksNetwork;
  isConnected: boolean;
  isWalletConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet state on mount - check if already connected
  useEffect(() => {
    const initializeWallet = () => {
      try {
        if (isConnected()) {
          const data = getLocalStorage();
          // Access addresses array directly, then find STX address
          const addresses = data?.addresses;
          let stxAddress: string | undefined;

          if (Array.isArray(addresses?.stx)) {
            const stxEntry = addresses?.stx?.find(
              // @ts-ignore
              (addr) => addr.purpose === "stacks" || addr.symbol === "STX"
            );
            stxAddress = stxEntry?.address;
          }

          if (stxAddress) {
            setAddress(stxAddress);
            setIsWalletConnected(true);
            setError(null);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize wallet";
        setError(errorMessage);
        console.error("Wallet initialization error:", err);
      }
    };

    initializeWallet();
  }, []);

  // Connect wallet - prompts user to select wallet and connect
  const connectWallet = useCallback(async () => {
    try {
      setError(null);

      const response = await connect({
        enableLocalStorage: true,
        forceWalletSelect: true,
      });

      // Access addresses array and find STX address
      const addresses = response?.addresses;

      let stxAddress: string | undefined;

      if (Array.isArray(addresses)) {
        const stxEntry = addresses.find(
          // @ts-ignore
          (addr) => addr.purpose === "stacks" || addr.symbol === "STX"
        );
        stxAddress = stxEntry?.address;
      }

      if (stxAddress) {
        setAddress(stxAddress);
        setIsWalletConnected(true);
      } else {
        throw new Error("No STX address returned from wallet");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Wallet connection failed";
      setError(errorMessage);
      setIsWalletConnected(false);
      setAddress(null);
      console.error("Wallet connection error:", err);
      throw err;
    }
  }, []);

  // Disconnect wallet - clears state and local storage
  const disconnectWallet = useCallback(() => {
    try {
      disconnect();
      setAddress(null);
      setIsWalletConnected(false);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Wallet disconnection failed";
      setError(errorMessage);
      console.error("Wallet disconnection error:", err);
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        network,
        isConnected: isWalletConnected,
        isWalletConnected,
        connectWallet,
        disconnectWallet,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
