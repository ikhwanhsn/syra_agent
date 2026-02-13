"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { shortenAddress } from "@/lib/solana";
import { IS_DEVNET } from "@/constants/config";

export function WalletButton() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex items-center gap-3">
      {IS_DEVNET && (
        <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-400">
          Devnet
        </span>
      )}
      {connected && publicKey && (
        <span className="text-sm text-zinc-400">
          {shortenAddress(publicKey.toBase58())}
        </span>
      )}
      <WalletMultiButton className="!rounded-xl !bg-gradient-to-r !from-purple-500 !to-cyan-500 !px-4 !py-2 !font-semibold !text-white hover:!opacity-90" />
    </div>
  );
}
