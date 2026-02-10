
import React, { useState, useEffect, useRef } from 'react';
import { Truck, CheckCircle, XCircle, MapPin, Activity, Battery, Wifi, WifiOff, LogOut, Bell, Navigation, Phone, MessageSquare, ShieldAlert, ChevronRight, ClipboardList, Hospital, Lock } from 'lucide-react';
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

const AmbulanceMode: React.FC<AmbulanceModeProps> = ({ onLogout, adminName, incident, onUpdateAmbulance, onUpdateStatus }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([-25.9692, 32.5732], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  const handleAccept = () => {
    if (incident) {
      onUpdateAmbulance(incident.id, { phase: 'en_route_to_patient' });
      auditLogger.log({id: 'AMB-01', name: adminName, role: 'AMBULANCIA'}, 'MISSION_ACCEPTED_FIELD', incident.id);
    }
  };

  const handleEvacuate = () => {
    if (incident) {
      onUpdateAmbulance(incident.id, { phase: 'evacuating', eta: 10, distance: 3 });
      onUpdateStatus(incident.id, 'transit');
    }
  };

  const handleComplete = () => {
    if (incident) {
      onUpdateAmbulance(incident.id, null, {
        hospitalName: "Hospital Central de Maputo",
        timeToBaseToPatient: "12m",
        timeToPatientToHospital: "15m",
        totalOperationTime: "27m",
        consciousnessState: "Consciente",
        conditionWorsened: false,
        paramedicName: adminName,
        finalObservations: "Paciente estável na entrega.",
        timestamps: { dispatched: "10:00", arrivedAtPatient: "10:12", leftForHospital: "10:20", arrivedAtHospital: "10:35" }
      });
      setShowReport(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden text-white font-sans">
      <header className="h-16 bg-slate-950 border-b border-white/10 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg"><Truck className="w-6 h-6" /></div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest leading-none flex items-center gap-2">Terminal SSM <Lock className="w-3 h-3 text-emerald-500" /></h1>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{adminName} • UNIDADE ALPHA-1</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1.5 rounded-full border text-[10px] font-black flex items-center gap-2 ${isOffline ? 'bg-red-500/20 text-red-500 border-red-500' : 'bg-slate-800 text-emerald-500 border-slate-700'}`}>
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            {isOffline ? 'OFFLINE' : 'ONLINE'}
          </div>
          <button onClick={onLogout} className="p-2 text-slate-500 hover:text-white"><LogOut className="w-6 h-6" /></button>
        </div>
      </header>

      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 grayscale" />

        {/* Alerta de Nova Missão */}
        {incident && incident.ambulanceState?.phase === 'idle' && (
          <div className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col items-center text-center text-slate-900 border-t-[12px] border-red-600">
              <div className="w-24 h-24 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-8 animate-bounce"><Bell className="w-12 h-12" /></div>
              <h2 className="text-3xl font-black uppercase tracking-tight font-corporate">Nova Missão</h2>
              <div className="bg-slate-50 w-full p-6 rounded-3xl border border-slate-100 my-8 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Localização do Evento</p>
                <p className="text-xl font-black text-slate-900 leading-tight mb-4">{incident.locationName}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full w-fit">
                  <MapPin className="w-3.5 h-3.5" /> 1.2 KM de distância
                </div>
              </div>
              <button onClick={handleAccept} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">Aceitar Missão</button>
            </div>
          </div>
        )}

        {/* Dashboard de Missão Ativa */}
        {incident && incident.ambulanceState && incident.ambulanceState.phase !== 'idle' && (
          <div className="absolute bottom-6 left-6 right-6 z-20 animate-in slide-in-from-bottom-10">
            <div className="bg-slate-950 rounded-[2.5rem] border border-white/10 p-6 shadow-2xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white ${incident.ambulanceState.phase === 'evacuating' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                    <Navigation className="w-7 h-7" />
                    <span className="text-[8px] font-black uppercase mt-1">GPS</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Destino Operacional</p>
                    <h3 className="text-xl font-black text-white leading-none mt-1">{incident.ambulanceState.phase === 'evacuating' ? 'Hospital Central Maputo' : incident.locationName}</h3>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white"><Phone className="w-5 h-5" /></button>
                  <button className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white"><MessageSquare className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {incident.ambulanceState.phase === 'at_patient' ? (
                  <button onClick={handleEvacuate} className="py-5 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3"><Hospital className="w-5 h-5" /> Iniciar Evacuação</button>
                ) : incident.ambulanceState.phase === 'at_hospital' ? (
                  <button onClick={() => setShowReport(true)} className="py-5 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3"><ClipboardList className="w-5 h-5" /> Concluir Atendimento</button>
                ) : (
                  <button disabled className="py-5 bg-slate-800 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest opacity-50">Em Trânsito...</button>
                )}
                <button onClick={() => onUpdateAmbulance(incident.id, null)} className="py-5 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest">Cancelar Missão</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Relatório Final */}
      {showReport && (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 text-slate-900 shadow-2xl animate-in zoom-in-95">
             <h2 className="text-2xl font-black uppercase tracking-tight font-corporate mb-6 flex items-center gap-3"><ClipboardList className="w-7 h-7 text-blue-600" /> Ficha de Entrega</h2>
             <div className="space-y-6 mb-10">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white"><Activity className="w-6 h-6" /></div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Paciente Estável</p>
                      <p className="text-sm font-black">Entrega no Hospital Central</p>
                   </div>
                </div>
                <textarea placeholder="Observações clínicas finais..." className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm outline-none focus:border-blue-600 transition-all"></textarea>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setShowReport(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest">Voltar</button>
                <button onClick={handleComplete} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">Finalizar Missão <ChevronRight className="w-4 h-4" /></button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceMode;
