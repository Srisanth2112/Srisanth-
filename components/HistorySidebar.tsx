
import React, { useState, useMemo } from 'react';
import { ChatSession } from '../types';
import { Plus, Search, Trash2, MessageSquare } from 'lucide-react';

interface HistorySidebarProps {
  history: ChatSession[];
  activeChatId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  activeChatId,
  isOpen,
  onClose,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    return history.filter(chat =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.messages.some(msg => msg.text.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [history, searchTerm]);

  return (
    <>
      <div
        className={`fixed md:static inset-y-0 left-0 z-[100] w-72 bg-[#0a0a0a]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col p-4 space-y-4 flex-shrink-0 transition-transform duration-300 cubic-bezier(0.32, 0.72, 0, 1)
        ${isOpen ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-2 pt-safe-top">
             <h2 className="text-lg font-bold text-white tracking-tight">History</h2>
             <button onClick={onNewChat} className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition-all text-white shadow-sm">
                <Plus size={18} />
             </button>
        </div>

        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-[1rem] pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:bg-zinc-800 focus:border-white/10 transition-all"
          />
        </div>
        
        <div className="flex-grow overflow-y-auto pr-1 no-scrollbar">
          <div className="space-y-1">
            {filteredHistory.map((chat) => (
                <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group flex justify-between items-center p-3 rounded-[1rem] cursor-pointer transition-all duration-200 active:scale-95
                    ${activeChatId === chat.id 
                        ? 'bg-white/10 text-white shadow-sm backdrop-blur-sm' 
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                >
                <div className="flex items-center overflow-hidden">
                    <MessageSquare size={16} className={`mr-3 flex-shrink-0 ${activeChatId === chat.id ? 'text-blue-400' : 'text-zinc-600'}`}/>
                    <span className="truncate text-xs font-medium tracking-wide">{chat.title}</span>
                </div>
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                    }}
                    className="ml-2 p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                    <Trash2 size={12} />
                </button>
                </div>
            ))}
          </div>
        </div>
      </div>
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden transition-opacity duration-500"></div>}
      <style>{`
        .pt-safe-top {
            padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </>
  );
};
