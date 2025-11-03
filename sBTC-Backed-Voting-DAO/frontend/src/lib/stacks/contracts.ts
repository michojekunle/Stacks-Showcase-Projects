import { request } from "@stacks/connect";
import { Cl, fetchCallReadOnlyFunction, cvToJSON } from "@stacks/transactions";
import type { ClarityValue } from "@stacks/transactions";
import { CONTRACT_CONFIG, formatTokenAmount } from "./config";
import { STACKS_MAINNET, type StacksNetwork } from "@stacks/network";

// Helper to check if network is mainnet
export const isMainnetNetwork = (network: StacksNetwork): boolean => {
  return network === STACKS_MAINNET;
};

// Helper to parse contract ID
const parseContractId = (contractId: string) => {
  const [address, name] = contractId.split(".");
  return { address, name };
};

// Helper to convert network to string format
const networkToString = (network: StacksNetwork): "mainnet" | "testnet" => {
  return isMainnetNetwork(network) ? "mainnet" : "testnet";
};


export const mintVoteTokens = async (
  amount: number,
  recipient: string,
  network: StacksNetwork,
  _senderAddress: string
): Promise<{ txid: string }> => {
  const { address, name } = parseContractId(CONTRACT_CONFIG.VOTE_TOKEN);

  const response = await request("stx_callContract", {
    contract: `${address}.${name}`,
    functionName: "mint",
    functionArgs: [Cl.uint(amount), Cl.standardPrincipal(recipient)],
    network: networkToString(network),
  });

  return { txid: response.txid || "" };
};

export const burnVoteTokens = async (
  amount: number,
  network: StacksNetwork,
  _senderAddress: string
): Promise<{ txid: string }> => {
  const { address, name } = parseContractId(CONTRACT_CONFIG.VOTE_TOKEN);

  const response = await request("stx_callContract", {
    contract: `${address}.${name}`,
    functionName: "burn",
    functionArgs: [Cl.uint(amount)],
    network: networkToString(network),
  });

  return { txid: response.txid || "" };
};

export const transferVoteTokens = async (
  amount: number,
  sender: string,
  recipient: string,
  network: StacksNetwork,
  _senderAddress: string
): Promise<{ txid: string }> => {
  const { address, name } = parseContractId(CONTRACT_CONFIG.VOTE_TOKEN);

  const response = await request("stx_callContract", {
    contract: `${address}.${name}`,
    functionName: "transfer",
    functionArgs: [
      Cl.uint(amount),
      Cl.standardPrincipal(sender),
      Cl.standardPrincipal(recipient),
      Cl.none(),
    ],
    network: networkToString(network),
  });

  return { txid: response.txid || "" };
};

export const getVoteBalance = async (
  address: string,
  network: StacksNetwork
): Promise<number> => {
  try {
    const { address: contractAddress, name: contractName } = parseContractId(
      CONTRACT_CONFIG.VOTE_TOKEN
    );
    const result: ClarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-balance",
      functionArgs: [Cl.standardPrincipal(address)],
      network,
      senderAddress: address,
    });
    const json = cvToJSON(result);
    return json.value ? Number(json?.value?.value) : 0;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
};

export const getTotalSupply = async (
  network: StacksNetwork
): Promise<number> => {
  try {
    const { address: contractAddress, name: contractName } = parseContractId(
      CONTRACT_CONFIG.VOTE_TOKEN
    );
    const result: ClarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-total-supply",
      functionArgs: [],
      network,
      senderAddress: contractAddress,
    });
    const json = cvToJSON(result);
    return json.value ? Number(json?.value?.value) : 0;
  } catch (error) {
    console.error("Error fetching total supply:", error);
    return 0;
  }
};

// ============= GOVERNANCE FUNCTIONS =============

export const createProposal = async (
  title: string,
  description: string,
  network: StacksNetwork,
  _senderAddress: string
): Promise<{ txid: string }> => {
  const { address, name } = parseContractId(CONTRACT_CONFIG.GOVERNANCE);

  const response = await request("stx_callContract", {
    contract: `${address}.${name}`,
    functionName: "create-proposal",
    functionArgs: [Cl.stringUtf8(title), Cl.stringUtf8(description)],
    network: networkToString(network),
  });

  return { txid: response.txid || "" };
};

