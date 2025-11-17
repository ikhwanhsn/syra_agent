import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimateIcon } from "../animate-ui/icons/icon";
import { CirclePlus } from "../animate-ui/icons/circle-plus";
import { CreateSignalButton } from "./CreateSignalButton";
import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function CreateSignalButtonNew() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    signal: "",
    token: "",
    ticker: "",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
  });
  const { isPending, error, data } = useQuery({
    queryKey: ["tokenData", formData.ticker],
    queryFn: () =>
      fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${formData.ticker}USDT`
      ).then((res) => res.json()),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Available tokens
  const tokens = [
    { value: "BTC", label: "Bitcoin" },
    { value: "ETH", label: "Ethereum" },
    { value: "SOL", label: "Solana" },
  ];

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedToken = tokens.find((token) => token.value === value);
    setFormData((prev) => ({
      ...prev,
      token: selectedToken?.label || "",
      ticker: selectedToken?.value || "",
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <AnimateIcon animateOnHover>
          <Button variant="outline" size="lg" className="cursor-pointer">
            <CirclePlus />
            Create Signal
          </Button>
        </AnimateIcon>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-9/12 overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Trading Signal</DialogTitle>
          <DialogDescription>
            Create a new trading signal with entry, stop loss, and take profit
            levels. Fee: 0.0001 USDC
          </DialogDescription>
        </DialogHeader>
        {/* Info Box */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800 -mt-2">
          <p>
            <strong>Alert:</strong> Please change your wallet to Devnet before
            creating a signal. Follow this instruction:{" "}
            <a
              href="https://help.phantom.com/hc/en-us/articles/5997313271699-About-devnet-and-tesnet-networks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 underline"
            >
              Phantom Devnet Help
            </a>
          </p>
        </div>

        <div className="grid gap-5 py-4 -mt-5">
          {/* Signal Type */}
          <div className="grid gap-2">
            <Label htmlFor="signal" className="text-base">
              Signal Type <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, signal: "Buy" }))
                }
                className={`flex items-center justify-center gap-2 h-12 rounded-md border-2 font-medium transition-all ${
                  formData.signal === "Buy"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 hover:border-green-300"
                }`}
              >
                <TrendingUp size={18} />
                Buy / Long
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, signal: "Sell" }))
                }
                className={`flex items-center justify-center gap-2 h-12 rounded-md border-2 font-medium transition-all ${
                  formData.signal === "Sell"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 hover:border-red-300"
                }`}
              >
                <TrendingDown size={18} />
                Sell / Short
              </button>
            </div>
          </div>

          {/* Token & Ticker in same row */}
          <div className="grid grid-cols-2 gap-4 -mt-3">
            <div className="grid gap-2">
              <Label htmlFor="token" className="text-base">
                Token <span className="text-red-500">*</span>
              </Label>
              <select
                id="token"
                name="token"
                onChange={handleTokenChange}
                required
                className="flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Select a token</option>
                {tokens.map((token) => (
                  <option key={token.value} value={token.value}>
                    {token.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ticker" className="text-base">
                Ticker <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ticker"
                name="ticker"
                placeholder="Auto-filled"
                value={formData.ticker}
                // onChange={handleInputChange}
                required
                disabled
                className="h-12 bg-gray-50"
              />
            </div>
          </div>
          {formData.ticker && (
            <small className={`-mt-3 flex items-center gap-2`}>
              Current Price:{" "}
              {isPending ? (
                <div className="animate-pulse w-16 h-4 bg-gray-300 rounded-xs"></div>
              ) : (
                <span>${Number(data?.price).toFixed(2)}</span>
              )}
            </small>
          )}

          {/* Entry Price */}
          <div className="grid gap-2 -mt-3">
            <Label htmlFor="entryPrice" className="text-base">
              Entry Price <span className="text-red-500">*</span>
            </Label>
            <Input
              id="entryPrice"
              name="entryPrice"
              type="number"
              step="0.000001"
              min="0"
              placeholder="Enter price"
              value={formData.entryPrice}
              onChange={handleInputChange}
              required
              className="h-12"
            />
          </div>

          {/* Stop Loss & Take Profit in same row */}
          <div className="grid grid-cols-2 gap-4 -mt-3">
            <div className="grid gap-2">
              <Label htmlFor="stopLoss" className="text-base">
                Stop Loss <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stopLoss"
                name="stopLoss"
                type="number"
                step="0.000001"
                min="0"
                placeholder="Stop loss"
                value={formData.stopLoss}
                onChange={handleInputChange}
                required
                className="h-12"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="takeProfit" className="text-base">
                Take Profit <span className="text-red-500">*</span>
              </Label>
              <Input
                id="takeProfit"
                name="takeProfit"
                type="number"
                step="0.000001"
                min="0"
                placeholder="Take profit"
                value={formData.takeProfit}
                onChange={handleInputChange}
                required
                className="h-12"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
            <p>
              <strong>Note:</strong> A 0.0001 USDC fee will be charged for
              creating this signal. If you don&apos;t have enough USDC and SOL,
              claim here{" "}
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                USDC Faucet
              </a>{" "}
              <a
                href="https://faucet.solana.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                SOL Faucet
              </a>
            </p>
          </div>
        </div>

        <DialogFooter className="-mt-3">
          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <CreateSignalButton
            onClose={() => setOpen(false)}
            formData={formData}
            setFormData={setFormData}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
