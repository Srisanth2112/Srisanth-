
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAiBlob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { MODELS } from '../constants';
import { Power } from 'lucide-react';

enum ConnectionState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  ERROR,
}

const SiriAppleBorder: React.FC<{ isListening: boolean, isSpeaking: boolean }> = ({ isListening, isSpeaking }) => {
    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Glowing Apple Intelligence Border Effect */}
            <div className={`absolute inset-[-20px] rounded-full opacity-0 transition-opacity duration-700 ${isListening || isSpeaking ? 'opacity-100' : ''}`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-2xl animate-spin-slow opacity-60"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-teal-500 to-indigo-500 blur-xl animate-spin-reverse-slow opacity-60 mix-blend-overlay"></div>
            </div>

            {/* Core Circle */}
            <div className="relative w-full h-full bg-[#1c1c1e] rounded-full flex items-center justify-center z-10 shadow-2xl overflow-hidden">
                 {/* Inner glow when active */}
                {(isListening || isSpeaking) && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse-slow"></div>
                )}
            </div>
             
             {/* Active Waves (Simulated) */}
            {isSpeaking && (
                 <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="w-32 h-32 bg-white/10 rounded-full animate-ping-slow"></div>
                 </div>
            )}

            <style>{`
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes spin-reverse-slow {
                    0% { transform: rotate(360deg); }
                    100% { transform: rotate(0deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                .animate-spin-reverse-slow {
                    animation: spin-reverse-slow 10s linear infinite;
                }
                @keyframes pulse-slow {
                     0%, 100% { opacity: 0.5; }
                     50% { opacity: 1; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
                .animate-ping-slow {
                    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
};


export const VoiceAssistant: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // FIX: The 'LiveSession' type is not exported from the '@google/genai' package.
  // It has been removed from the import and replaced with 'any' here to fix the compilation error.
  const sessionRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const [statusText, setStatusText] = useState("Tap to start conversation");

  useEffect(() => {
    let text = "";
    switch(connectionState) {
        case ConnectionState.CONNECTED:
            if (isSpeaking) text = "Assistant is speaking...";
            else if (isListening) text = "Listening...";
            else text = "Connected";
            break;
        case ConnectionState.CONNECTING:
            text = "Connecting...";
            break;
        case ConnectionState.ERROR:
            text = "Connection Error. Tap to reconnect.";
            break;
        case ConnectionState.DISCONNECTED:
        default:
            text = "Tap to start conversation";
            break;
    }
    setStatusText(text);
  }, [connectionState, isListening, isSpeaking]);


  const connect = async () => {
    setConnectionState(ConnectionState.CONNECTING);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: MODELS.live,
        callbacks: {
          onopen: () => {
            console.log('Connection opened.');
            setConnectionState(ConnectionState.CONNECTED);
            setIsListening(true);
            startMicrophone();
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              await playAudio(base64Audio);
              setIsSpeaking(false);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Connection error:', e);
            setConnectionState(ConnectionState.ERROR);
            disconnect();
          },
          onclose: (e: CloseEvent) => {
            console.log('Connection closed.');
            disconnect();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
      });
      sessionRef.current = sessionPromise;
    } catch (error) {
      console.error('Failed to start voice session:', error);
      setConnectionState(ConnectionState.ERROR);
    }
  };

  const startMicrophone = () => {
    if (!mediaStreamRef.current) return;
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    audioContextRef.current = inputAudioContext;
    
    const source = inputAudioContext.createMediaStreamSource(mediaStreamRef.current);
    mediaStreamSourceRef.current = source;
    
    const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
    scriptProcessorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob: GenAiBlob = {
        data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
        mimeType: 'audio/pcm;rate=16000',
      };
      sessionRef.current?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };
    source.connect(processor);
    processor.connect(inputAudioContext.destination);
  };
  
  const playAudio = async (base64String: string) => {
    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = outputAudioContextRef.current;
    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
    const audioBuffer = await decodeAudioData(decode(base64String), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
  };

  const disconnect = () => {
    sessionRef.current?.then(session => session.close());
    sessionRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    audioContextRef.current?.close();

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    setConnectionState(ConnectionState.DISCONNECTED);
    setIsListening(false);
    setIsSpeaking(false);
  };
  
  useEffect(() => {
    return () => {
      if (connectionState !== ConnectionState.DISCONNECTED) {
        disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleConnection = () => {
    if (connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR) {
      connect();
    } else {
      disconnect();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 relative overflow-hidden">
      <div className="relative z-10">
        <button
          onClick={handleToggleConnection}
          className="relative rounded-full flex items-center justify-center text-white transition-transform active:scale-95 focus:outline-none"
        >
          <SiriAppleBorder isListening={isListening} isSpeaking={isSpeaking} />
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            {connectionState === ConnectionState.DISCONNECTED && <Power size={32} className="text-zinc-400" />}
          </div>
        </button>
      </div>
      
      <div className="mt-12 text-lg font-medium text-zinc-300 h-8 tracking-wide z-10">
        <div
            key={statusText}
            className="animate-fade-in-up"
        >
          {statusText}
        </div>
      </div>
       {connectionState === ConnectionState.DISCONNECTED && (
          <p className="mt-2 text-xs text-zinc-600 z-10">Requires microphone permission</p>
      )}
       
       <style>{`
        @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
