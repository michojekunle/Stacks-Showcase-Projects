import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import {
  getProposal,
  getProposalCount,
  getProposalVotes,
  hasVoted,
  isProposalActive,
  createProposal,
  castVote,
  finalizeProposal,
  isMainnetNetwork,
} from "@/lib/stacks/contracts";
import { parseTokenAmount } from "@/lib/stacks/config";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useGovernance = () => {
  const { address, network, isWalletConnected } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query: Get proposal count
  const { data: proposalCount, error: proposalCountError } = useQuery({
    queryKey: ["proposalCount", isMainnetNetwork(network)],
    queryFn: async () => {
      if (!address) return 0;
      return await getProposalCount(network, address);
    },
    enabled: !!address && isWalletConnected,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Query: Get specific proposal
  const useProposal = (proposalId: number) => {
    return useQuery({
      queryKey: ["proposal", proposalId, isMainnetNetwork(network)],
      queryFn: async () => {
        if (!address || !proposalId) return null;
        return await getProposal(proposalId, network, address);
      },
      enabled: !!address && !!proposalId && isWalletConnected,
      refetchInterval: 30000,
      staleTime: 10000,
    });
  };

  // Query: Get proposal votes
  const useProposalVotes = (proposalId: number) => {
    return useQuery({
      queryKey: ["proposalVotes", proposalId, isMainnetNetwork(network)],
      queryFn: async () => {
        if (!address || !proposalId)
          return { votesFor: 0, votesAgainst: 0, total: 0 };
        return await getProposalVotes(proposalId, network, address);
      },
      enabled: !!address && !!proposalId && isWalletConnected,
      refetchInterval: 15000,
      staleTime: 5000,
    });
  };

  // Query: Check if user has voted
  const useHasVoted = (proposalId: number) => {
    return useQuery({
      queryKey: ["hasVoted", proposalId, address, isMainnetNetwork(network)],
      queryFn: async () => {
        if (!address || !proposalId) return false;
        return await hasVoted(proposalId, address, network);
      },
      enabled: !!address && !!proposalId && isWalletConnected,
      staleTime: 10000,
    });
  };

  // Query: Check if proposal is active
  const useIsProposalActive = (proposalId: number) => {
    return useQuery({
      queryKey: ["isProposalActive", proposalId, isMainnetNetwork(network)],
      queryFn: async () => {
        if (!address || !proposalId) return false;
        return await isProposalActive(proposalId, network, address);
      },
      enabled: !!address && !!proposalId && isWalletConnected,
      refetchInterval: 30000,
      staleTime: 10000,
    });
  };

  // Mutation: Create proposal
  const createProposalMutation = useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) => {
      if (!address) throw new Error("Wallet not connected");
      return await createProposal(title, description, network, address);
    },
    onSuccess: () => {
      setTimeout(() => navigate("/proposals"), 2500);
      toast.success("Proposal created successfully!");
      queryClient.invalidateQueries({ queryKey: ["proposalCount"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create proposal: ${error.message}`);
      console.error("Create proposal error:", error);
    },
  });

  // Mutation: Cast vote
  const castVoteMutation = useMutation({
    mutationFn: async ({
      proposalId,
      voteFor,
      amount,
    }: {
      proposalId: number;
      voteFor: boolean;
      amount: string;
    }) => {
      if (!address) throw new Error("Wallet not connected");
      const amountMicro = parseTokenAmount(amount);
      return await castVote(proposalId, voteFor, amountMicro, network, address);
    },
    onSuccess: (_, variables) => {
      toast.success("Vote cast successfully!");
      queryClient.invalidateQueries({
        queryKey: ["proposalVotes", variables.proposalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["hasVoted", variables.proposalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["proposal", variables.proposalId],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to cast vote: ${error.message}`);
      console.error("Cast vote error:", error);
    },
  });

  // Mutation: Finalize proposal
  const finalizeProposalMutation = useMutation({
    mutationFn: async (proposalId: number) => {
      if (!address) throw new Error("Wallet not connected");
      return await finalizeProposal(proposalId, network, address);
    },
    onSuccess: (_, proposalId) => {
      toast.success("Proposal finalized!");
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      queryClient.invalidateQueries({
        queryKey: ["isProposalActive", proposalId],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to finalize proposal: ${error.message}`);
      console.error("Finalize proposal error:", error);
    },
  });

  return {
    proposalCount: proposalCount || 0,
    proposalCountError,
    useProposal,
    useProposalVotes,
    useHasVoted,
    useIsProposalActive,
    createProposal: createProposalMutation.mutate,
    castVote: castVoteMutation.mutate,
    finalizeProposal: finalizeProposalMutation.mutate,
    isCreatingProposal: createProposalMutation.isPending,
    isCastingVote: castVoteMutation.isPending,
    isFinalizingProposal: finalizeProposalMutation.isPending,
  };
};
