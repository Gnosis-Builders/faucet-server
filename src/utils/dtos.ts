export type Network = 'Gnosis Chain' | 'Chiado Testnet' | 'Optimism on Gnosis Chain';

export interface RequestToken {
  walletAddress: string;
  network: Network;
  tweetUrl: string;
  amount: string;
}
