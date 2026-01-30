import { useState, useEffect } from "react";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { Agent, defaultAgents } from "@/components/chat/AgentSelector";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolUsage?: {
    name: string;
    status: "running" | "complete" | "error";
  };
}

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
  messages: Message[];
}

// Sample chat data
const sampleChats: Chat[] = [
  {
    id: "1",
    title: "React Component Help",
    timestamp: new Date(),
    preview: "How do I create a custom hook?",
    messages: [
      {
        id: "1-1",
        role: "user",
        content: "How do I create a custom React hook for fetching data?",
        timestamp: new Date(Date.now() - 60000),
      },
      {
        id: "1-2",
        role: "assistant",
        content: "Here's how to create a custom React hook for fetching data:\n\n```typescript\nimport { useState, useEffect } from 'react';\n\nfunction useFetch<T>(url: string) {\n  const [data, setData] = useState<T | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<Error | null>(null);\n\n  useEffect(() => {\n    async function fetchData() {\n      try {\n        const response = await fetch(url);\n        const json = await response.json();\n        setData(json);\n      } catch (err) {\n        setError(err as Error);\n      } finally {\n        setLoading(false);\n      }\n    }\n    fetchData();\n  }, [url]);\n\n  return { data, loading, error };\n}\n```\n\nThis hook handles **loading states**, **error handling**, and **data fetching** automatically!",
        timestamp: new Date(Date.now() - 30000),
      },
    ],
  },
  {
    id: "2",
    title: "API Integration",
    timestamp: new Date(Date.now() - 86400000),
    preview: "Best practices for REST APIs",
    messages: [],
  },
  {
    id: "3",
    title: "Database Design",
    timestamp: new Date(Date.now() - 86400000 * 2),
    preview: "Schema for user management",
    messages: [],
  },
  {
    id: "4",
    title: "Deployment Strategy",
    timestamp: new Date(Date.now() - 86400000 * 5),
    preview: "CI/CD pipeline setup",
    messages: [],
  },
];

export default function Index() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>(sampleChats);
  const [activeChat, setActiveChat] = useState<string | null>("1");
  const [selectedAgent, setSelectedAgent] = useState<Agent>(defaultAgents[0]);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const currentChat = chats.find((c) => c.id === activeChat);
  const messages = currentChat?.messages || [];

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      timestamp: new Date(),
      preview: "",
      messages: [],
    };
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
    setSidebarOpen(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChat) {
      handleNewChat();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              preview: content.slice(0, 50),
              title: chat.messages.length === 0 ? content.slice(0, 30) : chat.title,
            }
          : chat
      )
    );

    setIsLoading(true);

    // Simulate AI response with streaming
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );

      // Simulate streaming text
      const responseText = `I understand you're asking about "${content.slice(0, 50)}...". Let me help you with that!\n\nHere's a comprehensive response that addresses your question. I can provide **detailed explanations**, code examples, and best practices.\n\n\`\`\`javascript\n// Example code\nconst solution = {\n  approach: "systematic",\n  quality: "high"\n};\n\`\`\`\n\nIs there anything specific you'd like me to elaborate on?`;

      let charIndex = 0;
      const streamInterval = setInterval(() => {
        charIndex += 3;
        if (charIndex >= responseText.length) {
          clearInterval(streamInterval);
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChat
                ? {
                    ...chat,
                    messages: chat.messages.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, content: responseText, isStreaming: false }
                        : m
                    ),
                  }
                : chat
            )
          );
          setIsLoading(false);
        } else {
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChat
                ? {
                    ...chat,
                    messages: chat.messages.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, content: responseText.slice(0, charIndex) }
                        : m
                    ),
                  }
                : chat
            )
          );
        }
      }, 20);
    }, 500);
  };

  const handleStopGeneration = () => {
    setIsLoading(false);
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              messages: chat.messages.map((m) =>
                m.isStreaming ? { ...m, isStreaming: false } : m
              ),
            }
          : chat
      )
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={(id) => {
          setActiveChat(id);
          setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          "lg:ml-[280px]"
        )}
      >
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
      </main>
    </div>
  );
}
