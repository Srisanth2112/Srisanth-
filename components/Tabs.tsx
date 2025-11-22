
import React from 'react';
import { LucideProps } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex-shrink-0 px-4 pb-2 pt-2 z-40">
      <nav className="flex justify-center p-1.5 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/5 max-w-fit mx-auto shadow-2xl shadow-black/50 overflow-x-auto no-scrollbar">
        <div className="flex space-x-1">
            {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                    relative flex items-center py-2.5 px-5 rounded-[1.5rem] font-semibold text-xs tracking-wide transition-all duration-300 ease-out active:scale-95 whitespace-nowrap
                    ${isActive ? 'text-white shadow-lg shadow-black/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}
                `}
                >
                {isActive && (
                    <div className="absolute inset-0 bg-zinc-800/80 rounded-[1.5rem] -z-10 animate-scale-in"></div>
                )}
                <tab.icon className={`mr-2 h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110 text-blue-400' : 'group-hover:scale-110'}`} />
                <span>{tab.label}</span>
                </button>
            );
            })}
        </div>
      </nav>
      <style>{`
        @keyframes scale-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
            animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
