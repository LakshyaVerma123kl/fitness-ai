"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Mic, MicOff, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface AIChatCoachProps {
  planContext?: {
    goal?: string;
    level?: string;
    diet?: string;
  };
}

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const QUICK_PROMPTS = [
  "How do I improve my form?",
  "What should I eat before a workout?",
  "How long should I rest between sets?",
  "Can I still train if I'm sore?",
];

export default function AIChatCoach({ planContext }: AIChatCoachProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! 👋 I'm your AI fitness coach. Ask me anything about your workout, diet, or how to stay on track! You can also use the mic to speak your question.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(supported);
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: msg, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setShowQuickPrompts(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          planContext,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I couldn't get a response right now. Try again!",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again in a moment.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, planContext]);

  const startVoiceInput = useCallback(() => {
    if (!speechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");

      setInput(transcript);

      if (event.results[event.results.length - 1].isFinal) {
        sendMessage(transcript);
      }
    };

    recognition.onerror = () => setIsListening(false);

    recognition.start();
  }, [speechSupported, sendMessage]);

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[200] w-14 h-14 bg-gradient-to-br from-[var(--color-primary)] to-blue-500 rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center text-black"
            aria-label="Open AI Coach Chat"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[200] w-[340px] sm:w-[400px] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-[var(--color-border)]"
            style={{ maxHeight: "580px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--color-primary)]/20 to-blue-500/20 backdrop-blur-xl border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between bg-[var(--color-card)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-blue-500 flex items-center justify-center">
                  <Bot size={16} className="text-black" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">AI Coach</p>
                  <p className="text-[10px] text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                    Online {speechSupported && "• Voice Enabled"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition text-[var(--color-text-secondary)]"
                aria-label="Close chat"
              >
                <Minimize2 size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-dark)] no-scrollbar" style={{ maxHeight: "400px" }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                      msg.role === "user"
                        ? "bg-blue-500"
                        : "bg-gradient-to-br from-[var(--color-primary)] to-blue-500"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User size={12} className="text-white" />
                    ) : (
                      <Bot size={12} className="text-black" />
                    )}
                  </div>
                  <div
                    className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white rounded-tr-sm"
                        : "bg-[var(--color-card)] text-[var(--color-text)] border border-[var(--color-border)] rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Quick Prompts */}
              {showQuickPrompts && messages.length === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <p className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} /> Quick questions
                  </p>
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition bg-[var(--color-card)]"
                    >
                      {prompt}
                    </button>
                  ))}
                </motion.div>
              )}

              {loading && (
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-blue-500 flex items-center justify-center shrink-0">
                    <Bot size={12} className="text-black" />
                  </div>
                  <div className="px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Voice waveform indicator */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-red-500/10 border-t border-red-500/30 px-4 py-2 flex items-center gap-2"
                >
                  <span className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ scaleY: [1, 2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                        className="w-1 h-3 bg-red-400 rounded-full inline-block origin-center"
                      />
                    ))}
                  </span>
                  <span className="text-xs text-red-400 font-medium">Listening… speak now</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-card)] flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask your coach anything…"
                className="flex-1 text-sm bg-[var(--color-dark)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-xl px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] transition"
              />
              {speechSupported && (
                <button
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-white/5 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]"
                  }`}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                >
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              )}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-gradient-to-br from-[var(--color-primary)] to-blue-500 rounded-xl flex items-center justify-center text-black disabled:opacity-40 transition hover:opacity-90 shrink-0"
                aria-label="Send message"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
