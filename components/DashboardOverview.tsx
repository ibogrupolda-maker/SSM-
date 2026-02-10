
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, Clock, AlertCircle, CheckCircle2, 
  MapPin, Activity, Phone, Share2, 
  ChevronRight, MoreHorizontal, MessageSquare, 
  ArrowUpRight, Truck, Hospital, Users2, Plane,
  RotateCcw, Search, Filter, Plus, FileText,
  ChevronDown, ChevronUp, Shield, Heart, Info,
  AlertTriangle, Navigation, CheckCircle, Send, ExternalLink, Calendar, Loader2,
  Globe, Flag, X, Maximize2, Minimize2, ClipboardCheck, TrendingDown, TrendingUp, User, Key, Building2,
  UserPlus, TrendingUp as ArrowUp, ShieldAlert, Volume2, BellRing
} from 'lucide-react';
import { EmergencyCase, EmergencyPriority, Employee, Company, OperationReport, AdminUser } from '../types';
import { COMPANIES, EMPLOYEES, PRIORITY_COLORS } from '../constants';
import EmergencyCommunication from './EmergencyCommunication';
import NetworkMap from './NetworkMap';
import L from 'leaflet';
import { auditLogger } from '../services/auditLogger';

interface DashboardOverviewProps {
  incidents: EmergencyCase[];
  onDispatch?: (incidentId: string) => void;
  currentUser?: AdminUser;
  onUpdateIncident?: (incidentId: string, updates: Partial<EmergencyCase>) => void;
}

