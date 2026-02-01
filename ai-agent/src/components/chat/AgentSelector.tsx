import { ChevronDown, Bot, Sparkles, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: typeof Bot;
  color: string;
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

const defaultAgents: Agent[] = [
  {
    id: "syra-pro",
    name: "Syra Agent Pro",
    description: "Most capable model for complex tasks",
    icon: Sparkles,
    color: "from-primary to-[hsl(199,89%,48%)]",
  },
  {
    id: "syra-fast",
    name: "Syra Agent Fast",
    description: "Quick responses for simple queries",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "syra-code",
    name: "Syra Agent Code",
    description: "Specialized for programming tasks",
    icon: Brain,
    color: "from-violet-500 to-purple-500",
  },
];

export function AgentSelector({
  agents = defaultAgents,
  selectedAgent,
  onSelectAgent,
}: AgentSelectorProps) {
  const Icon = selectedAgent.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-1.5 sm:gap-2 px-2 sm:px-3 h-9 sm:h-10 hover:bg-secondary/80 border border-transparent hover:border-border min-w-0 max-w-full"
        >
          <div
            className={cn(
              "w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
              selectedAgent.color
            )}
          >
            <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
          </div>
          <span className="font-medium text-sm sm:text-base truncate">{selectedAgent.name}</span>
          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="text-muted-foreground font-normal">
          Select AI Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {agents.map((agent) => {
          const AgentIcon = agent.icon;
          return (
            <DropdownMenuItem
              key={agent.id}
              onClick={() => onSelectAgent(agent)}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer",
                selectedAgent.id === agent.id && "bg-secondary"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
                  agent.color
                )}
              >
                <AgentIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground">{agent.description}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { defaultAgents, type Agent };
