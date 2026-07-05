import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Button } from "@/components/ui/button";
import { Twitter, BookOpen, ExternalLink, Users, Heart } from "lucide-react";

const communities = [
  // Hidden: focus on website — Telegram
  // {
  //   icon: Send,
  //   title: "Telegram",
  //   description: "Join our Telegram for updates, support, and community discussions.",
  //   href: "https://t.me/syra_ai",
  //   cta: "Join Telegram",
  // },
  {
    icon: Twitter,
    title: "X (Twitter)",
    description: "Follow us for the latest updates, alpha, and community highlights.",
    href: "https://x.com/syra_agent",
    cta: "Follow @syra_agent",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "API reference, guides, and technical documentation.",
    href: "https://docs.syraa.fun",
    cta: "Open Docs",
  },
  {
    icon: ExternalLink,
    title: "Website",
    description: "Machine money for agents on Solana — product overview and updates.",
    href: "https://syraa.fun",
    cta: "Visit syraa.fun",
  },
];

const resources = [
  {
    icon: BookOpen,
    title: "Blog",
    description: "Deep dives, tutorials, and thought leadership on AI agents.",
    href: "#",
  },
  {
    icon: Users,
    title: "Showcase",
    description: "See what the community is building with Syra.",
    href: "#",
  },
  {
    icon: Heart,
    title: "Contributing",
    description: "Learn how to contribute to Syra's open-source projects.",
    href: "#",
  },
];

const tocItems = [
  { id: "join", title: "Join the Community", level: 2 },
  { id: "resources", title: "Resources", level: 2 },
  { id: "support", title: "Get Support", level: 2 },
];

export default function Community() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Resources"
        title="Community & Support"
        description="Connect with the Syra community and get help when you need it."
      />

      <DocSection id="join" title="Join the Community">
        <div className="not-prose grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {communities.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-border/60 bg-muted/20 p-5 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <item.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1.5 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{item.description}</p>
              <Button variant="outline" size="sm" className="w-full pointer-events-none">
                {item.cta}
              </Button>
            </a>
          ))}
        </div>
      </DocSection>

      <DocSection id="resources" title="Resources">
        <div className="not-prose grid sm:grid-cols-3 gap-3">
          {resources.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group flex items-start gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary shrink-0">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium group-hover:text-primary transition-colors">{item.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{item.description}</div>
              </div>
            </a>
          ))}
        </div>
      </DocSection>

      <DocSection id="support" title="Get Support">
        <div className="not-prose rounded-lg border border-border/60 bg-muted/20 p-4 sm:p-6">
          <p className="text-muted-foreground mb-5 sm:mb-6 leading-7">
            Need help? Our community is here for you:
          </p>
          <ul className="space-y-4 sm:space-y-5 text-sm">
            {/* Hidden: focus on website — Telegram support
            <li className="flex flex-col gap-1.5 sm:gap-2">
              <span className="flex items-center gap-2">
                <span className="text-primary font-medium">•</span>
                <strong className="text-foreground">Telegram</strong>
              </span>
              <p className="text-muted-foreground pl-4 sm:pl-5">Best for quick questions and real-time help.</p>
              <a
                href="https://t.me/syra_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 w-fit min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors text-sm font-medium"
              >
                t.me/syra_ai
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </li>
            */}
            <li className="flex flex-col gap-1.5 sm:gap-2">
              <span className="flex items-center gap-2">
                <span className="text-primary font-medium">•</span>
                <strong className="text-foreground">X (Twitter)</strong>
              </span>
              <p className="text-muted-foreground pl-4 sm:pl-5">Updates and community.</p>
              <a
                href="https://x.com/syra_agent"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 w-fit min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-border/60 transition-colors text-sm font-medium"
              >
                @syra_agent
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </li>
            <li className="flex flex-col gap-1.5 sm:gap-2">
              <span className="flex items-center gap-2">
                <span className="text-primary font-medium">•</span>
                <strong className="text-foreground">Documentation</strong>
              </span>
              <p className="text-muted-foreground pl-4 sm:pl-5">API reference and guides.</p>
              <a
                href="https://docs.syraa.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 w-fit min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-border/60 transition-colors text-sm font-medium"
              >
                docs.syraa.fun
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </li>
            <li className="flex flex-col gap-1.5 sm:gap-2">
              <span className="flex items-center gap-2">
                <span className="text-primary font-medium">•</span>
                <strong className="text-foreground">API Playground</strong>
              </span>
              <p className="text-muted-foreground pl-4 sm:pl-5">Try the API interactively.</p>
              <a
                href="https://syraa.fun/playground"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 w-fit min-h-[44px] px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-border/60 transition-colors text-sm font-medium"
              >
                syraa.fun/playground
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </li>
            <li className="flex flex-col gap-1.5 sm:gap-2">
              <span className="flex items-center gap-2">
                <span className="text-primary font-medium">•</span>
                <strong className="text-foreground">Email (dev)</strong>
              </span>
              <p className="text-muted-foreground pl-4 sm:pl-5">Reach out for development or partnership inquiries.</p>
              <a
                href="mailto:support@syraa.fun"
                className="inline-flex items-center w-fit min-h-[44px] px-3 py-2 rounded-lg bg-muted/80 text-foreground hover:bg-muted border border-border/60 transition-colors text-sm font-medium break-all"
              >
                support@syraa.fun
              </a>
            </li>
          </ul>
        </div>
      </DocSection>
    </DocsLayout>
  );
}