// Definição de Pontos Críticos de Acesso (Ex: Portarias, Entradas de Emergência)
const CRITICAL_ACCESS_POINTS = [
  { id: 'PT-01', name: 'Portaria Principal Torre Absa', coords: [-25.9682, 32.5712] as [number, number], type: 'checkpoint' },
  { id: 'PT-02', name: 'Acesso Emergência HCM', coords: [-25.9745, 32.5845] as [number, number], type: 'hospital_gate' },
  { id: 'PT-03', name: 'Portaria Letshego', coords: [-25.9622, 32.5782] as [number, number], type: 'checkpoint' }
];

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ incidents, onDispatch, currentUser, onUpdateIncident }) => {
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [trackingIncidentId, setTrackingIncidentId] = useState<string | null>(null);
  const [reportIncidentId, setReportIncidentId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<EmergencyPriority | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Alertas
  const [proximityAlert, setProximityAlert] = useState<{msg: string, type: 'info' | 'warning' | 'critical'} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertedPoints = useRef<Set<string>>(new Set());

  // Gestão de Escalação
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  const [bottomEscalatingId, setBottomEscalatingId] = useState<string | null>(null);

  // Gestão de Contas (Apenas ADM-001)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccountType, setNewAccountType] = useState<'AMBULANCIA' | 'EMPRESA_CLIENTE'>('AMBULANCIA');
  
  const [commModalIncidentId, setCommModalIncidentId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const proximityCircleRef = useRef<L.Circle | null>(null);

  const trackingIncident = incidents.find(i => i.id === trackingIncidentId);
  const reportedIncident = incidents.find(i => i.id === reportIncidentId);

  // Função para disparar alerta sonoro
  const playAlertSound = useCallback((intensity: 'soft' | 'urgent' = 'soft') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = intensity === 'urgent' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(intensity === 'urgent' ? 880 : 440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(intensity === 'urgent' ? 440 : 220, audioCtx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio block by browser policy", e);
    }
  }, []);

  useEffect(() => {
    if (trackingIncident && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(trackingIncident.coords, 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
      
      // Adicionar Pontos Críticos ao Mapa
      CRITICAL_ACCESS_POINTS.forEach(pt => {
        L.circle(pt.coords, {
          radius: 100,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 1,
          dashArray: '5, 5'
        }).addTo(mapRef.current!).bindTooltip(`Ponto Crítico: ${pt.name}`, { direction: 'top' });
      });
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [trackingIncidentId]);

  useEffect(() => {
    if (trackingIncident && trackingIncident.ambulanceState && mapRef.current) {
      const { currentPos, phase, distance } = trackingIncident.ambulanceState;
      const target = phase === 'evacuating' ? [-25.975, 32.585] as [number, number] : trackingIncident.coords;
      
      // 1. Atualizar Marcador Ambulância
      if (!ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current = L.marker(currentPos, {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="bg-blue-600 p-1.5 rounded-full border-2 border-white text-white shadow-xl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/></svg></div>`,
            iconSize: [28, 28], iconAnchor: [14, 14]
          })
        }).addTo(mapRef.current);
      } else {
        ambulanceMarkerRef.current.setLatLng(currentPos);
      }

      // 2. Atualizar Marcador Alvo (Paciente/Hospital)
      if (!targetMarkerRef.current) {
        const company = COMPANIES.find(c => c.id === trackingIncident.companyId);
        targetMarkerRef.current = L.marker(target, {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="bg-red-600 p-1 rounded-full border-2 border-white shadow-lg text-white">${phase === 'evacuating' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 21V15"/><path d="M10 9h4"/></svg>' : (company ? `<img src="${company.logo}" class="w-6 h-6 rounded-full" />` : '<Activity class="w-4 h-4" />')}</div>`,
            iconSize: [32, 32], iconAnchor: [16, 16]
          })
        }).addTo(mapRef.current);
      } else {
        targetMarkerRef.current.setLatLng(target);
      }

      // 3. Alerta de Proximidade (Raio 500m)
      if (distance < 0.5) {
        if (!proximityCircleRef.current) {
          proximityCircleRef.current = L.circle(target, {
            radius: 500,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.2,
            weight: 2,
            className: 'animate-pulse'
          }).addTo(mapRef.current);
          
          setProximityAlert({ msg: `UNIDADE A MENOS DE 500M DO DESTINO`, type: 'critical' });
          playAlertSound('urgent');
        }
      } else {
        if (proximityCircleRef.current) {
          proximityCircleRef.current.remove();
          proximityCircleRef.current = null;
          setProximityAlert(null);
        }
      }

      // 4. Verificação de Pontos Críticos
      CRITICAL_ACCESS_POINTS.forEach(pt => {
        const d = mapRef.current!.distance(currentPos, pt.coords);
        const pointId = `${trackingIncident.id}-${pt.id}`;
        if (d < 150 && !alertedPoints.current.has(pointId)) {
          alertedPoints.current.add(pointId);
          setProximityAlert({ msg: `PASSAGEM DETECTADA: ${pt.name.toUpperCase()}`, type: 'warning' });
          playAlertSound('soft');
          setTimeout(() => setProximityAlert(null), 5000);
        }
      });

      // Rota
      if (routeRef.current) routeRef.current.remove();
      routeRef.current = L.polyline([currentPos, target], { color: '#2563eb', weight: 4, dashArray: '8, 8', opacity: 0.6 }).addTo(mapRef.current);
      
      const bounds = L.latLngBounds([currentPos, target]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [trackingIncident, playAlertSound]);

  const getPriorityData = (priority: EmergencyPriority) => {
    switch (priority) {
      case EmergencyPriority.CRITICAL: return { label: 'CRÍTICA', color: 'bg-red-600 text-white', border: 'border-red-600', text: 'text-red-600' };
      case EmergencyPriority.HIGH: return { label: 'ALTA', color: 'bg-orange-500 text-white', border: 'border-orange-500', text: 'text-orange-500' };
      case EmergencyPriority.MODERATE: return { label: 'MÉDIA', color: 'bg-yellow-400 text-slate-900', border: 'border-yellow-400', text: 'text-yellow-600' };
      case EmergencyPriority.LOW: return { label: 'BAIXA', color: 'bg-emerald-500 text-white', border: 'border-emerald-500', text: 'text-emerald-600' };
      default: return { label: 'N/A', color: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-500' };
    }
  };

  const handleEscalate = (incidentId: string, newPriority: EmergencyPriority) => {
    if (onUpdateIncident) {
      onUpdateIncident(incidentId, { priority: newPriority });
      if (currentUser) auditLogger.log(currentUser, 'AMBULANCE_PHASE_CHANGE', incidentId, `Prioridade Escalada para: ${newPriority}`);
    }
    setEscalatingId(null);
    setBottomEscalatingId(null);
  };

  const renderStatusBox = (incident: EmergencyCase) => {
    const isDespatched = incident.ambulanceState !== undefined;
    const isLive = incident.ambulanceState?.phase === 'en_route_to_patient' || incident.ambulanceState?.phase === 'evacuating';
    const isClosed = incident.status === 'closed';
    // Nova lógica de aproximação
    const isApproaching = isLive && incident.ambulanceState && incident.ambulanceState.distance < 0.5;

    return (
      <div 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (isClosed) setReportIncidentId(incident.id);
          else if (isDespatched) setTrackingIncidentId(incident.id); 
        }}
        className={`rounded-2xl p-4 flex items-center justify-between border transition-all cursor-pointer group/status ${
          isApproaching ? 'bg-red-50 border-red-500 shadow-md ring-2 ring-red-500/20 animate-pulse' :
          isLive ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-500/20' : 
          isClosed ? 'bg-emerald-50 border-emerald-500 shadow-sm' :
          incident.status === 'triage' ? 'bg-emerald-50 border-emerald-200' :
          isDespatched ? 'bg-slate-50 border-slate-200 hover:border-blue-400' : 'bg-[#F8FAFC] border-slate-100'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
            isApproaching ? 'bg-red-600 text-white' :
            isLive ? 'bg-blue-600 text-white animate-pulse' :
            isClosed ? 'bg-emerald-600 text-white' :
            incident.status === 'triage' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-100'
          }`}>
            {isApproaching ? <Navigation className="w-5 h-5 animate-bounce" /> : (isClosed ? <ClipboardCheck className="w-5 h-5" /> : (isLive ? <Navigation className="w-5 h-5" /> : (incident.status === 'transit' ? <Hospital className="w-5 h-5" /> : <Truck className="w-5 h-5" />)))}
          </div>
          <div>
            <p className={`text-sm font-black leading-none ${isApproaching ? 'text-red-700' : 'text-slate-900'}`}>
              {isApproaching ? 'Chegada Iminente' :
               isClosed ? 'Operação Finalizada' : 
               incident.status === 'transit' ? 'Evacuação Médica' : 
               incident.status === 'triage' ? 'Atendimento no Local' :
               isDespatched ? 'Unidade Despachada' : 'Aguardando Despacho'}
            </p>
            <p className={`text-[10px] font-bold uppercase mt-1 tracking-widest ${isApproaching ? 'text-red-600 animate-pulse' : 'text-slate-500'}`}>
              {isApproaching ? 'Unidade a menos de 500m' :
               isClosed ? 'Ver Relatório de Operação' : (isLive ? 'Clique para Rastreio Real-Time' : 'Monitorização Activa')}
            </p>
          </div>
        </div>
        <div className="text-right">
          {isLive ? (
            <div className="flex flex-col items-end">
              <span className={`text-xs font-black ${isApproaching ? 'text-red-700' : 'text-blue-600'}`}>ETA: {Math.round(incident.ambulanceState?.eta || 0)} min</span>
              <span className={`text-[9px] font-bold uppercase ${isApproaching ? 'text-red-500' : 'text-blue-400'}`}>{isApproaching ? 'AGORA' : 'AO VIVO'}</span>
            </div>
          ) : isClosed ? (
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          ) : isDespatched && (
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover/status:translate-x-1 transition-transform" />
          )}
        </div>
      </div>
    );
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesCompany = !selectedCompanyId || inc.companyId === selectedCompanyId;
    const matchesPriority = !selectedPriority || inc.priority === selectedPriority;
    const matchesStatus = !selectedStatus || inc.status === selectedStatus;
    // INTEGRADO: Pesquisa agora também pelo patientName (casos da triagem)
    const employee = EMPLOYEES.find(e => e.id === inc.employeeId);
    const patientMatch = inc.patientName?.toLowerCase().includes(searchQuery.toLowerCase());
    const employeeMatch = employee?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCompany && matchesPriority && matchesStatus && (!searchQuery || patientMatch || employeeMatch);
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAccountModalOpen(false);
    alert(`Conta de ${newAccountType} criada com sucesso. Convite de ativação enviado via e-mail corporativo.`);
    if (currentUser) auditLogger.log(currentUser, 'DATA_EXPORT_PDF', 'ADMIN_ZONE', `Criação de conta: ${newAccountType}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      
      {/* OVERLAY DE RASTREIO AO VIVO COM ALERTAS */}
      {trackingIncident && trackingIncident.ambulanceState && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 animate-in fade-in zoom-in-95">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col sm:flex-row relative">
            <button onClick={() => { setTrackingIncidentId(null); setProximityAlert(null); }} className="absolute top-6 right-6 z-50 p-3 bg-white/90 hover:bg-white rounded-2xl text-slate-900 shadow-xl transition-all hover:scale-110 active:scale-95"><X className="w-6 h-6" /></button>
            
            {/* Mapa de Rastreio */}
            <div className="flex-1 relative bg-slate-100">
              <div ref={mapContainerRef} className="absolute inset-0" />
              
              {/* Overlay Alerta Visual Superior */}
              {proximityAlert && (
                <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-[400] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 border-2 ${
                  proximityAlert.type === 'critical' ? 'bg-red-600 text-white border-red-400' : 'bg-orange-500 text-white border-orange-300'
                }`}>
                  <BellRing className="w-6 h-6 animate-bounce" />
                  <span className="text-sm font-black uppercase tracking-widest">{proximityAlert.msg}</span>
                </div>
              )}

              <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white/50 flex gap-4 items-center">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Activity className="w-5 h-5" /></div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status de Rede</p>
                    <p className="text-xs font-black text-slate-900 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Conexão Satélite SSM Activa</p>
                 </div>
              </div>
            </div>

            {/* Painel de Informações */}
            <div className="w-full sm:w-96 bg-slate-50 border-l border-slate-100 p-8 flex flex-col gap-8">
               <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div> Live Tracking
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight font-corporate uppercase tracking-tight">Rastreio de Missão</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Caso #{trackingIncident.id}</p>
               </div>

               <div className="space-y-6">
                  <div className={`bg-white p-6 rounded-3xl border transition-all duration-500 shadow-sm flex flex-col items-center text-center ${proximityAlert?.type === 'critical' ? 'border-red-500 bg-red-50 ring-4 ring-red-500/10' : 'border-slate-200'}`}>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tempo Estimado de Chegada</p>
                     <div className={`text-5xl font-black font-mono tracking-tighter ${proximityAlert?.type === 'critical' ? 'text-red-600' : 'text-blue-600'}`}>
                        {Math.floor(trackingIncident.ambulanceState.eta).toString().padStart(2, '0')}:
                        {Math.round((trackingIncident.ambulanceState.eta % 1) * 60).toString().padStart(2, '0')}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Distância</p>
                        <p className="text-lg font-black text-slate-900">{trackingIncident.ambulanceState.distance.toFixed(1)} km</p>
                     </div>
                     <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Velocidade</p>
                        <p className="text-lg font-black text-slate-900">42 km/h</p>
                     </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-200">
                     <div className="flex gap-4">
                        <div className="w-1 bg-blue-600 rounded-full"></div>
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origem</p>
                           <p className="text-xs font-bold text-slate-700">Base Central Maputo</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-1 bg-red-600 rounded-full"></div>
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destino Actual</p>
                           <p className="text-xs font-bold text-slate-900 font-corporate">{trackingIncident.ambulanceState.phase === 'evacuating' ? 'Hospital Central Maputo' : trackingIncident.locationName}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="mt-auto">
                  <button onClick={() => setCommModalIncidentId(trackingIncident.id)} className="w-full bg-slate-950 hover:bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95">
                     <MessageSquare className="w-4 h-4" /> Contactar Unidade
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats e Zona ADM-001 */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-red-50 text-red-600"><Activity className="w-6 h-6" /></div>
              <div className="flex items-center gap-1 text-xs font-bold text-red-600"><TrendingUp className="w-3 h-3" /> +12%</div>
            </div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">4</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Triagens Ativas</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600"><Clock className="w-6 h-6" /></div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600"><TrendingDown className="w-3 h-3" /> -8%</div>
            </div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">6.2m</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resposta Média</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
            </div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">47</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Casos Concluídos</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Truck className="w-6 h-6" /></div>
            </div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">18</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unidades em Prontidão</p>
          </div>
        </div>

        {/* Zona ADM-001: Gestão de Identidades */}
        {currentUser?.id === 'ADM-001' && (
           <div className="lg:w-80 bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-900/20 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-3 mb-6">
                 <Shield className="w-5 h-5 text-blue-400" />
                 <h4 className="text-xs font-black uppercase tracking-widest font-corporate">Gestão de Acessos</h4>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-6">
                 Administrador 001: Utilize as ferramentas abaixo para governaça de novas identidades na rede.
              </p>
              <div className="space-y-3">
                 <button onClick={() => setIsAccountModalOpen(true)} className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl border border-white/10 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <UserPlus className="w-4 h-4 text-blue-400" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Criar Nova Conta</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-white/30 group-hover:translate-x-1 transition-all" />
                 </button>
                 <button onClick={() => alert('Visualização de logs completa disponível no dashboard de analítica.')} className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <Key className="w-4 h-4 text-slate-400" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Auditoria Credenciais</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-white/10 group-hover:translate-x-1 transition-all" />
                 </button>
              </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-lg font-black text-slate-900 font-corporate uppercase tracking-tight flex items-center gap-3">Operações SSM Moçambique <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div></h3>
          <div className="space-y-4">
            {filteredIncidents.map((incident) => {
              const employee = EMPLOYEES.find(e => e.id === incident.employeeId);
              const company = COMPANIES.find(c => c.id === incident.companyId);
              const isExpanded = expandedCaseId === incident.id;
              const priorityData = getPriorityData(incident.priority);
              
              // INTEGRADO: Determinar nome a exibir
              const displayName = incident.patientName || employee?.name || 'Paciente Externo';

              return (
                <div key={incident.id} className={`bg-white rounded-[2rem] border border-slate-200 shadow-sm transition-all duration-500 overflow-hidden ${isExpanded ? 'ring-4 ring-blue-600/5 border-blue-100' : 'hover:border-blue-300'}`}>
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedCaseId(isExpanded ? null : incident.id)}>
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden">
                          {company ? <img src={company.logo} className="w-full h-full object-cover" /> : <Activity className="w-7 h-7" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl font-black text-slate-900 leading-none">{displayName}</h4>
                            <div className="relative">
                               <button 
                                onClick={(e) => { e.stopPropagation(); setEscalatingId(escalatingId === incident.id ? null : incident.id); }}
                                className={`${priorityData.color} text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all`}
                               >
                                 {priorityData.label}
                                 {incident.status !== 'closed' && <ArrowUp className="w-3 h-3" />}
                               </button>

                               {escalatingId === incident.id && (
                                 <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] animate-in fade-in zoom-in-95">
                                   <p className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Escalar Prioridade (MTS)</p>
                                   {[
                                     { p: EmergencyPriority.CRITICAL, label: 'EMERGÊNCIA (Vermelho)' },
                                     { p: EmergencyPriority.HIGH, label: 'MUITO URGENTE (Laranja)' },
                                     { p: EmergencyPriority.MODERATE, label: 'URGENTE (Amarelo)' },
                                     { p: EmergencyPriority.LOW, label: 'POUCO URGENTE (Verde)' },
                                   ].map(opt => (
                                     <button 
                                      key={opt.p}
                                      disabled={opt.p === incident.priority}
                                      onClick={(e) => { e.stopPropagation(); handleEscalate(incident.id, opt.p); }}
                                      className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-between ${opt.p === incident.priority ? 'bg-slate-50 text-slate-300' : 'hover:bg-blue-50 text-slate-600 hover:text-blue-700'}`}
                                     >
                                       {opt.label}
                                       {opt.p === EmergencyPriority.CRITICAL && <ShieldAlert className="w-3 h-3 text-red-500" />}
                                     </button>
                                   ))}
                                 </div>
                               )}
                            </div>
                          </div>
                          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Caso #{incident.id} • {company?.name}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs font-black text-slate-400 flex items-center gap-2"><Clock className="w-4 h-4" /> {incident.timestamp}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                       <div className="space-y-4">
                          <div className="flex gap-4">
                             <MapPin className="w-5 h-5 text-slate-300 shrink-0" />
                             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Localização</p><p className="text-sm font-bold text-slate-700">{incident.locationName}</p></div>
                          </div>
                          <div className="flex gap-4">
                             <AlertCircle className="w-5 h-5 text-slate-300 shrink-0" />
                             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cenário</p><p className="text-sm font-bold text-slate-700">{incident.type}</p></div>
                          </div>
                       </div>
                       <div>
                          {renderStatusBox(incident)}
                       </div>
                    </div>

                    {isExpanded && (
                       <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white animate-in slide-in-from-top-4">
                          <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                             <Info className="w-5 h-5 text-blue-400" />
                             <h5 className="text-sm font-black uppercase tracking-widest">Informação de Governação Médica</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Paciente</p><p className="text-sm font-black">{displayName}</p><p className="text-[10px] text-slate-400 mt-1">{employee?.bi || 'N/A'}</p></div>
                             <div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Cobertura Seguradora</p><p className="text-sm font-black">{employee?.insurer || 'Verificação Pendente'}</p><p className="text-[10px] text-blue-400 mt-1">{employee?.policyNumber || 'N/A'}</p></div>
                             <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Contacto de Urgência</p>
                                <p className="text-xs font-black">{employee?.emergencyContact.name || 'Coordenação SSM'}</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">{employee?.emergencyContact.phone || '+258 84 000 0000'}</p>
                             </div>
                          </div>
                       </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                       <button onClick={(e) => { e.stopPropagation(); if (onDispatch) onDispatch(incident.id); }} disabled={incident.ambulanceState !== undefined || incident.status === 'closed'} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${incident.ambulanceState || incident.status === 'closed' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}><Send className="w-4 h-4" /> {incident.status === 'closed' ? 'Operação Finalizada' : (incident.ambulanceState ? 'Missão Iniciada' : 'Despachar Ambulância')}</button>
                       <button onClick={(e) => { e.stopPropagation(); setCommModalIncidentId(incident.id); }} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comunicar</button>
                       
                       {/* BOTÃO ESCALAR RISCO (MODIFICADO COM CORES PERMANENTES) */}
                       {incident.status !== 'closed' && (
                         <div className="relative">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setBottomEscalatingId(bottomEscalatingId === incident.id ? null : incident.id); }}
                              className={`px-6 py-3 bg-white border-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 ${priorityData.border} ${priorityData.text}`}
                            >
                               <ShieldAlert className="w-4 h-4" /> Escalar Risco
                            </button>

                            {bottomEscalatingId === incident.id && (
                              <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 p-2 z-[60] animate-in fade-in slide-in-from-bottom-2">
                                <p className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Definir Nível (MTS)</p>
                                {[
                                  { p: EmergencyPriority.CRITICAL, label: 'CRÍTICA (A)', color: 'bg-red-600 text-white' },
                                  { p: EmergencyPriority.HIGH, label: 'ALTA (B)', color: 'bg-orange-500 text-white' },
                                  { p: EmergencyPriority.MODERATE, label: 'MÉDIA (C)', color: 'bg-yellow-400 text-slate-900' },
                                  { p: EmergencyPriority.LOW, label: 'BAIXA (D)', color: 'bg-emerald-500 text-white' },
                                ].map(opt => (
                                  <button 
                                    key={opt.p}
                                    disabled={opt.p === incident.priority}
                                    onClick={(e) => { e.stopPropagation(); handleEscalate(incident.id, opt.p); }}
                                    className={`w-full text-left px-3 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between mb-1 ${
                                      opt.p === incident.priority ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed' : `${opt.color} hover:brightness-110 shadow-sm active:scale-[0.98]`
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {opt.p === incident.priority && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>
                                ))}
                              </div>
                            )}
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4">
           <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 sticky top-8">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] font-corporate mb-8">Recursos Ativos</h3>
              <div className="space-y-8">
                 <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Truck className="w-5 h-5" /></div><div><p className="text-xs font-black text-slate-900">Frota Maputo</p><p className="text-[9px] text-slate-400 font-bold uppercase">8 Activos</p></div></div><span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">DISPONÍVEL</span></div>
                 <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Hospital className="w-5 h-5" /></div><div><p className="text-xs font-black text-slate-900">HCM Maputo</p><p className="text-[9px] text-slate-400 font-bold uppercase">Capacidade 70%</p></div></div><span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">OPERACIONAL</span></div>
              </div>
           </div>
        </div>
      </div>

      {commModalIncidentId && (
        <EmergencyCommunication isOpen={true} onClose={() => setCommModalIncidentId(null)} incident={incidents.find(i => i.id === commModalIncidentId)!} employee={EMPLOYEES.find(e => e.id === incidents.find(i => i.id === commModalIncidentId)?.employeeId)} />
      )}
    </div>
  );
};

export default DashboardOverview;
