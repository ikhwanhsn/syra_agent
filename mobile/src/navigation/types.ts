export type TokenDetailParams = {
  symbol: string;
  name?: string;
  mint?: string;
  tokenId?: string;
  ticker?: string;
};

export type RootStackParamList = {
  Tabs: undefined;
  TokenDetail: TokenDetailParams;
};

export type TabParamList = {
  Home: undefined;
  Scout: undefined;
  Wallet: undefined;
};
