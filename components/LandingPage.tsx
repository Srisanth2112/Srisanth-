
import React from 'react';
import { Code, Feather, Compass, BookOpen } from 'lucide-react';
import { useTypingEffect } from '../hooks/useTypingEffect';

interface LandingPageProps {
  onSuggestionClick: (prompt: string) => void;
}

const suggestions = [
  {
    icon: Feather,
    title: 'Write a note',
    prompt: 'Write a professional thank-you note to a recruiter after a job interview.',
    color: 'bg-orange-500/10 text-orange-400',
  },
  {
    icon: Code,
    title: 'Explain code',
    prompt: 'Explain this Python code snippet: `print([i for i in range(10) if i % 2 == 0])`',
    color: 'bg-blue-500/10 text-blue-400',
  },
  {
    icon: Compass,
    title: 'Plan a trip',
    prompt: 'I want to plan a 3-day trip to New York City. Can you suggest an itinerary?',
    color: 'bg-green-500/10 text-green-400',
  },
  {
    icon: BookOpen,
    title: 'Summarize',
    prompt: 'Summarize the main causes of World War I in a few paragraphs.',
    color: 'bg-purple-500/10 text-purple-400',
  },
];


export const LandingPage: React.FC<LandingPageProps> = ({ onSuggestionClick }) => {
  const { displayText, isFinished } = useTypingEffect(
    "Hello,\nI'm SrisanthAi.", 
    1500
  );
  
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto justify-center p-6 space-y-10">
        <div className="space-y-4 px-2 mt-10">
            <div style={{minHeight: '100px'}}>
                <h1 className="text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-600 leading-tight whitespace-pre-wrap">
                    {displayText}
                    {!isFinished && <span className="inline-block w-3 h-12 ml-2 bg-blue-500 rounded-full animate-pulse align-middle"></span>}
                </h1>
            </div>
            <div className={`transition-all duration-1000 delay-500 transform ${isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-zinc-500 text-base font-medium tracking-wide">Created by K.G.Srisanth</p>
            </div>
        </div>
      
        <div className={`grid grid-cols-2 gap-3 w-full transition-all duration-1000 delay-700 ${isFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {suggestions.map((item, index) => (
            <button
                key={index}
                onClick={() => onSuggestionClick(item.prompt)}
                className="group bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-5 rounded-[1.8rem] relative text-left hover:bg-zinc-800/60 transition-all duration-300 active:scale-95 shadow-lg"
            >
                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon size={20} />
                </div>
                <p className="text-zinc-200 font-semibold text-sm tracking-wide">{item.title}</p>
            </button>
            ))}
        </div>
    </div>
  );
};
