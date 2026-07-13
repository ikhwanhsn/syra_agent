import { FlaskConical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboardGate } from "@/components/dashboard/AdminDashboardGate";
import { X402LabTab } from "@/components/labs/x402/X402LabTab";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export default function LabsPage() {
  return (
    <AdminDashboardGate featureLabel="Labs">
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "pb-12",
        )}
      >
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <FlaskConical className="h-6 w-6 text-primary" aria-hidden />
            Labs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Internal experiments and tooling — admin access only.
          </p>
        </div>

        <Tabs defaultValue="solana">
          <TabsList>
            <TabsTrigger value="solana">Solana</TabsTrigger>
            <TabsTrigger value="base">Base</TabsTrigger>
            <TabsTrigger value="celo">Celo</TabsTrigger>
          </TabsList>
          <TabsContent value="solana" className="mt-6">
            <X402LabTab chain="solana" />
          </TabsContent>
          <TabsContent value="base" className="mt-6">
            <X402LabTab chain="base" />
          </TabsContent>
          <TabsContent value="celo" className="mt-6">
            <X402LabTab chain="celo" />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardGate>
  );
}
