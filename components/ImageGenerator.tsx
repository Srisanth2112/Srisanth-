
import React, { useState, useEffect, useRef } from 'react';
import { generateImage, enhancePrompt } from '../services/geminiService';
import { AspectRatio } from '../types';
import { IMAGE_ASPECT_RATIOS, IMAGE_STYLES, IMAGE_STYLE_PREVIEWS } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';
import { Image as ImageIcon, Wand2, Download, X, Sparkles } from 'lucide-react';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(IMAGE_STYLES[0]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!generatedImage) return;

    const img = new window.Image();
    img.src = `data:image/png;base64,${generatedImage}`;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(14, Math.min(img.width * 0.03, img.height * 0.03));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Srisanth AI', canvas.width - 10, canvas.height - 10);

      setWatermarkedImage(canvas.toDataURL('image/png'));
    };
  }, [generatedImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsViewerOpen(false);
        }
    };

    if (isViewerOpen) {
        window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isViewerOpen]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
        const enhanced = await enhancePrompt(prompt);
        setPrompt(enhanced);
    } catch (err) {
        console.error("Failed to enhance prompt", err);
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setWatermarkedImage(null);

    try {
      let finalPrompt = `${style} style, ${prompt}`;
      if (style === 'Thumbnail') {
        finalPrompt = `Vibrant, high-contrast, eye-catching YouTube thumbnail style, professional, clean design, ${prompt}`;
      }
      const imageBytes = await generateImage(finalPrompt, aspectRatio);
      setGeneratedImage(imageBytes);
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-full p-4 pb-32 flex flex-col items-center">
      {isViewerOpen && watermarkedImage && (
        <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsViewerOpen(false)}
        >
            <img 
                src={watermarkedImage} 
                alt="Generated Fullscreen" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-black animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            />
            <button 
                className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition-all active:scale-90"
                onClick={() => setIsViewerOpen(false)}
            >
                <X size={24} />
            </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      
      <div className="w-full max-w-3xl flex flex-col gap-6 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 mb-2 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
                Create
            </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Prompt Input */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2rem] opacity-10 group-focus-within:opacity-40 transition-opacity blur-md"></div>
            <div className="relative bg-zinc-900/80 backdrop-blur-2xl rounded-[2rem] ring-1 ring-white/10 overflow-hidden">
                <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Imagine something..."
                className="w-full p-5 pb-14 bg-transparent text-white placeholder-zinc-600 resize-none focus:outline-none text-lg leading-relaxed min-h-[120px]"
                disabled={isLoading || isEnhancing}
                />
                <div className="absolute bottom-3 right-3 left-3 flex justify-end">
                    <button
                        type="button"
                        onClick={handleEnhancePrompt}
                        disabled={!prompt.trim() || isEnhancing || isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-blue-400 text-xs font-medium transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 backdrop-blur-md"
                    >
                        {isEnhancing ? <LoadingSpinner className="w-3 h-3" /> : <Wand2 size={14} />}
                        <span>Enhance</span>
                    </button>
                </div>
            </div>
          </div>
          
          {/* Style Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Style</label>
                <span className="text-[10px] text-zinc-500 font-medium bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{style}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {IMAGE_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`relative group aspect-square rounded-2xl overflow-hidden transition-all duration-200 ease-out active:scale-90
                    ${ style === s 
                        ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-black' 
                        : 'ring-1 ring-white/10 opacity-80 hover:opacity-100' }`}
                >
                  <img src={IMAGE_STYLE_PREVIEWS[s]} alt={s} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent ${style === s ? 'opacity-100' : 'opacity-60'}`}></div>
                  <div className="absolute bottom-1 left-0 right-0 p-1 text-center">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider block truncate">{s}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Format</label>
            <div className="flex flex-wrap gap-2">
              {IMAGE_ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  type="button"
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`flex-1 min-w-[80px] py-2.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 border ${
                    aspectRatio === ratio.value
                      ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                      : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:bg-zinc-800 hover:text-zinc-300'
                  }`}
                >
                  {ratio.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full relative overflow-hidden group py-4 px-6 bg-white text-black font-bold rounded-[1.5rem] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-300/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative flex items-center justify-center gap-2 text-lg">
                {isLoading ? <LoadingSpinner className="w-6 h-6 border-zinc-400 border-t-black" /> : <><Sparkles size={20} className="fill-current" /> Generate</>}
            </span>
          </button>
        </form>

        {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-2xl text-center backdrop-blur-md">
                <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
        )}
        
        {/* Output Area */}
        <div className="mt-4 w-full min-h-[300px] relative">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-center animate-pulse">
                    <div className="w-20 h-20 mb-6 relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
                        <LoadingSpinner className="w-16 h-16 relative z-10" />
                    </div>
                    <p className="text-zinc-300 font-medium text-lg tracking-tight">Dreaming...</p>
                </div>
            ) : watermarkedImage ? (
                <div className="relative group animate-fade-in-up">
                    <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[1.8rem] opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-500"></div>
                    <button 
                        onClick={() => setIsViewerOpen(true)} 
                        className="relative w-full rounded-[1.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 transition-transform active:scale-[0.99]"
                    >
                        <img src={watermarkedImage} alt="Generated" className="w-full h-auto object-cover" />
                    </button>
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <a
                            href={watermarkedImage}
                            download="srisanth-ai-art.png"
                            className="bg-black/60 backdrop-blur-xl border border-white/10 text-white p-2.5 rounded-full hover:bg-black/80 active:scale-90 shadow-lg"
                            title="Download"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download size={18} />
                        </a>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]">
                    <div className="p-4 rounded-full bg-white/5 mb-4">
                        <ImageIcon size={28} className="text-zinc-600" />
                    </div>
                    <p className="text-zinc-600 font-medium text-sm">Art appears here</p>
                </div>
            )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
