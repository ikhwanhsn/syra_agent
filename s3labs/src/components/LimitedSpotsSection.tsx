import React, { useState } from "react";

import { AlertCircle, Clock, Users, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

interface LimitedSpotsSectionProps {
  onApplyClick: () => void;
}

const LimitedSpotsSection = ({ onApplyClick }: LimitedSpotsSectionProps) => {
  const [spotsRemaining] = useState(5);
  const totalSpots = 10;

  const urgencyFeatures = [
    {
      icon: Clock,
      title: "Program Starts",
      value: "February 15, 2025",
    },
    {
      icon: Users,
      title: "Limited Capacity",
      value: "Only 10 Projects/Batch",
    },
    {
      icon: Flame,
      title: "Registration Closes",
      value: "31 January 2025",
    },
  ];

  return (
    <section
      id="limited-spots"
      className="py-24 lg:py-32 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className={cn(siteShell, "relative z-10")}>
        <div className="max-w-5xl mx-auto">
          {/* Main Card */}
          <div className="bg-card border-2 border-primary/30 rounded-3xl shadow-2xl overflow-hidden">
            {/* Alert Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 animate-pulse">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {"⚡ Limited Spots for Q1 2025"}
              </h2>
              <p className="text-white/90 text-lg">
                {"Our accelerator program has limited capacity"}
              </p>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12">
              {/* Spots Counter */}
              <div className="text-center mb-12">
                <div className="inline-block">
                  <div className="text-7xl md:text-8xl font-bold text-gradient mb-2">
                    {spotsRemaining}
                  </div>
                  <p className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                    {"Spots Remaining"}
                  </p>
                  <p className="text-muted-foreground">
                    {"out of 10 projects we accept per batch"}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {"Spots Filled"}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {totalSpots - spotsRemaining}/{totalSpots}
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out relative"
                    style={{
                      width: `${
                        ((totalSpots - spotsRemaining) / totalSpots) * 100
                      }%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Urgency Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {urgencyFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="text-center p-6 rounded-2xl bg-muted/50 border border-border hover:border-primary/50 transition-all hover-lift"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {feature.title}
                    </p>
                    <p className="font-bold text-foreground text-lg">
                      {feature.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Why Limited */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 mb-8">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {"Why Do We Limit Spots?"}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-xs font-bold">✓</span>
                    </div>
                    <p className="text-muted-foreground">
                      {"Every founder gets a dedicated mentor and weekly 1-on-1 sessions"}
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-xs font-bold">✓</span>
                    </div>
                    <p className="text-muted-foreground">
                      {"We focus on quality over quantity for maximum results"}
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-xs font-bold">✓</span>
                    </div>
                    <p className="text-muted-foreground">
                      {"Our network and resources are exclusively shared with cohort members"}
                    </p>
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Button
                  onClick={onApplyClick}
                  variant="hero"
                  size="xl"
                  className="group mb-4"
                >
                  {"Secure Your Spot Now"}
                  <Flame className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  {"Selection process takes 7-14 days. Apply now!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LimitedSpotsSection;
