import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains'; // ← Import from wagmi/chains
import { coinbaseWallet, metaMask } from 'wagmi/connectors';

export function getConfig() {
  return createConfig({
    chains: [base, baseSepolia],
    connectors: [
      coinbaseWallet({
        appName: 'RizqFi',
        preference: 'smartWalletOnly',
      }),
      metaMask(),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
  });
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}