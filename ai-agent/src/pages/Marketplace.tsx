import { Store } from "lucide-react";

export default function Marketplace() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Store className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Marketplace</h1>
        <p className="text-muted-foreground">Soon available. Check back later.</p>
      </div>
    </div>
  );
}
