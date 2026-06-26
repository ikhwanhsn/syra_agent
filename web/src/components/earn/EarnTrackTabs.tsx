import { Code2, Coins, FileText, Megaphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TRACKS = [
  { id: "prompts", label: "Playbooks", icon: FileText },
  { id: "kol", label: "Promote", icon: Megaphone },
  { id: "skills", label: "API skills", icon: Code2 },
  { id: "token", label: "Token", icon: Coins },
] as const;

type EarnTrackTabsProps = {
  activeTrack: string;
  onTrackChange: (value: string) => void;
  promptsContent: React.ReactNode;
  kolContent: React.ReactNode;
  skillsContent: React.ReactNode;
  tokenContent: React.ReactNode;
};

export function EarnTrackTabs({
  activeTrack,
  onTrackChange,
  promptsContent,
  kolContent,
  skillsContent,
  tokenContent,
}: EarnTrackTabsProps) {
  return (
    <Tabs value={activeTrack} onValueChange={onTrackChange}>
      <TabsList className="grid h-auto w-full max-w-xl grid-cols-2 sm:grid-cols-4">
        {TRACKS.map((track) => {
          const Icon = track.icon;
          return (
            <TabsTrigger key={track.id} value={track.id} className="gap-1.5 text-sm">
              <Icon className="h-3.5 w-3.5" />
              {track.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="prompts" className="mt-6">
        {promptsContent}
      </TabsContent>
      <TabsContent value="kol" className="mt-6">
        {kolContent}
      </TabsContent>
      <TabsContent value="skills" className="mt-6">
        {skillsContent}
      </TabsContent>
      <TabsContent value="token" className="mt-6">
        {tokenContent}
      </TabsContent>
    </Tabs>
  );
}
