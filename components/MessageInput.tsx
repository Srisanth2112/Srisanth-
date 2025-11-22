
import React, { useState, useEffect, useCallback } from 'react';
import { Send, Paperclip, X, MapPin, Search } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { analyzeQueryForTools } from '../services/geminiService';

interface MessageInputProps {
  onSendMessage: (
    message: string,
    image: { data: string; mimeType: string } | null,
    useSearch: boolean,
    useMaps: boolean,
    location?: { latitude: number, longitude: number }
  ) => void;
  isLoading: boolean;
}

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ data: string; mimeType: string; } | null>(null);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [toolSuggestions, setToolSuggestions] = useState({ search: false, maps: false });

  const { data: location } = useGeolocation();
  
  const analyzeQuery = useCallback(
    debounce(async (query: string) => {
      const suggestions = await analyzeQueryForTools(query);
      setToolSuggestions({ search: suggestions.useSearch, maps: suggestions.useMaps });
    }, 500),
    []
  );

  useEffect(() => {
    analyzeQuery(input);
  }, [input, analyzeQuery]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64Data = reader.result as string;
          setImage({ data: base64Data, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || (!input.trim() && !image)) return;
    
    onSendMessage(input, image, useSearch, useMaps, location ?? undefined);

    setInput('');
    removeImage();
    setUseSearch(false);
    setUseMaps(false);
    setToolSuggestions({ search: false, maps: false });
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <form onSubmit={handleSubmit} className="relative group">
        {image && (
          <div className="absolute bottom-full mb-2 left-0 bg-black/80 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-2xl animate-fade-in-up z-50">
            <img src={image.data} alt="Preview" className="h-20 w-20 object-cover rounded-xl" />
            <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1.5 shadow-lg border border-black hover:bg-zinc-700 transition-colors active:scale-90">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center bg-zinc-900/60 backdrop-blur-2xl rounded-[2rem] p-1.5 pl-2 shadow-2xl border border-white/10 transition-all duration-300 focus-within:bg-black/80 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-blue-500/20">
          <label htmlFor="file-upload" className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full cursor-pointer transition-all active:scale-90">
              <Paperclip size={20} />
          </label>
          <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-grow bg-transparent focus:outline-none px-3 py-3 text-white placeholder-zinc-600 text-[16px]" // 16px prevents zoom on iOS
            disabled={isLoading}
          />
          
          <div className="flex items-center gap-1.5 pr-1">
            {(toolSuggestions.search || useSearch) && (
              <button type="button" onClick={() => setUseSearch(!useSearch)} className={`p-2 rounded-full transition-all active:scale-90 animate-fade-in ${useSearch ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                <Search size={16} />
              </button>
            )}
            {(toolSuggestions.maps || useMaps) && (
              <button type="button" onClick={() => setUseMaps(!useMaps)} className={`p-2 rounded-full transition-all active:scale-90 animate-fade-in ${useMaps ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                <MapPin size={16} />
              </button>
            )}
            <button 
                type="submit" 
                disabled={isLoading || (!input.trim() && !image)} 
                className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${(!input.trim() && !image) ? 'bg-white/5 text-zinc-600' : 'bg-white text-black hover:scale-105 active:scale-90 shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`}
            >
              <Send size={18} className={isLoading ? 'animate-pulse' : 'ml-0.5'} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
