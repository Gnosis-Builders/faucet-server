export type Network = 'Gnosis Chain' | 'Chiado Testnet (xDAI)' | 'Optimism on Gnosis Chain' | 'Chiado Testnet (GNO)';

export interface RequestToken {
  walletAddress: string;
  network: Network;
  tweetUrl: string;
  amount: string;
  smartContractABI: string;
}
