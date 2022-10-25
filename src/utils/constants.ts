export const GNOSIS = 'Gnosis Chain';
export const CHIADO = 'Chiado Testnet (xDAI)';
export const OPTIMISM_GNOSIS = 'Optimism on Gnosis Chain';
export const GNO_CHIADO = 'Chiado Testnet (GNO)';

type Network = {
  name: string;
  waitTime: number;
  lowerAmount: number;
  higherAmount: number;
  tweetText: string;
  web3Provider: string;
  contractAddress: string;
  isNative: boolean;
};

export const NETWORKS: Record<string, Network> = {
  [GNOSIS]: {
    name: GNOSIS,
    waitTime: 86400000,
    lowerAmount: 0.001,
    higherAmount: 0.01,
    tweetText: 'Requesting 0.01xDAI funds from the Official xDAI Faucet on Gnosis Chain. https://gnosisfaucet.com',
    web3Provider: 'https://rpc.ankr.com/gnosis',
    contractAddress: '',
    isNative: true,
  },
  [CHIADO]: {
    name: CHIADO,
    waitTime: 3600000,
    lowerAmount: 1,
    higherAmount: 1,
    tweetText: '',
    web3Provider: 'https://rpc.chiadochain.net',
    contractAddress: '',
    isNative: true,
  },
  [OPTIMISM_GNOSIS]: {
    name: OPTIMISM_GNOSIS,
    waitTime: 86400000,
    lowerAmount: 0.001,
    higherAmount: 0.01,
    tweetText: '',
    web3Provider: 'https://optimism.gnosischain.com',
    contractAddress: '',
    isNative: true,
  },
  [GNO_CHIADO]: {
    name: GNO_CHIADO,
    waitTime: 3600000,
    lowerAmount: 4,
    higherAmount: 4,
    tweetText: '',
    web3Provider: 'https://rpc.chiadochain.net',
    contractAddress: '0xf907903Be10FC3a885d331C4E225794436a34c9f',
    isNative: false,
  },
};

export const ERC20ABI = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)',
];
