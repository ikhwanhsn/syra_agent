
import SectionHeader from "@/components/landing/SectionHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin, Send, Twitter } from "lucide-react";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const TeamSection = () => {

  const team = [
    {
      name: "Destriani Rahayu",
      role: "Founder & CEO",
      tagline: "Digital Strategy & Web3 Tech Innovation",
      avatar: "/images/rara.jpg",
      linkedin: "https://www.linkedin.com/in/destriani-rahayu-a39417247/",
      telegram: "https://t.me/raraverse",
      twitter: "https://twitter.com/raraverse__",
      avatarClassName: "[&_img]:object-contain [&_img]:scale-[1.47] [&_img]:translate-y-4",
    },
    {
      name: "Ikhwanul Husna",
      role: "Founder & CTO",
      tagline: "Fintech & DeFi · Cracked Dev",
      avatar: "/images/ikhwan.PNG",
      linkedin: "https://www.linkedin.com/in/ikhwanhsn",
      telegram: "https://t.me/ikhwanhsn",
      twitter: "https://twitter.com/ikhwanhsn",
      avatarClassName: "[&_img]:object-contain [&_img]:scale-[1.85] [&_img]:translate-y-7",
    },
  ];

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <section id="team" className="section-shell">
      <div className="section-divider" />
      <div className={cn(siteShell, "relative z-10")}>
        <SectionHeader
          eyebrow={"Our Team"}
          title={"Meet the Founders"}
          description={"The experienced team driving Solana ecosystem growth"}
        />

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {team.map((member, index) => (
            <div key={index} className="group card-premium-hover p-8">
              <div className="flex flex-col items-center text-center">
                <Avatar
                  className={`w-24 h-24 mb-5 ring-4 ring-primary/10 group-hover:ring-primary/25 transition-all overflow-hidden ${member.avatarClassName ?? ""}`}
                >
                  <AvatarImage src={member.avatar} alt={member.name} className="object-contain" />
                  <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                <h3 className="text-xl font-semibold text-foreground mb-1 tracking-tight">
                  {member.name}
                </h3>
                <p className="text-primary font-medium text-sm mb-2">{member.role}</p>
                <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
                  {member.tagline}
                </p>

                <div className="flex items-center justify-center gap-2">
                  {[
                    { href: member.linkedin, icon: Linkedin, label: "LinkedIn" },
                    { href: member.telegram, icon: Send, label: "Telegram" },
                    { href: member.twitter, icon: Twitter, label: "Twitter" },
                  ].map(({ href, icon: Icon, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on ${label}`}
                      className="w-10 h-10 rounded-full bg-muted/50 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
