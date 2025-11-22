
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../types';
import { User, Pencil, Check, X } from 'lucide-react';
import { GroundingChunk } from '@google/genai';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onUpdateMessage: (messageId: string, newText: string) => void;
}

const SpideyLogo: React.FC = () => (
    <div className="w-8 h-8 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 12L12 22L22 12L12 2Z" fill="white" fillOpacity="0.9"/>
        </svg>
    </div>
);

const BlinkingCursor: React.FC = () => <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-400 animate-pulse rounded-full align-middle"></span>;

const GroundingInfo: React.FC<{ chunks: GroundingChunk[] }> = ({ chunks }) => (
    <div className="mt-2 pt-2 border-t border-white/5">
      <div className="flex flex-wrap gap-2">
        {chunks.map((chunk, index) => {
          const source = chunk.web || chunk.maps;
          if (source && source.uri) {
            return (
              <a
                key={index}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/40 hover:bg-white/10 border border-white/5 text-[10px] text-zinc-400 hover:text-blue-300 px-2.5 py-1 rounded-full transition-all active:scale-95"
              >
                {source.title || new URL(source.uri).hostname}
              </a>
            );
          }
          return null;
        })}
      </div>
    </div>
);

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onUpdateMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string, text: string } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSaveEdit = () => {
    if (editingMessage) {
        onUpdateMessage(editingMessage.id, editingMessage.text);
        setEditingMessage(null);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-3 sm:px-4 pb-4">
      <div className="flex-grow space-y-6 py-4">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex items-end gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="pb-1"><SpideyLogo /></div>}
            
            <div className={`rounded-[1.3rem] px-1 max-w-[85%] sm:max-w-[75%] relative transition-all duration-300 group
                ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-900/20 rounded-br-sm' 
                    : 'bg-zinc-900/60 backdrop-blur-xl border border-white/5 text-zinc-100 rounded-bl-sm shadow-sm'
                }`}
            >
                {msg.imagePreview && (
                    <div className="p-1 pb-0">
                        <img src={msg.imagePreview} alt="User upload" className="rounded-[1rem] mb-1 max-h-64 border border-white/10 w-full object-cover" />
                    </div>
                )}
                
                {editingMessage?.id === msg.id ? (
                    <div className="p-3">
                        <textarea
                            value={editingMessage.text}
                            onChange={(e) => setEditingMessage({ ...editingMessage, text: e.target.value })}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setEditingMessage(null)} className="p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white"><X size={14} /></button>
                            <button onClick={handleSaveEdit} className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-400"><Check size={14} /></button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={`py-2.5 px-4 text-[15px] leading-relaxed ${msg.role === 'user' ? 'font-normal tracking-wide' : 'font-light tracking-wide text-zinc-100'}`}>
                            <p className="whitespace-pre-wrap break-words">{msg.text}{isLoading && msg.role === 'model' && index === messages.length - 1 && <BlinkingCursor />}</p>
                        </div>
                        {msg.groundingChunks && msg.groundingChunks.length > 0 && <div className="px-4 pb-3"><GroundingInfo chunks={msg.groundingChunks} /></div>}
                        
                        {msg.role === 'user' && !isLoading && (
                            <button 
                                onClick={() => setEditingMessage({ id: msg.id, text: msg.text })}
                                className="absolute -left-8 bottom-2 p-1.5 rounded-full bg-zinc-800/80 text-zinc-500 opacity-0 group-hover:opacity-100 transition-all hover:text-white"
                            >
                                <Pencil size={12} />
                            </button>
                        )}
                    </>
                )}
            </div>
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-end gap-3 animate-fade-in">
            <div className="pb-1"><SpideyLogo /></div>
            <div className="px-4 py-3 rounded-[1.3rem] rounded-bl-sm bg-zinc-900/60 backdrop-blur-xl border border-white/5">
               <div className="flex space-x-1 h-4 items-center">
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
