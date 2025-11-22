
import React from 'react';
import { User, Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-50 py-3 px-4 flex-shrink-0 backdrop-blur-2xl bg-black/40 border-b border-white/5">
      <div className="container mx-auto flex items-center justify-between max-w-5xl">
        <div className="flex items-center gap-4">
            <button 
                onClick={onMenuClick} 
                className="md:hidden p-2.5 -ml-2 text-zinc-300 hover:text-white transition-all active:scale-90 rounded-full hover:bg-white/10"
            >
                <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400 drop-shadow-sm">
                SrisanthAi<span className="font-light opacity-70">-Flash</span>
            </h1>
        </div>
        <div className="w-8 h-8 bg-gradient-to-tr from-white/10 to-white/5 rounded-full flex items-center justify-center shadow-inner border border-white/10">
            <User className="w-4 h-4 text-zinc-300" />
        </div>
      </div>
    </header>
  );
};
