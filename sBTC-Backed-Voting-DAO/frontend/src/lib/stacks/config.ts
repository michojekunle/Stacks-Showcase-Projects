import { STACKS_TESTNET, STACKS_MAINNET, STACKS_DEVNET } from "@stacks/network";

// Network Configuration
const networkMode = import.meta.env.VITE_APP_NETWORK || "devnet";
export const NETWORK =
  networkMode === "mainnet" ? STACKS_MAINNET : networkMode === "testnet" ? STACKS_TESTNET : STACKS_DEVNET;

// Contract Configuration
export const CONTRACT_CONFIG = {
  VOTE_TOKEN: `${import.meta.env.VITE_APP_CONTRACT_ADDRESS || "ST2NDW06SBGDMJ8XYSAXQSXZ10B38P4BQMR1K99FS"}.vote-token`,
  GOVERNANCE: `${import.meta.env.VITE_APP_CONTRACT_ADDRESS || "ST2NDW06SBGDMJ8XYSAXQSXZ10B38P4BQMR1K99FS"}.governance`,
  TREASURY: `${import.meta.env.VITE_APP_CONTRACT_ADDRESS || "ST2NDW06SBGDMJ8XYSAXQSXZ10B38P4BQMR1K99FS"}.treasury`,
};

// API Configuration
export const API_CONFIG = {
  baseUrl:
    networkMode === "devnet"
      ? "http://localhost:3999"
      : networkMode === "mainnet"
      ? "https://api.mainnet.hiro.so"
      : "https://api.testnet.hiro.so",
  wsUrl:
    networkMode === "devnet"
      ? "ws://localhost:3999"
      : networkMode === "mainnet"
      ? "wss://api.mainnet.hiro.so"
      : "wss://api.testnet.hiro.so",
};

// Contract Constants
export const CONSTANTS = {
  EXCHANGE_RATE: 1000, // 1 VOTE = 1000 sats
  VOTING_DURATION: 1008, // ~7 days in blocks
  MIN_PROPOSAL_STAKE: 10000000, // 10 VOTE tokens
  DECIMALS: 6,
};

// Convert VOTE to sBTC
export const voteToSbtc = (voteAmount: number): number => {
  return (voteAmount * CONSTANTS.EXCHANGE_RATE) / 1_000_000;
};

// Convert sBTC to VOTE
export const sbtcToVote = (sbtcAmount: number): number => {
  return (sbtcAmount * 1_000_000) / CONSTANTS.EXCHANGE_RATE;
};

// Format token amount with decimals
export const formatTokenAmount = (amount: number): string => {
  return (amount / Math.pow(10, CONSTANTS.DECIMALS)).toFixed(CONSTANTS.DECIMALS);
};

// Parse token amount to micro units
export const parseTokenAmount = (amount: string): number => {
  return Math.floor(parseFloat(amount) * Math.pow(10, CONSTANTS.DECIMALS));
};