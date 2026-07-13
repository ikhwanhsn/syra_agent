import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { LabChain } from "@/lib/labsX402Api";

interface CreateWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { label: string; role: "payer" | "payto" }) => void;
  isPending: boolean;
  hasPayTo: boolean;
  chain?: LabChain;
}

function roleOptions(chain: LabChain) {
  const network = chain === "base" ? "Base" : "Solana";
  return [
    {
      value: "payer" as const,
      title: "Payer",
      description: `Signs x402 payments to /insights/* endpoints on ${network}`,
    },
    {
      value: "payto" as const,
      title: "PayTo",
      description: `Receives payments and refunds USDC back to payers on ${network}`,
    },
  ];
}

export function CreateWalletDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  hasPayTo,
  chain = "solana",
}: CreateWalletDialogProps) {
  const [label, setLabel] = useState("");
  const [role, setRole] = useState<"payer" | "payto">("payer");
  const options = roleOptions(chain);

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onSubmit({ label: trimmed, role });
    setLabel("");
    setRole("payer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Create {chain === "base" ? "Base" : "Solana"} lab wallet
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wallet-label">Label</Label>
            <Input
              id="wallet-label"
              placeholder="e.g. Payer #1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as "payer" | "payto")}
              className="grid gap-2"
            >
              {options.map((opt) => {
                const disabled = opt.value === "payto" && hasPayTo;
                return (
                  <label
                    key={opt.value}
                    htmlFor={`role-${opt.value}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors",
                      role === opt.value && "border-primary/50 bg-primary/5",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <RadioGroupItem
                      value={opt.value}
                      id={`role-${opt.value}`}
                      disabled={disabled}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {opt.title}
                        {disabled ? " (already exists)" : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!label.trim() || isPending}>
            {isPending ? "Creating…" : "Create wallet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
