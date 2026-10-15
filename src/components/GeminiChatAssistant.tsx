import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Notice } from '../types';
import { useTheme } from '../context/ThemeContext';

interface GeminiChatAssistantProps {
  notices: Notice[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const GeminiChatAssistant: React.FC<GeminiChatAssistantProps> = ({ notices }) => {
  const { themeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your KGEC Notice AI Assistant powered by Gemini. Ask me anything about exam deadlines, hostel notices, admission circulars, or departmental updates!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      // Initialize Gemini SDK with model gemini-2.5-flash or gemini-3.8-flash via @google/genai
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      const ai = new GoogleGenAI(); // picks up GEMINI_API_KEY automatically from runtime environment

      // Build context from active notices
      const noticesContext = notices
        .map(
          (n) =>
            `- Title: ${n.title}\n  Category: ${n.category}\n  Memo: ${n.refNumber}\n  Date: ${n.publishDate}\n  Deadline: ${n.deadlineDate || 'None'}\n  Content: ${n.content}`
        )
        .join('\n\n');

      const systemInstruction = `You are the official KGEC (Kalyani Government Engineering College) AI Notice Assistant created by Upasyo Kushari. You help students, faculty, and visitors query official notices, examination schedules, hostel closures, and admission guidelines. Use the following active college notices as your primary knowledge base:\n\n${noticesContext}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question: ${userText}` }],
          },
        ],
      });

      const reply = response.text || 'I could not retrieve details right now. Please check the notice board directly.';

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.warn('Gemini chat error:', err);
      // Fallback response if API key is not yet configured in runtime secrets
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I am currently operating in offline advisory mode. You can browse all active notices directly from the categories above or check the official notice board at kgec.edu.in.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full ${themeConfig.primaryClass} shadow-2xl hover:scale-105 transition-all duration-300 font-bold text-xs uppercase tracking-wider`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>Ask KGEC AI Assistant</span>
        </button>
      </div>

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 z-50 sm:max-w-md w-full sm:h-[550px] bg-white dark:bg-stone-900 rounded-none sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">KGEC Notice AI Assistant</h3>
                <p className="text-[11px] text-stone-400">Powered by Gemini & Real-time Firestore</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Scrollable Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50 dark:bg-stone-950/40">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white font-bold text-xs'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? `${themeConfig.primaryClass} rounded-br-xs`
                      : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Gemini is checking active notices...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about exams, hostel, deadlines..."
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`p-2 rounded-xl ${themeConfig.primaryClass} disabled:opacity-50 transition-all`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
