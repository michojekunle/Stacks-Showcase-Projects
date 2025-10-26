import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/contexts/WalletContext';
import {
  getVoteBalance,
  getTotalSupply,
  mintVoteTokens,
  burnVoteTokens,
  transferVoteTokens,
  isMainnetNetwork,
} from '@/lib/stacks/contracts';
import { parseTokenAmount, formatTokenAmount } from '@/lib/stacks/config';
import { toast } from 'sonner';


export const useVoteToken = () => {
  const { address, network, isWalletConnected } = useWallet();
  const queryClient = useQueryClient();

  // Query: Get user balance
  const { 
    data: balance, 
    isLoading: isLoadingBalance,
    error: balanceError 
  } = useQuery({
    queryKey: ['voteBalance', address, isMainnetNetwork(network)],
    queryFn: async () => {
      if (!address) return 0;
      const balanceMicro = await getVoteBalance(address, network);
      return parseFloat(formatTokenAmount(balanceMicro));
    },
    enabled: !!address && isWalletConnected,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Query: Get total supply
  const { 
    data: totalSupply, 
    isLoading: isLoadingSupply,
    error: supplyError 
  } = useQuery({
    queryKey: ['totalSupply', isMainnetNetwork(network)],
    queryFn: async () => {
      const supplyMicro = await getTotalSupply(network);
      return parseFloat(formatTokenAmount(supplyMicro));
    },
    enabled: isWalletConnected,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Mutation: Mint tokens
  const mintMutation = useMutation({
    mutationFn: async ({ amount, recipient }: { amount: string; recipient?: string }) => {
      if (!address) throw new Error('Wallet not connected');
      const amountMicro = parseTokenAmount(amount);
      const recipientAddress = recipient || address;
      return await mintVoteTokens(amountMicro, recipientAddress, network, address);
    },
    onSuccess: () => {
      toast.success('Tokens minted successfully!');
      queryClient.invalidateQueries({ queryKey: ['voteBalance'] });
      queryClient.invalidateQueries({ queryKey: ['totalSupply'] });
    },
    onError: (error: Error) => {
      toast.error(`Mint failed: ${error.message}`);
      console.error('Mint error:', error);
    },
  });

  // Mutation: Burn tokens
  const burnMutation = useMutation({
    mutationFn: async (amount: string) => {
      if (!address) throw new Error('Wallet not connected');
      const amountMicro = parseTokenAmount(amount);
      return await burnVoteTokens(amountMicro, network, address);
    },
    onSuccess: () => {
      toast.success('Tokens burned successfully!');
      queryClient.invalidateQueries({ queryKey: ['voteBalance'] });
      queryClient.invalidateQueries({ queryKey: ['totalSupply'] });
    },
    onError: (error: Error) => {
      toast.error(`Burn failed: ${error.message}`);
      console.error('Burn error:', error);
    },
  });

  // Mutation: Transfer tokens
  const transferMutation = useMutation({
    mutationFn: async ({ amount, recipient }: { amount: string; recipient: string }) => {
      if (!address) throw new Error('Wallet not connected');
      const amountMicro = parseTokenAmount(amount);
      return await transferVoteTokens(amountMicro, address, recipient, network, address);
    },
    onSuccess: () => {
      toast.success('Transfer successful!');
      queryClient.invalidateQueries({ queryKey: ['voteBalance'] });
    },
    onError: (error: Error) => {
      toast.error(`Transfer failed: ${error.message}`);
      console.error('Transfer error:', error);
    },
  });

  return {
    balance: balance || 0,
    totalSupply: totalSupply || 0,
    isLoadingBalance,
    isLoadingSupply,
    balanceError,
    supplyError,
    mint: mintMutation.mutate,
    burn: burnMutation.mutate,
    transfer: transferMutation.mutate,
    isMinting: mintMutation.isPending,
    isBurning: burnMutation.isPending,
    isTransferring: transferMutation.isPending,
  };
};