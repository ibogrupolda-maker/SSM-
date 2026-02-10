
import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Phone, Video, Send, User, PhoneOff, VideoOff, Timer, History, Play, Clock, Truck, Building2, ShieldCheck } from 'lucide-react';
import { EmergencyCase, Employee } from '../types';
import { COMPANIES } from '../constants';

type CommunicationType = 'chat' | 'call_started' | 'call_ended';
type RecipientType = 'CLIENTE' | 'AMBULANCIA';

interface CommEvent {
  id: string;
  type: CommunicationType;
  sender: string;
  avatar?: string;
  text?: string;
  time: string;
  isMe: boolean;
  callType?: 'voz' | 'video';
  duration?: string;
  channel: RecipientType;
}

interface EmergencyCommunicationProps {
  isOpen: boolean;
  onClose: () => void;
  incident: EmergencyCase;
  employee?: Employee;
}

const EmergencyCommunication: React.FC<EmergencyCommunicationProps> = ({ isOpen, onClose, incident, employee }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'voz' | 'video' | 'historico'>('chat');
  const [activeChannel, setActiveChannel] = useState<RecipientType>('CLIENTE');
  const [inputValue, setInputValue] = useState('');
  
  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [events, setEvents] = useState<CommEvent[]>([
    {
      id: '1',
      type: 'chat',
      sender: 'Gestor Absa',
      text: 'O colaborador está na entrada principal da torre.',
      time: '11:46',
      isMe: false,
      channel: 'CLIENTE'
    },
    {
      id: '2',
      type: 'chat',
      sender: 'Operador (Eu)',
      text: 'Recebido. A unidade Alpha-1 já está em trânsito.',
      time: '11:48',
      isMe: true,
      channel: 'CLIENTE'
    },
    {
      id: '3',
      type: 'chat',
      sender: 'Paramédico João',
      text: 'Encontramos trânsito na Av. 24 de Julho. ETA revisto para 5 min.',
      time: '11:50',
      isMe: false,
      channel: 'AMBULANCIA'
    }
  ]);

  useEffect(() => {
    if (isCallActive) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newEvent: CommEvent = {
      id: Date.now().toString(),
      type: 'chat',
      sender: 'Operador (Eu)',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      channel: activeChannel
    };
    setEvents([...events, newEvent]);
    setInputValue('');
  };

  const startCall = (type: 'voz' | 'video') => {
    setIsCallActive(true);
    const startEvent: CommEvent = {
      id: `start-${Date.now()}`,
      type: 'call_started',
      sender: 'Operador (Eu)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      callType: type,
      channel: activeChannel
    };
    setEvents(prev => [...prev, startEvent]);
  };

  const endCall = () => {
    const duration = formatDuration(elapsedSeconds);
    const endEvent: CommEvent = {
      id: `end-${Date.now()}`,
      type: 'call_ended',
      sender: 'Operador (Eu)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      callType: activeTab === 'voz' ? 'voz' : 'video',
      duration: duration,
      channel: activeChannel
    };
    setEvents(prev => [...prev, endEvent]);
    setIsCallActive(false);
  };

  const filteredEvents = events.filter(e => e.channel === activeChannel);
  const company = COMPANIES.find(c => c.id === incident.companyId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        
        {/* Header - Gestão de Canais */}
        <div className="bg-slate-900 p-6 flex flex-col gap-6 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-corporate uppercase tracking-tight leading-none">Canal de Governação Central</h2>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1.5">Administração ↔ Rede SSM</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"><X className="w-6 h-6" /></button>
          </div>

          <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/10">
            <button 
              onClick={() => { setActiveChannel('CLIENTE'); setIsCallActive(false); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeChannel === 'CLIENTE' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              <Building2 className="w-3.5 h-3.5" /> Falar com Cliente
            </button>
            <button 
              onClick={() => { setActiveChannel('AMBULANCIA'); setIsCallActive(false); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeChannel === 'AMBULANCIA' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              <Truck className="w-3.5 h-3.5" /> Falar com Ambulância
            </button>
          </div>
        </div>

        {/* Info Banner do Canal Selecionado */}
        <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-blue-100">
                {activeChannel === 'CLIENTE' ? <img src={company?.logo} className="w-6 h-6 rounded-full" /> : <Truck className="w-4 h-4 text-blue-600" />}
             </div>
             <div>
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">Destinatário</p>
                <p className="text-xs font-black text-blue-900 uppercase">{activeChannel === 'CLIENTE' ? company?.name : 'Unidade Alpha-1 (João C.)'}</p>
             </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Canal Seguro
          </div>
        </div>

        {/* Tabs de Tipo de Mídia */}
        <div className="flex border-b border-slate-100 bg-white">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'voz', label: 'Voz', icon: Phone },
            { id: 'video', label: 'Vídeo', icon: Video },
            { id: 'historico', label: 'Log', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-black uppercase text-[9px] tracking-widest transition-all border-b-4 ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[350px] max-h-[450px] bg-[#FAFBFE] custom-scrollbar">
          {activeTab === 'chat' ? (
            filteredEvents.map(event => (
              <div key={event.id} className={`flex gap-3 ${event.isMe ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2`}>
                <div className={`flex flex-col max-w-[80%] ${event.isMe ? 'items-end' : 'items-start'}`}>
                  {!event.isMe && <span className="text-[10px] font-black text-slate-900 mb-1 ml-1">{event.sender}</span>}
                  <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${event.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                    {event.text}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 px-1 uppercase">{event.time}</span>
                </div>
              </div>
            ))
          ) : activeTab === 'historico' ? (
            <div className="space-y-4">
              {events.map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${log.channel === 'CLIENTE' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                         {log.channel === 'CLIENTE' ? <Building2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase">Ação para {log.channel}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{log.time} • Auditoria SSM</p>
                      </div>
                   </div>
                   <span className="text-[9px] font-black text-slate-300">INTEGRITY_OK</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
               {isCallActive ? (
                 <div className="flex flex-col items-center gap-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-2xl relative z-10 border border-slate-100">
                        {activeTab === 'voz' ? <Phone className="w-10 h-10" /> : <Video className="w-10 h-10" />}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-900 font-mono">{formatDuration(elapsedSeconds)}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Chamada com {activeChannel === 'CLIENTE' ? 'Cliente' : 'Ambulância'}</p>
                    </div>
                    <button onClick={endCall} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl shadow-red-600/20 transition-all active:scale-95">
                      <PhoneOff className="w-4 h-4" /> Encerrar
                    </button>
                 </div>
               ) : (
                 <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                      {activeTab === 'voz' ? <Phone className="w-8 h-8" /> : <Video className="w-8 h-8" />}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                      Iniciar chamada segura com {activeChannel === 'CLIENTE' ? 'a Empresa Cliente' : 'a Unidade Alpha-1'}.
                    </p>
                    <button onClick={() => startCall(activeTab as 'voz' | 'video')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl transition-all active:scale-95">
                      <Play className="w-4 h-4 fill-current" /> Ligar Agora
                    </button>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Input - Apenas para Chat */}
        {activeTab === 'chat' && (
          <div className="p-6 bg-white border-t border-slate-100 flex gap-3 shrink-0">
            <input 
              type="text" 
              placeholder={`Escrever para ${activeChannel === 'CLIENTE' ? 'Cliente' : 'Ambulância'}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
            <button onClick={handleSendMessage} disabled={!inputValue.trim()} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-lg transition-all disabled:opacity-30">
              <Send className="w-4 h-4" /> Enviar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyCommunication;
