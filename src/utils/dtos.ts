export type Network = 'Gnosis Chain' | 'Chiado Testnet' | 'Optimism on Gnosis Chain' | "GNO on Chiado Testnet";

export interface RequestToken {
  walletAddress: string;
  network: Network;
  tweetUrl: string;
  amount: string;
}
