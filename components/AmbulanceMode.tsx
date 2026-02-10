
import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, CheckCircle, XCircle, MapPin, 
  Activity, Battery, BatteryCharging, Signal, 
  Navigation, LogOut,
  Bell, MessageSquare, Phone, Send, X, PhoneOff, Timer,
  Clock, Map as MapIcon, Flag, Hospital, ClipboardList, AlertTriangle, User, ChevronRight,
  Shield, Wifi, WifiOff, Lock, Users
} from 'lucide-react';
import { EmergencyCase, AmbulanceState, OperationReport } from '../types';
import { COMPANIES } from '../constants';
import L from 'leaflet';
import { auditLogger } from '../services/auditLogger';

interface AmbulanceModeProps {
  onLogout: () => void;
  adminName: string;
  incident: EmergencyCase | null;
  onUpdateAmbulance: (id: string, updates: Partial<AmbulanceState> | null, finalReport?: OperationReport) => void;
  onUpdateStatus: (id: string, status: 'active' | 'triage' | 'transit' | 'closed') => void;
}

const AmbulanceMode: React.FC<AmbulanceModeProps> = ({ 
  onLogout, 
  adminName, 
  incident,
  onUpdateAmbulance,
  onUpdateStatus
}) => {
  const [battery] = useState(85);
  const [isOffline, setIsOffline] = useState(false);
  const [isCommOpen, setIsCommOpen] = useState(false);
  const [messages, setMessages] = useState<{id: string, text: string, sender: string, time: string, isMe: boolean}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [consciousness, setConsciousness] = useState<'Consciente' | 'Inconsciente'>('Consciente');
  const [worsened, setWorsened] = useState(false);
  const [observations, setObservations] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);

  const hospitalCoords: [number, number] = [-25.975, 32.585];
  const hospitalName = "Hospital Central de Maputo";

  useEffect(() => {
    const interval = setInterval(() => {
      const drop = Math.random() > 0.8;
      if (drop) {
        setIsOffline(true);
        setTimeout(() => setIsOffline(false), 3000);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([-25.9692, 32.5732], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (incident && incident.ambulanceState && mapRef.current) {
      const { currentPos, phase } = incident.ambulanceState;
      const target = phase === 'evacuating' ? hospitalCoords : incident.coords;

      if (!ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current = L.marker(currentPos, {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="bg-blue-600 p-2 rounded-full border-2 border-white text-white shadow-xl"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/></svg></div>`,
            iconSize: [32, 32], iconAnchor: [16, 16]
          })
        }).addTo(mapRef.current);
      } else {
        ambulanceMarkerRef.current.setLatLng(currentPos);
      }

      if (phase !== 'idle') {
        if (targetMarkerRef.current) targetMarkerRef.current.remove();
        const company = COMPANIES.find(c => c.id === incident.companyId);
        targetMarkerRef.current = L.marker(target, {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="bg-red-600 p-1 rounded-full border-2 border-white text-white">${phase === 'evacuating' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M10 9h4"/></svg>' : (company ? `<img src="${company.logo}" class="w-8 h-8 rounded-full" />` : '<Activity class="w-6 h-6" />')}</div>`,
            iconSize: [40, 40], iconAnchor: [20, 20]
          })
        }).addTo(mapRef.current);

        if (routeRef.current) routeRef.current.remove();
        routeRef.current = L.polyline([currentPos, target], { color: '#2563eb', weight: 6, opacity: 0.8 }).addTo(mapRef.current);
        
        const bounds = L.latLngBounds([currentPos, target]);
        mapRef.current.fitBounds(bounds, { padding: [80, 80] });
      }
    }
  }, [incident]);

  const handleAccept = () => {
    if (incident) {
      onUpdateAmbulance(incident.id, { phase: 'en_route_to_patient' });
      auditLogger.log({id: 'AMB-FIELD', name: adminName, role: 'AMBULANCIA'}, 'MISSION_ACCEPTED_FIELD', incident.id);
    }
  };

  const handleStartEvacuation = () => {
    if (incident) {
       onUpdateAmbulance(incident.id, { phase: 'evacuating', eta: 8, distance: 2.4 });
       onUpdateStatus(incident.id, 'transit');
    }
  };

  const calculateOperationDuration = (startStr: string, endStr: string) => {
    const parseTime = (s: string) => {
      const [h, m, sec] = s.split(':').map(Number);
      return h * 3600 + m * 60 + (sec || 0);
    };
    const diff = parseTime(endStr) - parseTime(startStr);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}m ${s}s`;
  };

  const handleFinishMission = () => {
    if (!incident || !incident.ambulanceState?.timestamps) return;

    const ts = incident.ambulanceState.timestamps;
    const report: OperationReport = {
      hospitalName: hospitalName,
      timeToBaseToPatient: calculateOperationDuration(ts.dispatched, ts.arrivedAtPatient!),
      timeToPatientToHospital: calculateOperationDuration(ts.leftForHospital!, ts.arrivedAtHospital!),
      totalOperationTime: calculateOperationDuration(ts.dispatched, ts.arrivedAtHospital!),
      consciousnessState: consciousness,
      conditionWorsened: worsened,
      paramedicName: adminName,
      finalObservations: observations || "Atendimento realizado sem intercorrências graves no transporte.",
      timestamps: {
        dispatched: ts.dispatched,
        arrivedAtPatient: ts.arrivedAtPatient!,
        leftForHospital: ts.leftForHospital!,
        arrivedAtHospital: ts.arrivedAtHospital!
      }
    };

    onUpdateAmbulance(incident.id, null, report);
    setShowFinalReport(false);
    auditLogger.log({id: 'AMB-FIELD', name: adminName, role: 'AMBULANCIA'}, 'MISSION_FINALIZED_WITH_REPORT', incident.id);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: newMessage, sender: adminName, time: 'Agora', isMe: true }]);
    setNewMessage('');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden font-sans text-white">
      <header className="h-16 bg-slate-950 border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg text-white shadow-lg"><Truck className="w-5 h-5" /></div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest font-corporate leading-none flex items-center gap-2">
              Terminal Operativo <Lock className="w-3 h-3 text-emerald-500" />
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{adminName} • UNIDADE ALPHA-1</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isOffline ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-emerald-500" />}
            <span className="text-[10px] font-black">{isOffline ? 'OFFLINE' : 'ONLINE'}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <Battery className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black">{Math.round(battery)}%</span>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-500 hover:text-white transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 grayscale-[0.8]" />
        
        {/* COMUNICAÇÃO - Restrita à Administração */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
          <button onClick={() => { setIsCommOpen(true); }} className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/20 hover:scale-105 transition-all"><MessageSquare className="w-6 h-6" /></button>
          <button onClick={() => { setIsCommOpen(true); }} className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/20 hover:scale-105 transition-all"><Phone className="w-6 h-6" /></button>
        </div>

        {/* ALERTA NOVA SOLICITAÇÃO */}
        {incident && incident.ambulanceState?.phase === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-40 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col items-center text-center text-slate-900 border-t-[12px] border-red-600">
              <div className="w-24 h-24 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-8 animate-bounce shadow-inner"><Bell className="w-12 h-12" /></div>
              <h2 className="text-3xl font-black font-corporate uppercase tracking-tight">Missão Crítica</h2>
              <div className="bg-slate-50 w-full p-6 rounded-3xl border border-slate-100 my-8 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entidade</p>
                <p className="text-xl font-black leading-none mb-5 text-red-700">{COMPANIES.find(c => c.id === incident.companyId)?.name}</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200"><MapPin className="w-4 h-4 text-slate-400" /></div>
                  <p className="text-sm font-black text-slate-700">{incident.locationName}</p>
                </div>
              </div>
              <button onClick={handleAccept} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                <CheckCircle className="w-6 h-6" /> ACEITAR MISSÃO
              </button>
            </div>
          </div>
        )}

        {/* CONTROLES DURANTE MISSÃO */}
        {incident && incident.ambulanceState && incident.ambulanceState.phase !== 'idle' && (
          <div className="absolute bottom-6 left-6 right-6 z-10 animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-slate-950 rounded-[2.5rem] border border-white/10 p-6 shadow-2xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg ${incident.ambulanceState.phase === 'evacuating' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                    {incident.ambulanceState.phase === 'at_patient' || incident.ambulanceState.phase === 'at_hospital' ? <Flag className="w-7 h-7" /> : <Navigation className="w-7 h-7" />}
                    <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">{incident.ambulanceState.phase.split('_')[0]}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Destino Operacional</p>
                    <h3 className="text-xl font-black text-white leading-none mt-1">{incident.ambulanceState.phase === 'evacuating' ? hospitalName : incident.locationName}</h3>
                    <div className="flex items-center gap-3 mt-2">
                       <div className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">ETA: {Math.round(incident.ambulanceState.eta)} MIN</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {incident.ambulanceState.phase === 'at_patient' ? (
                  <button onClick={handleStartEvacuation} className="bg-white text-slate-900 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg"><Hospital className="w-4 h-4" /> Iniciar Evacuação</button>
                ) : incident.ambulanceState.phase === 'at_hospital' ? (
                  <button onClick={() => setShowFinalReport(true)} className="bg-emerald-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"><ClipboardList className="w-4 h-4" /> Fechar Guia Médica</button>
                ) : (
                  <button disabled className="bg-slate-800 text-slate-500 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed opacity-50"><Activity className="w-4 h-4" /> Reportar Atendimento</button>
                )}
                <button onClick={() => { if(window.confirm('Deseja cancelar a missão? Auditoria registará esta ação.')) onUpdateAmbulance(incident.id, null); }} className="bg-red-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg"><XCircle className="w-4 h-4" /> Cancelar Missão</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL RELATÓRIO FINAL */}
      {showFinalReport && incident && (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-300 border border-slate-200">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20"><Shield className="w-6 h-6" /></div>
                 <div>
                    <h2 className="text-xl font-black font-corporate uppercase tracking-tight leading-none">Entrega Hospitalar</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{hospitalName}</p>
                 </div>
               </div>
               <button onClick={() => setShowFinalReport(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
             </div>

             <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
               <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-start gap-3">
                 <Activity className="w-5 h-5 text-emerald-600 shrink-0" />
                 <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase tracking-wider">
                   Os dados clínicos introduzidos serão encriptados e anexados à ficha do paciente para fins de governação SSM e faturamento de seguradora.
                 </p>
               </div>

               <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Consciência (AVPU)</label>
                 <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => setConsciousness('Consciente')}
                     className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${consciousness === 'Consciente' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                   >
                     Consciente
                   </button>
                   <button 
                     onClick={() => setConsciousness('Inconsciente')}
                     className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${consciousness === 'Inconsciente' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                   >
                     Inconsciente
                   </button>
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incidentes em Trânsito</label>
                 <button 
                   onClick={() => setWorsened(!worsened)}
                   className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${worsened ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                 >
                   {worsened ? 'Agravamento Clínico Detetado' : 'Sem Agravamento'}
                 </button>
               </div>

               <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas Clínicas Finais</label>
                 <textarea 
                   value={observations}
                   onChange={(e) => setObservations(e.target.value)}
                   placeholder="Detalhe os cuidados prestados em trânsito..."
                   className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                 />
               </div>
             </div>

             <div className="p-8 border-t border-slate-100 flex gap-3 bg-slate-50">
               <button onClick={() => setShowFinalReport(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancelar</button>
               <button onClick={handleFinishMission} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                 Finalizar Atendimento <ChevronRight className="w-4 h-4" />
               </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL COMUNICAÇÃO - CANAL EXCLUSIVO COM COORDENAÇÃO */}
      {isCommOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl flex flex-col h-[70vh] text-slate-900 overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="p-6 bg-slate-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-emerald-500" />
                <div>
                   <h2 className="text-sm font-black uppercase tracking-tight leading-none">Canal: Unidade ↔ Coordenação</h2>
                   <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Encriptação Ponta-a-Ponta Ativa</p>
                </div>
              </div>
              <button onClick={() => setIsCommOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFBFE] flex flex-col gap-4 custom-scrollbar">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-600" />
                <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
                  Este canal é restrito ao Centro de Coordenação Administrativa.
                </p>
              </div>
              {messages.map(m => (
                <div key={m.id} className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl text-sm font-medium ${m.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 shadow-sm rounded-tl-none'}`}>{m.text}</div>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{m.time}</span>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
              <input type="text" placeholder="Mensagem para coordenação..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10" />
              <button onClick={handleSendMessage} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceMode;
