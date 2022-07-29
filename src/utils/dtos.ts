export type Network = 'Gnosis Chain' | 'Chiado Testnet' | 'Optimism L2';

export interface RequestToken {
  walletAddress: string;
  network: Network;
  userId: string;
  tweetText: string;
}
