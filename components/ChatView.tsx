
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ExternalLink, Globe } from 'lucide-react';
import { generateTextWithSearch } from '../services/geminiService';
import { Message } from '../types';

const ChatView: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am Aura, your research-driven assistant. I can search the web for the latest information. How can I help you today?',
      timestamp: Date.now()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const response = await generateTextWithSearch(currentInput);
      
      const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
        title: chunk.web?.title || 'Source',
        uri: chunk.web?.uri || ''
      })).filter(c => c.uri) || [];

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'Sorry, I couldn\'t generate a response.',
        timestamp: Date.now(),
        groundingUrls
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Error: Failed to connect to Gemini API. Please check your network and API key.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : msg.role === 'system'
                ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                : 'glass text-gray-100'
            }`}>
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                    <Globe size={14} />
                    <span>Search Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingUrls.map((link, i) => (
                      <a 
                        key={i} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-indigo-200 transition-colors"
                      >
                        {link.title} <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <Loader2 className="animate-spin text-indigo-400" size={20} />
              <span className="text-sm text-gray-400">Searching and thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 bg-gradient-to-t from-gray-950 pt-10">
        <div className="max-w-4xl mx-auto relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Aura anything..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-100 shadow-2xl"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-lg"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-widest font-medium">Powered by Gemini 3 Flash • Real-time Search Grounding Enabled</p>
      </div>
    </div>
  );
};

export default ChatView;
