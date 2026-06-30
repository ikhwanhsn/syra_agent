import { ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface MobileTocProps {
  items: TOCItem[];
  activeId: string;
}

export function MobileToc({ items, activeId }: MobileTocProps) {
  if (items.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="xl:hidden fixed bottom-6 right-6 z-40 shadow-lg border-border/60 bg-card/95 backdrop-blur-sm gap-2 min-touch"
          aria-label="On this page"
        >
          <ListTree className="h-4 w-4" />
          On this page
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70dvh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="text-left">On this page</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 space-y-1 overflow-y-auto max-h-[50dvh]">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "block py-2 text-sm border-l-2 transition-colors",
                item.level === 2 ? "pl-3" : "pl-6 text-muted-foreground",
                activeId === item.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              {item.title}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
