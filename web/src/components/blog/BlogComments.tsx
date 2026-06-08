import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentPreview {
  id: string;
  author: string;
  avatar?: string;
  role: string;
  content: string;
  timeAgo: string;
}

const PREVIEW_COMMENTS: CommentPreview[] = [
  {
    id: "1",
    author: "Agent Builder",
    role: "x402 integrator",
    content:
      "The MPP split settlement explanation finally clicked for me. Going to wire this into our research agent this week.",
    timeAgo: "2d ago",
  },
  {
    id: "2",
    author: "Solana Dev",
    role: "Backend engineer",
    content:
      "Love the playground-first approach. Tested the 402 flow in under five minutes.",
    timeAgo: "4d ago",
  },
];

export function BlogComments() {
  const [draft, setDraft] = useState("");
  const [posted, setPosted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosted(true);
    setDraft("");
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="blog-comments"
      aria-labelledby="blog-comments-heading"
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="blog-comments-icon flex h-10 w-10 items-center justify-center rounded-xl">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h2
            id="blog-comments-heading"
            className="font-display text-xl font-semibold tracking-tight text-foreground"
          >
            Discussion
          </h2>
          <p className="text-sm text-muted-foreground">
            {PREVIEW_COMMENTS.length} comments · Join the conversation
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="blog-comments-form mb-8 rounded-2xl p-5 sm:p-6"
      >
        <Textarea
          placeholder="Share your thoughts..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="mb-4 resize-none border-border/50 bg-background/50 backdrop-blur-sm"
          aria-label="Comment"
        />
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {posted ? "Thanks — your comment is queued for review." : "Be respectful. No financial advice."}
          </p>
          <Button type="submit" size="sm" className="gap-2 rounded-xl" disabled={!draft.trim()}>
            <Send className="h-3.5 w-3.5" />
            Post
          </Button>
        </div>
      </form>

      <ul className="space-y-4">
        {PREVIEW_COMMENTS.map((comment, index) => (
          <motion.li
            key={comment.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="blog-comment-card rounded-2xl p-5 sm:p-6"
          >
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 shrink-0 rounded-xl border border-border/40">
                <AvatarImage src={comment.avatar} alt="" />
                <AvatarFallback className="rounded-xl bg-muted text-xs font-medium">
                  {comment.author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">· {comment.role}</span>
                  <span className="text-xs text-muted-foreground/70">· {comment.timeAgo}</span>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
                  {comment.content}
                </p>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
