import { useState } from 'react'
import { Brain, Send, Sparkles } from 'lucide-react'
import { brainSampleMessages } from '../data/dummyData'

export default function SyraBrain() {
  const [messages, setMessages] = useState(brainSampleMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Analyzing: "${userMsg.content}"...\n\nBased on current market data, I'd recommend monitoring key support/resistance levels. Overall sentiment remains cautiously optimistic with institutional flows supporting the market.`,
        },
      ])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-1">
          <Brain size={10} className="text-terminal-accent" />
          <span>Syra Brain</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Sparkles size={8} className="text-terminal-yellow" />
          <span className="text-[9px] text-terminal-yellow">AI</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-1.5 space-y-1.5" style={{ minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] px-2 py-1 text-[10px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-terminal-accent/15 text-terminal-text border border-terminal-accent/20'
                  : 'bg-terminal-bg border border-terminal-border text-terminal-text'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-0.5 mb-0.5 text-[9px] text-terminal-accent font-semibold">
                  <Brain size={8} /> SYRA
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-terminal-bg border border-terminal-border px-2 py-1 text-[10px]">
              <div className="flex items-center gap-0.5 text-terminal-accent">
                <Brain size={8} />
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-1 border-t border-terminal-border flex-shrink-0">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Syra anything..."
            className="flex-1 bg-terminal-bg border border-terminal-border px-2 py-0.5 text-[10px] text-terminal-text placeholder:text-terminal-muted focus:outline-none focus:border-terminal-accent/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-1 bg-terminal-accent/20 text-terminal-accent hover:bg-terminal-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send size={10} />
          </button>
        </div>
      </form>
    </div>
  )
}
