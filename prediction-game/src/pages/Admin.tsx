import { Wallet, ArrowDownToLine, ArrowUpFromLine, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockAdminData } from '@/data/mockData';
import { toast } from 'sonner';

const Admin = () => {
  const handleWithdraw = () => {
    toast.success('Withdrawal initiated! (Mock - trigger smart contract here)');
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Platform fee management & withdrawals</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-status-active/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-status-active" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collected Fees</p>
                <p className="text-3xl font-bold">{mockAdminData.totalFees.toLocaleString()} SOL</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-status-pending/20 flex items-center justify-center">
                <ArrowUpFromLine className="h-6 w-6 text-status-pending" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available for Withdrawal</p>
                <p className="text-3xl font-bold">{mockAdminData.pendingWithdrawals.toLocaleString()} SOL</p>
              </div>
            </div>
            <Button variant="gradient" className="w-full" onClick={handleWithdraw}>
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Withdraw Funds
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Transaction History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Event</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {mockAdminData.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-2 ${
                        tx.type === 'Withdrawal' ? 'text-status-pending' : 'text-status-active'
                      }`}>
                        {tx.type === 'Withdrawal' ? (
                          <ArrowUpFromLine className="h-4 w-4" />
                        ) : (
                          <ArrowDownToLine className="h-4 w-4" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{tx.event}</td>
                    <td className="py-4 px-4 text-muted-foreground">{tx.date}</td>
                    <td className={`py-4 px-4 text-right font-semibold ${
                      tx.amount < 0 ? 'text-destructive' : 'text-status-active'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} SOL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
