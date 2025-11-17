"use client";

import Image from "next/image";
import Link from "next/link";
import UnicornScene from "unicornstudio-react/next";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import "@n8n/chat/style.css";
import toast from "react-hot-toast";

const links = [
  { href: "https://syra.gitbook.io/syra-docs", label: "Documentation" },
  { href: "https://x.com/syra_agent", label: "X" },
  { href: "/feedback", label: "Feedback" },
];

export default function Provider({ children }: { children: React.ReactNode }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const feedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const feedback = formData.get("feedback") as string;
    const submit = await fetch("/api/feedback/create", {
      method: "POST",
      body: JSON.stringify({ username, feedback }),
    }).then((res) => res.json());
    if (submit.ok) {
      toast.success(submit.message);
      setFeedbackOpen(false);
      setIsSubmittingFeedback(false);
    } else {
      toast.error(submit.error);
      setIsSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    import("@n8n/chat").then(({ createChat }) => {
      createChat({
        webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL,
        webhookConfig: {
          method: "POST",
          headers: {},
        },
        target: "#n8n-chat",
        mode: "window",
        chatInputKey: "chatInput",
        chatSessionKey: "sessionId",
        metadata: {},
        showWelcomeScreen: false,
        defaultLanguage: "en",
        initialMessages: [
          "👋 Hello and welcome!",
          "I'm Syra AI Assistant — your information guide for the Syra Trading Ecosystem.",
          "Ask me anything about Syra, our Telegram bot, roadmap, or community.",
        ],
        i18n: {
          en: {
            title: "👋 Welcome to Syra AI Assistant",
            subtitle: "Ask anything about Syra — I'm here to help you 24/7.",
            footer: "",
            getStarted: "Start New Chat",
            inputPlaceholder: "Type your question about Syra...",
            closeButtonTooltip: "Close",
          },
        },
      });
    });
  }, []);

  return (
    <div className="min-h-screen w-full relative">
      {/* Dark Dot Matrix */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: "#0a0a0a",
          backgroundImage: `
       radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
       radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
     `,
          backgroundSize: "10px 10px",
          imageRendering: "pixelated",
        }}
      />
      {/* Your Content Here */}
      <div className="relative flex flex-col min-h-screen w-full items-center justify-center overflow-hidden">
        <div className="fixed inset-0 z-0 w-screen h-screen scale-150 opacity-20">
          <UnicornScene
            projectId="Fhi4t0mW37DNLD0b8SoL"
            width="100%"
            height="100%"
          />
        </div>
        {/* App Bar */}
        <Link href="/" className="absolute top-0 left-0 z-20 cursor-pointer">
          <Image
            src="/images/logo-transparent.png"
            alt="Syra Logo"
            width={128}
            height={128}
            className="rounded-full cursor-pointer w-24 h-24 sm:h-32 sm:w-32"
          />
        </Link>
        <div className="absolute top-8 sm:top-12 right-5 sm:right-15 flex gap-5 z-20">
          {links.map((link) => {
            if (link.href === "/feedback") {
              return null;
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : "_self"}
                className="text-white hover:text-gray-300"
              >
                {link.label}
              </Link>
            );
          })}
          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogTrigger asChild>
              <p className="text-white hover:text-gray-300 cursor-pointer">
                Feedback
              </p>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={feedbackSubmit}>
                <DialogHeader>
                  <DialogTitle>Feedback</DialogTitle>
                  <DialogDescription>
                    We would love to hear from you! Please let us know how we
                    can improve.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 mt-3">
                  <div className="grid gap-3">
                    <Label htmlFor="username-1">Username Telegram</Label>
                    <Input
                      id="username-1"
                      name="username"
                      required
                      placeholder="@syra_agent"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="feedback-1">Feedback</Label>
                    <Input
                      id="feedback-1"
                      name="feedback"
                      defaultValue=""
                      required
                      placeholder="Your feedback..."
                    />
                  </div>
                </div>
                <DialogFooter className="mt-3">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingFeedback}>
                    {isSubmittingFeedback ? "Submitting..." : "Submit"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {/* Hero Content */}
        {children}
        <footer className="absolute bottom-5 text-gray-500 text-sm z-20">
          &copy; 2025 Syra. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
