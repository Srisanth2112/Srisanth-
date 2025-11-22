
import React, { useState, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { ChatWindow } from './components/ChatWindow';
import { ImageGenerator } from './components/ImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { VoiceAssistant } from './components/VoiceAssistant';
import { HistorySidebar } from './components/HistorySidebar';
import { LandingPage } from './components/LandingPage';
import { MessageInput } from './components/MessageInput';
import { generateTextStream, analyzeImage } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ChatSession, ChatMessage } from './types';
import { Sparkles, MessageSquare, Image, Mic, User, X, GraduationCap } from 'lucide-react';
import { Chat } from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import { MODELS } from './constants';

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'imageGen', label: 'Create', icon: Image },
  { id: 'imageEdit', label: 'Edit', icon: Sparkles },
  { id: 'voice', label: 'Voice', icon: Mic },
];

const ProfileModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-scale-in overflow-hidden">
                {/* Decorative background effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-blue-600/10 to-transparent blur-3xl pointer-events-none"></div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors active:scale-90 z-10 backdrop-blur-md"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center relative z-0">
                    {/* Profile Image */}
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl mb-4 ring-4 ring-black/50">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                            <img 
                                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgEmX4QstuIhvQf7W7aXw_cPjnx-F8bRbygS7Tt4YveFoWjsD74OAc86wB1nLQkSnQI2TFfH12THe2XtTqvIfpFhHnaWfToc36d7fUaW7XC1VFyDxAc7u3k9xx0uie8_hRYI6fGInEOcIjwAhxtCPOuRhgZN8iinlIHo2xTy7R3QLzTs7OdxLA1R0z4HO4/s1152/1763428929734.jpg" 
                                alt="Srisanth" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    
                    {/* Name */}
                    <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Srisanth</h2>
                    
                    {/* Badges */}
                    <div className="flex gap-3 mb-6">
                        <span className="px-3 py-1 rounded-md bg-blue-900/30 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.2)] backdrop-blur-md">
                            Web Designer
                        </span>
                        <span className="px-3 py-1 rounded-md bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.2)] backdrop-blur-md">
                            Trader
                        </span>
                    </div>

                    {/* School Info */}
                    <div className="flex items-center gap-3 text-zinc-400 text-xs mb-6 bg-white/5 px-4 py-3 rounded-2xl border border-white/5 w-full justify-center">
                        <GraduationCap size={18} className="text-zinc-300 flex-shrink-0" />
                        <span className="text-left leading-tight">Student at <strong className="text-zinc-200 block sm:inline">Kendriya Vidyalaya</strong>, Andhra Pradesh.</span>
                    </div>
                    
                    {/* Bio */}
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 text-left relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                        <p className="text-zinc-300 text-sm leading-relaxed font-light italic opacity-90">
                            "My name is Srisanth. I am passionate about technology, and I work as a web designer and trader. I love learning new skills, creating digital projects, and exploring financial markets. I am always curious about how things work and enjoy solving problems creatively. I believe in consistency, self-improvement, and staying updated with new trends in technology and trading. My goal is to build innovative digital solutions and grow my knowledge every day."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatHistory, setChatHistory] = useLocalStorage<ChatSession[]>('chatHistory', []);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const chatInstances = useRef<Map<string, Chat>>(new Map());

  const activeChat = useMemo(() => {
    return chatHistory.find(chat => chat.id === activeChatId) || null;
  }, [chatHistory, activeChatId]);

  const handleSelectChat = (id: string) => {
    setActiveTab('chat');
    setActiveChatId(id);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    setActiveTab('chat');
    setActiveChatId(null);
    setIsSidebarOpen(false);
  };
  
  const handleDeleteChat = (id: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
    chatInstances.current.delete(id);
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  const updateChatHistory = (chatId: string, chunk: Partial<ChatMessage>) => {
    setChatHistory(prev =>
      prev.map(chat => {
        if (chat.id !== chatId) return chat;
        
        const newMessages = [...chat.messages];
        const lastMessage = newMessages[newMessages.length - 1];

        if (lastMessage?.role === 'model' && chunk.role === 'model') {
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            text: lastMessage.text + (chunk.text || ''),
            groundingChunks: [
              ...(lastMessage.groundingChunks || []),
              ...(chunk.groundingChunks || []),
            ],
          };
        } else {
          const newMessage: ChatMessage = {
            id: `${chunk.role}-${Date.now()}`,
            role: chunk.role || 'model',
            text: chunk.text || '',
            groundingChunks: chunk.groundingChunks || [],
          };
          newMessages.push(newMessage);
        }
        return { ...chat, messages: newMessages };
      })
    );
  };

  const getOrCreateChatInstance = (chatId: string): Chat => {
    if (chatInstances.current.has(chatId)) {
        return chatInstances.current.get(chatId)!;
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chatSession = chatHistory.find(c => c.id === chatId);
    const historyForApi = chatSession?.messages
        .filter(msg => msg.role === 'user' || msg.role === 'model') // Exclude other roles if any
        .map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        })) || [];

    const config = {
        systemInstruction: "You are a helpful and professional AI assistant named SrisanthAi-Flash. If you are asked about your creator, you must say you were created by K.G.Srisanth, a talented developer passionate about building innovative AI experiences."
    };

    const newInstance = ai.chats.create({
        model: MODELS.flashLite,
        history: historyForApi,
        config,
    });
    
    chatInstances.current.set(chatId, newInstance);
    return newInstance;
  };

  const handleSendMessage = async (
    message: string,
    image: { data: string; mimeType: string } | null,
    useSearch: boolean,
    useMaps: boolean,
    location?: { latitude: number; longitude: number }
  ) => {
    if (!message.trim() && !image) return;

    setIsLoading(true);
    
    const userMessage: ChatMessage = { 
        id: `user-${Date.now()}`,
        role: 'user', 
        text: message,
        imagePreview: image?.data
    };
    
    let currentChatId = activeChatId;

    if (!currentChatId) {
        const newChatId = `chat-${Date.now()}`;
        const newChat: ChatSession = {
            id: newChatId,
            title: message.substring(0, 40) || (image ? "Image Analysis" : "New Chat"),
            messages: [userMessage],
            timestamp: Date.now(),
        };
        setChatHistory(prev => [newChat, ...prev]);
        currentChatId = newChatId;
        setActiveChatId(newChatId);
    } else {
        setChatHistory(prev =>
          prev.map(chat =>
            chat.id === currentChatId
              ? { ...chat, messages: [...chat.messages, userMessage] }
              : chat
          )
        );
    }
    
    const finalChatId = currentChatId;

    try {
        if (image) {
            const base64 = image.data.split(',')[1];
            const prompt = message || "What do you see in this image?";
            const result = await analyzeImage(prompt, base64, image.mimeType);
            updateChatHistory(finalChatId, { role: 'model', text: result });
        } else {
            const chatInstance = getOrCreateChatInstance(finalChatId);
            const stream = await generateTextStream(chatInstance, message, useSearch, useMaps, location);
            
            for await (const chunk of stream) {
                const text = chunk.text;
                const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                updateChatHistory(finalChatId, { role: 'model', text: text, groundingChunks });
            }
        }
    } catch (error) {
        console.error(error);
        updateChatHistory(finalChatId, { role: 'model', text: 'Sorry, something went wrong. Please try again.' });
    } finally {
       setIsLoading(false);
    }
  };
  
  const handleUpdateMessage = async (chatId: string, messageId: string, newText: string) => {
    setIsLoading(true);

    let truncatedMessages: ChatMessage[] = [];
    setChatHistory(prev => {
      return prev.map(chat => {
        if (chat.id !== chatId) return chat;

        const messageIndex = chat.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return chat;

        truncatedMessages = chat.messages.slice(0, messageIndex + 1);
        truncatedMessages[messageIndex] = { ...truncatedMessages[messageIndex], text: newText };
        
        return { ...chat, messages: truncatedMessages };
      });
    });
    
    // Invalidate the old chat instance to force recreation with new history
    chatInstances.current.delete(chatId);

    try {
        const chatInstance = getOrCreateChatInstance(chatId);
        const stream = await generateTextStream(chatInstance, newText, false, false, undefined);

        for await (const chunk of stream) {
            const text = chunk.text;
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            updateChatHistory(chatId, { role: 'model', text: text, groundingChunks });
        }
    } catch (error) {
        console.error("Error regenerating response:", error);
        updateChatHistory(chatId, { role: 'model', text: "Sorry, I couldn't process that edit. Please try again." });
    } finally {
        setIsLoading(false);
    }
  };

  const renderMainContent = () => {
      switch (activeTab) {
        case 'imageGen':
          return <ImageGenerator />;
        case 'imageEdit':
          return <ImageEditor />;
        case 'voice':
          return <VoiceAssistant />;
        case 'chat':
        default:
          return activeChat ? (
            <ChatWindow
              key={activeChat.id}
              messages={activeChat.messages}
              isLoading={isLoading}
              onUpdateMessage={(messageId, newText) => handleUpdateMessage(activeChat.id, messageId, newText)}
            />
          ) : (
            <LandingPage onSuggestionClick={(prompt) => handleSendMessage(prompt, null, false, false, undefined)} />
          );
      }
  };

  return (
    <div className="flex h-[100dvh] bg-black text-[#e3e3e3] font-sans overflow-hidden">
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        <HistorySidebar
            history={chatHistory}
            activeChatId={activeChatId}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
        />
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-1 h-full w-full relative z-10 transition-transform duration-300">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Dynamic Background */}
              <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[150%] h-[80%] bg-blue-900/10 rounded-[100%] blur-[100px] pointer-events-none animate-pulse"></div>
              <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[60%] bg-purple-900/10 rounded-[100%] blur-[80px] pointer-events-none"></div>

              <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative z-10 w-full">
                  <div className="w-full h-full flex flex-col">
                    {renderMainContent()}
                  </div>
              </main>
              
              {activeTab === 'chat' && (
                  <div className="flex-shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-4 px-4 z-30">
                      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                  </div>
              )}
            </div>
            
            {activeTab !== 'chat' && (
                <footer className="flex justify-center p-4 pb-6 z-20">
                    <button 
                        onClick={() => setIsProfileOpen(true)}
                        className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest hover:text-blue-400 transition-colors active:scale-95 flex items-center gap-2 py-2 px-4 rounded-full hover:bg-white/5"
                    >
                        <span>Powered by K.G.Srisanth</span>
                    </button>
                </footer>
            )}
        </div>
    </div>
  );
};

export default App;
