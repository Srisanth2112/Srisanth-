
import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { Upload, Sparkles, X } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<{ file: File; preview: string } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalImage({ file, preview: URL.createObjectURL(file) });
      setEditedImage(null);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      base64: await base64EncodedDataPromise,
      mimeType: file.type,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !originalImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const { base64, mimeType } = await fileToGenerativePart(originalImage.file);
      const resultBase64 = await editImage(prompt, base64, mimeType);
      setEditedImage(`data:image/png;base64,${resultBase64}`);
    } catch (err) {
      setError('Failed to edit image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearImage = () => {
    setOriginalImage(null);
    setEditedImage(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center h-full p-6">
      {!originalImage ? (
        <div
          className="w-full max-w-2xl h-80 border border-dashed border-zinc-600 rounded-3xl flex flex-col items-center justify-center text-zinc-400 cursor-pointer bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="bg-zinc-800/50 p-6 rounded-full mb-4">
            <Upload size={40} className="text-zinc-300" />
          </div>
          <p className="text-lg font-medium text-zinc-300">Tap to upload an image</p>
          <p className="text-sm text-zinc-500 mt-2">JPG, PNG supported</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>
      ) : (
        <div className="w-full max-w-5xl space-y-6 bg-white/5 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group">
                <p className="text-center text-xs font-bold uppercase tracking-wider mb-3 text-zinc-500">Original</p>
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/5">
                    <img src={originalImage.preview} alt="Original" className="w-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    <button onClick={clearImage} className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-all active:scale-90 backdrop-blur-sm">
                        <X size={18} />
                    </button>
                </div>
            </div>
            <div className="relative">
                <p className="text-center text-xs font-bold uppercase tracking-wider mb-3 text-zinc-500">Result</p>
                {isLoading ? (
                    <div className="w-full aspect-square bg-black/20 rounded-2xl flex flex-col items-center justify-center border border-white/5 animate-pulse">
                        <LoadingSpinner className="w-10 h-10 mb-2" />
                        <span className="text-zinc-500 text-sm">Processing...</span>
                    </div>
                ) : editedImage ? (
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-white/5 animate-fade-in">
                        <img src={editedImage} alt="Edited" className="w-full object-cover" />
                    </div>
                ) : (
                    <div className="w-full aspect-square bg-black/20 rounded-2xl flex items-center justify-center text-zinc-500 border border-white/5 border-dashed">
                        Magic happens here
                    </div>
                )}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-white/5">
            <div className="relative">
                <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your changes (e.g., add a neon glow)"
                className="w-full p-4 bg-black/30 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all"
                disabled={isLoading}
                />
                <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
            </div>
            <button
              type="submit"
              disabled={isLoading || !prompt.trim() || !originalImage}
              className="w-full flex items-center justify-center py-4 px-6 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <LoadingSpinner /> : <>Apply Magic Edit</>}
            </button>
            {error && <p className="text-center text-red-400 text-sm">{error}</p>}
          </form>
        </div>
      )}
      <style>{`
         @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