export const castVote = async (
  proposalId: number,
  voteFor: boolean,
  amount: number,
  network: StacksNetwork,
  _senderAddress: string
): Promise<{ txid: string }> => {
  const { address, name } = parseContractId(CONTRACT_CONFIG.GOVERNANCE);

  const response = await request("stx_callContract", {
    contract: `${address}.${name}`,
    functionName: "cast-vote",
    functionArgs: [Cl.uint(proposalId), Cl.bool(voteFor), Cl.uint(amount)],
    network: networkToString(network),
  });

  return { txid: response.txid || "" };
};

export const finalizeProposal = async (
  proposalId: number,
  network: StacksNetwork,
  _senderAddress: string
): Promise<{ txid: string }> => {
  const { address, name } = parseContractId(CONTRACT_CONFIG.GOVERNANCE);

  const response = await request("stx_callContract", {
    contract: `${address}.${name}`,
    functionName: "finalize-proposal",
    functionArgs: [Cl.uint(proposalId)],
    network: networkToString(network),
  });

  return { txid: response.txid || "" };
};

export const getProposal = async (
  proposalId: number,
  network: StacksNetwork,
  senderAddress: string
): Promise<any> => {
  try {
    const { address: contractAddress, name: contractName } = parseContractId(
      CONTRACT_CONFIG.GOVERNANCE
    );
    const result: ClarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-proposal",
      functionArgs: [Cl.uint(proposalId)],
      network,
      senderAddress,
    });
    return cvToJSON(result)?.value?.value;
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return null;
  }
};

export const getProposalCount = async (
  network: StacksNetwork,
  senderAddress: string
): Promise<number> => {
  try {
    const { address: contractAddress, name: contractName } = parseContractId(
      CONTRACT_CONFIG.GOVERNANCE
    );
    const result: ClarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-proposal-count",
      functionArgs: [],
      network,
      senderAddress,
    });
    const json = cvToJSON(result);
    return json.value ? Number(json?.value?.value) : 0;
  } catch (error) {
    console.error("Error fetching proposal count:", error);
    return 0;
  }
};

export const getProposalVotes = async (
  proposalId: number,
  network: StacksNetwork,
  senderAddress: string
) => {
  try {
    const { address: contractAddress, name: contractName } = parseContractId(
      CONTRACT_CONFIG.GOVERNANCE
    );
    const result: ClarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-proposal-votes",
      functionArgs: [Cl.uint(proposalId)],
      network,
      senderAddress,
    });
    const json = cvToJSON(result);
    console.log("PROPOSAL VOTES RESULT", json);

    const votesFor = json?.value?.value?.["votes-for"]?.value || 0;
    const votesAgainst = json?.value?.value?.["votes-against"]?.value || 0;
    const total = json?.value?.value?.total?.value || 0;
    return {
      votesFor: Number(formatTokenAmount(votesFor)),
      votesAgainst: Number(formatTokenAmount(votesAgainst)),
      total: Number(formatTokenAmount(total)),
    };
  } catch (error) {
    console.error("Error fetching proposal votes:", error);
    return { votesFor: 0, votesAgainst: 0, total: 0 };
  }
};

export const hasVoted = async (
  proposalId: number,
  voterAddress: string,
  network: StacksNetwork
): Promise<boolean> => {
  try {
    const { address: contractAddress, name: contractName } = parseContractId(
      CONTRACT_CONFIG.GOVERNANCE
    );
    const result: ClarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "has-voted",
      functionArgs: [Cl.uint(proposalId), Cl.standardPrincipal(voterAddress)],
      network,
      senderAddress: voterAddress,
    });
    const json = cvToJSON(result);
    return json?.value?.value === true;
  } catch (error) {
    console.error("Error checking vote status:", error);
    return false;
  }
};

export const isProposalActive = async (
  proposalId: number,
  network: StacksNetwork,
  senderAddress: string
): Promise<boolean> => {
  try {
    const { address: contractAddress, name: contractName } = parseContractId(
      CONTRACT_CONFIG.GOVERNANCE
    );
    const result: ClarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "is-proposal-active",
      functionArgs: [Cl.uint(proposalId)],
      network,
      senderAddress,
    });
    const json = cvToJSON(result);
    console.log("SOMEEE JSON VALUE", json);
    return json?.value?.value === true;
  } catch (error) {
    console.error("Error checking proposal status:", error);
    return false;
  }
};
