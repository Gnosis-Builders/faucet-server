export type Network = 'Gnosis Chain' | 'Chiado Testnet' | 'Optimism';

export interface RequestToken {
  walletAddress: string;
  network: Network;
  tweetUrl: string;
  amount: string;
}
