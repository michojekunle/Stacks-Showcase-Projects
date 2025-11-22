"use client";

import { useEffect, useState, useCallback } from "react";

export interface StacksAccount {
  address: string;
  balance: string;
  stxBalance: string;
}

export function useStacksWallet() {
  const [account, setAccount] = useState<StacksAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLeather, setHasLeather] = useState(false);
  const [hasXverse, setHasXverse] = useState(false);

  // Check for available wallet providers
  useEffect(() => {
    const checkProviders = () => {
      // Check for Leather wallet (window.LeatherProvider or window.StacksProvider)
      setHasLeather(
        !!(window as any).LeatherProvider || !!(window as any).StacksProvider
      );

      // Check for Xverse wallet
      setHasXverse(!!(window as any).XverseProviders);
    };

    const reestablishConnection = async () => {
      // Try to reestablish connection if wallet is already connected
      try {
        // Check for btc provider (Xverse)
        if (typeof window !== "undefined" && (window as any).btc) {
          const response = await (window as any).btc.request(
            "getAddresses",
            {}
          );
          const stxAddress = response?.result?.addresses?.find(
            (addr: any) => addr.symbol === "STX"
          );
          if (stxAddress) {
            const balanceResponse = await fetch(
              `https://api.testnet.hiro.so/extended/v1/address/${stxAddress.address}/balances`
            );
            const balanceData = await balanceResponse.json();
            console.log(balanceData, "balanceData");
            const stxBalance = balanceData.stx?.balance || "0";
            setAccount({
              address: stxAddress.address,
              balance: stxBalance,
              stxBalance: (parseInt(stxBalance) / 1000000).toFixed(2),
            });
          }
        } else {
          // Fallback: Try legacy Leather connection
          const provider =
            (window as any).LeatherProvider || (window as any).StacksProvider;
          if (provider && provider.request) {
            const response = await provider.request("getAddresses", {});
            const stxAddress = response?.result?.addresses?.[0]?.address;
            if (stxAddress) {
              const balanceResponse = await fetch(
                `https://api.mainnet.hiro.so/extended/v1/address/${stxAddress}/balances`
              );
              const balanceData = await balanceResponse.json();
              console.log(balanceData, "balanceData")
              const stxBalance = balanceData.stx?.balance || "0";
              setAccount({
                address: stxAddress,
                balance: stxBalance,
                stxBalance: (parseInt(stxBalance) / 1000000).toFixed(2),
              });
            }
          }
        }
      } catch (err) {
        // Silent fail, do not set error on reestablish
        console.error(" Wallet reestablish error:", err);
      }
    };

    checkProviders();
    reestablishConnection();

    // Delay check to ensure wallets have injected their providers
    setTimeout(checkProviders, 500);
    window.addEventListener("load", checkProviders);
    return () => {
      window.removeEventListener("load", checkProviders);
    };
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Use @stacks/connect v8 request method
      // This works with both Leather and Xverse through the standard interface
      if (typeof window !== "undefined" && (window as any).btc) {
        const response = await (window as any).btc.request("getAddresses", {});
        console.log(response, "Response hereee");

        if (response && response.result && response.result.addresses) {
          console.log(response, "Response hereee");
          const stxAddress = response.result.addresses.find(
            (addr: any) => addr.symbol === "STX"
          );

          if (stxAddress) {
            // Fetch actual STX balance from API
            const balanceResponse = await fetch(
              `https://api.mainnet.hiro.so/extended/v1/address/${stxAddress.address}/balances`
            );
            const balanceData = await balanceResponse.json();
            console.log(balanceData, "balanceData");
            const stxBalance = balanceData.stx?.balance || "0";

            setAccount({
              address: stxAddress.address,
              balance: stxBalance,
              stxBalance: (parseInt(stxBalance) / 1000000).toFixed(2),
            });
          }
        }
      } else {
        // Fallback: Try legacy Leather connection
        const provider =
          (window as any).LeatherProvider || (window as any).StacksProvider;
        if (provider && provider.request) {
          const response = await provider.request("getAddresses", {});
          console.log(response, "Response hereee");
          const stxAddress = response?.result?.addresses?.[0]?.address;

          if (stxAddress) {
            const balanceResponse = await fetch(
              `https://api.mainnet.hiro.so/extended/v1/address/${stxAddress}/balances`
            );
            const balanceData = await balanceResponse.json();
            console.log(balanceData, "balanceData");
            const stxBalance = balanceData.stx?.balance || "0";

            setAccount({
              address: stxAddress,
              balance: stxBalance,
              stxBalance: (parseInt(stxBalance) / 1000000).toFixed(2),
            });
          }
        } else {
          throw new Error(
            "No Stacks wallet detected. Please install Leather or Xverse."
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
      console.error(" Wallet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);
  }, []);

  return {
    account,
    isConnecting,
    error,
    hasLeather,
    hasXverse,
    connect,
    disconnect,
    isConnected: !!account,
  };
}
