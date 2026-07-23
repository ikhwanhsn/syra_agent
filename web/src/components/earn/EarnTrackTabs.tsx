import { Code2, Coins, Droplets, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const TRACKS = [
  { id: "yield", label: "Yield", icon: Droplets },
  { id: "token", label: "Tokens", icon: Coins },
  { id: "prompts", label: "Playbooks", icon: FileText },
  { id: "skills", label: "Skills", icon: Code2 },
] as const;

type EarnTrackTabsProps = {
  activeTrack: string;
  onTrackChange: (value: string) => void;
  yieldContent: React.ReactNode;
  promptsContent: React.ReactNode;
  skillsContent: React.ReactNode;
  tokenContent: React.ReactNode;
};

export function EarnTrackTabs({
  activeTrack,
  onTrackChange,
  yieldContent,
  promptsContent,
  skillsContent,
  tokenContent,
}: EarnTrackTabsProps) {
  return (
    <Tabs value={activeTrack} onValueChange={onTrackChange}>
      <TabsList
        className={cn(
          "grid h-auto w-full max-w-2xl grid-cols-4 gap-1 rounded-full border border-border/40 bg-muted/15 p-1",
          "shadow-none",
        )}
      >
        {TRACKS.map((track) => {
          const Icon = track.icon;
          return (
            <TabsTrigger
              key={track.id}
              value={track.id}
              className={cn(
                "gap-1.5 rounded-full px-3 py-2.5 text-[13px] font-medium shadow-none",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/50",
              )}
            >
              <Icon className="h-3.5 w-3.5 opacity-70" />
              {track.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="yield" className="mt-8">
        {yieldContent}
      </TabsContent>
      <TabsContent value="prompts" className="mt-8">
        {promptsContent}
      </TabsContent>
      <TabsContent value="skills" className="mt-8">
        {skillsContent}
      </TabsContent>
      <TabsContent value="token" className="mt-8">
        {tokenContent}
      </TabsContent>
    </Tabs>
  );
}
