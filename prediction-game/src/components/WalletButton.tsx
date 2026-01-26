import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

interface WalletButtonProps {
  onOpenModal: () => void;
}

const WalletButton: React.FC<WalletButtonProps> = ({ onOpenModal }) => {
  const { isConnected, walletAddress } = useWallet();

  return (
    <Button
      variant="glass"
      onClick={onOpenModal}
      className="gap-2 group"
    >
      <Wallet className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
      <span className="font-medium">
        {isConnected 
          ? `${walletAddress?.slice(0, 4)}...${walletAddress?.slice(-4)}` 
          : 'Connect Wallet'}
      </span>
    </Button>
  );
};

export default WalletButton;
