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
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      {isConnected ? walletAddress : 'Connect Wallet'}
    </Button>
  );
};

export default WalletButton;
