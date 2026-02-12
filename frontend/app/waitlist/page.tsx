"use client";

import { useState } from "react";
import { toast } from "sonner";
import Provider from "../Provider";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitWaitlist = async () => {
    const res = await fetch(`/api/waitlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, username }),
    });
    const data = await res.json();
    if (data.error) {
      toast.error(data.error);
      return;
    }
    toast.success("Thanks for your waitlist!");
  };

  const handleSubmit = () => {
    if (!email || !username) return;

    setIsSubmitting(true);
    submitWaitlist().then(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail("");
      setUsername("");

      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    });
  };

  return (
    <Provider>
      <div className="relative flex flex-col min-h-screen w-full items-center justify-center overflow-hidden px-4">
        {/* Main Content */}
        <div className="z-10 flex flex-col items-center justify-center text-center max-w-2xl w-full">
          <h1 className="text-6xl font-bold text-zinc-50 mb-4">
            Join the{" "}
            <span className="bg-linear-to-r from-zinc-50 to-zinc-600 bg-clip-text text-transparent">
              Waitlist
            </span>
          </h1>

          <p className="text-xl text-zinc-300 mb-8">
            Be among the first to experience the future of automated trading.
            Get early access to Syra Web App.
          </p>

          {/* Waitlist Form */}
          <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  You're on the list!
                </h3>
                <p className="text-zinc-400">
                  We'll notify you when we launch.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-300 text-left"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="telegram"
                    className="block text-sm font-medium text-zinc-300 text-left"
                  >
                    Username
                  </label>
                  <input
                    id="telegram"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@syra_agent"
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !email || !username}
                  className="w-full bg-black text-white px-6 py-3 rounded-lg text-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    "Join Waitlist"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full">
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
              <p className="text-zinc-400 text-sm">
                Execute trades in milliseconds
              </p>
            </div>
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="text-white font-semibold mb-2">Secure</h3>
              <p className="text-zinc-400 text-sm">Bank-level encryption</p>
            </div>
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-white font-semibold mb-2">AI-Powered</h3>
              <p className="text-zinc-400 text-sm">Smart trading algorithms</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-5 text-gray-500 text-sm z-20">
          &copy; 2025 Syra. All rights reserved.
        </footer>
      </div>
    </Provider>
  );
}
