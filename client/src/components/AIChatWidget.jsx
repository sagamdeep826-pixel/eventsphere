import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, X, Sparkles, ArrowRight } from 'lucide-react';

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I am the EventSphere AI Campus Assistant. Ask me about free hackathons, upcoming workshops, certificates, or QR tickets!',
      suggestedEvents: []
    }
  ]);

  const sendPrompt = async (promptText) => {
    const text = (promptText ?? input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: text });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.data.reply,
          suggestedEvents: res.data.suggestedEvents || []
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an issue connecting to the server. Please try again!',
          suggestedEvents: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Any free hackathons?',
    'How do certificates work?',
    'Events for team coding?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-semibold text-sm">Ask EventSphere AI</h3>
                <p className="text-xs text-indigo-200">Smart Event & Campus Guide</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-100 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 h-80 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm max-w-[85%] ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-xs'
                  }`}
                >
                  {m.text}
                </div>
                {m.suggestedEvents && m.suggestedEvents.length > 0 && (
                  <div className="mt-2 space-y-1.5 w-[85%]">
                    {m.suggestedEvents.map((ev) => (
                      <Link
                        key={ev.id}
                        to={`/events/${ev.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <span className="truncate">{ev.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-400 italic px-2">AI is thinking...</div>
            )}
          </div>

          <div className="px-3 py-2 bg-gray-100 border-t border-gray-200 flex gap-1.5 overflow-x-auto">
            {quickPrompts.map((q) => (
              <button
                key={q}
                onClick={() => sendPrompt(q)}
                className="text-xs bg-white hover:bg-indigo-50 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt();
            }}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about events, rules, seats..."
              className="flex-grow text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center space-x-2 font-medium transition-transform hover:scale-105"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Ask AI</span>
        </button>
      )}
    </div>
  );
};

export default AIChatWidget;
