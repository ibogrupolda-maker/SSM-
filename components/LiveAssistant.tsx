
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, Waves, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encodePCM = (data: Float32Array): string => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const startSession = async () => {
    setStatus('connecting');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (!isListening) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBase64 = encodePCM(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ 
                media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' } 
              }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const decoded = decodeBase64(audioData);
              const buffer = await decodeAudioData(decoded, outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (msg.serverContent?.outputTranscription) {
              setTranscript(prev => prev + ' ' + msg.serverContent?.outputTranscription?.text);
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            setStatus('error');
          },
          onclose: () => {
            setStatus('idle');
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });

      sessionRef.current = await sessionPromise;
      setIsListening(true);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const endSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    setStatus('idle');
    setIsActive(false);
    setIsListening(false);
    setTranscript('');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-950 to-indigo-950/20">
      <div className="relative mb-12">
        <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${
          isActive ? 'bg-indigo-600 shadow-[0_0_80px_rgba(79,70,229,0.4)] scale-110' : 'bg-white/5 border border-white/10'
        }`}>
          {isActive ? (
            <div className="flex gap-1.5 items-end h-12">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s`, height: `${30 + Math.random() * 70}%` }}></div>
              ))}
            </div>
          ) : (
            <Mic size={64} className="text-gray-700" />
          )}
        </div>
        {isActive && (
          <div className="absolute -inset-8 border-2 border-indigo-500/20 rounded-full animate-ping pointer-events-none"></div>
        )}
      </div>

      <div className="text-center space-y-4 max-w-xl">
        <h2 className="text-3xl font-bold text-white">
          {status === 'idle' && 'Voice Interaction'}
          {status === 'connecting' && 'Opening Portal...'}
          {status === 'connected' && 'Aura is Listening'}
          {status === 'error' && 'Connection Failed'}
        </h2>
        <p className="text-gray-400">
          Experience zero-latency, human-like conversations. Powered by Gemini Flash Native Audio.
        </p>
      </div>

      {transcript && (
        <div className="mt-8 glass rounded-2xl p-4 max-w-2xl w-full border-l-4 border-indigo-500 animate-in slide-in-from-bottom-4 duration-500">
          <p className="text-sm text-gray-300 italic">"{transcript.trim()}"</p>
        </div>
      )}

      <div className="fixed bottom-12 flex gap-4">
        {status === 'idle' || status === 'error' ? (
          <button 
            onClick={startSession}
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105"
          >
            <Mic size={24} />
            Connect to Aura
          </button>
        ) : (
          <>
            <button 
              onClick={() => setIsListening(!isListening)}
              className={`p-5 rounded-full shadow-2xl transition-all hover:scale-110 ${isListening ? 'bg-white/10 text-white' : 'bg-red-500 text-white'}`}
            >
              {isListening ? <Mic size={28} /> : <MicOff size={28} />}
            </button>
            <button 
              onClick={endSession}
              className="bg-red-600 hover:bg-red-500 text-white p-5 rounded-full shadow-2xl transition-all hover:scale-110"
            >
              <PhoneOff size={28} />
            </button>
          </>
        )}
      </div>

      {status === 'error' && (
        <div className="mt-8 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-xl border border-red-400/20">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">Please verify your API Key and Microphone access.</span>
        </div>
      )}
    </div>
  );
};

export default LiveAssistant;
