
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, User, Phone, PhoneOff, AlertCircle, X, ShieldAlert } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardOverview from './components/DashboardOverview';
import ProtocolAssistant from './components/ProtocolAssistant';
import ResourceManagement from './components/ResourceManagement';
import WorkflowSection from './components/WorkflowSection';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AmbulanceMode from './components/AmbulanceMode';
import CorporateClientMode from './components/CorporateClientMode';
import UserProfileSettings from './components/UserProfileSettings';
import AccountManagement from './components/AccountManagement';
import Login from './components/Login';
import { EmergencyCase, EmergencyPriority, AdminUser, AmbulanceState, OperationReport } from './types';
import { COMPANIES } from './constants';
import { auditLogger } from './services/auditLogger';

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;
const AMB_SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  
  // Call and SOS State
  const [activeCall, setActiveCall] = useState<EmergencyCase | null>(null);
  const [incomingSOS, setIncomingSOS] = useState<EmergencyCase | null>(null);

  const [incidents, setIncidents] = useState<EmergencyCase[]>([
    { 
      id: 'SSM-MZ-001', 
      timestamp: 'Agora', 
      type: 'Síncope/Desmaio', 
      locationName: 'Torre Absa - Maputo', 
      status: 'active', 
      priority: EmergencyPriority.HIGH,
      coords: [-25.9680, 32.5710],
      employeeId: 'EMP-001',
      companyId: 'ABSA'
    },
    { 
      id: 'SSM-MZ-002', 
      timestamp: '4m atrás', 
      type: 'Dor Torácica', 
      locationName: 'Campus ISCTEM', 
      status: 'triage', 
      priority: EmergencyPriority.CRITICAL,
      coords: [-25.9720, 32.5890],
      employeeId: 'EMP-004',
      companyId: 'ISCTEM'
    }
  ]);

  const hospitalCoords: [number, number] = [-25.975, 32.585];
  const ambulanceBasePos: [number, number] = [-25.9692, 32.5732];
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Monitoramento de Novos SOS (Simulação de Real-time)
  useEffect(() => {
    if (currentUser?.role === 'ADMIN_OC' || currentUser?.role === 'OPERADOR_SALA') {
      const lastIncident = incidents[0];
      if (lastIncident?.priority === EmergencyPriority.CRITICAL && lastIncident?.status === 'active' && !activeCall) {
        setIncomingSOS(lastIncident);
      }
    }
  }, [incidents, currentUser, activeCall]);

  const handleLogout = () => {
    if (currentUser) auditLogger.log(currentUser, 'LOGOUT_MANUAL');
    setCurrentUser(null);
    setIsLoggedOut(true);
    setActiveCall(null);
    setIncomingSOS(null);
  };

  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user);
    setIsLoggedOut(false);
  };

  const handleAcceptCall = () => {
    if (incomingSOS) {
      setActiveCall(incomingSOS);
      setIncomingSOS(null);
      setActiveTab('protocols'); // Mudar para triagem imediatamente
      auditLogger.log(currentUser!, 'AMBULANCE_PHASE_CHANGE', incomingSOS.id, 'Atendimento de Chamada SOS Iniciado');
    }
  };

  const handleUpdateIncident = useCallback((incidentId: string, updates: Partial<EmergencyCase>) => {
    setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, ...updates } : inc));
  }, []);

  const handleAddIncident = useCallback((newIncident: EmergencyCase) => {
    setIncidents(prev => [newIncident, ...prev]);
    setActiveTab('dashboard');
    setActiveCall(null); // Limpar chamada ativa após triagem completa
  }, []);

  const handleUpdateAmbulance = useCallback((id: string, updates: Partial<AmbulanceState> | null, finalReport?: OperationReport) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        if (updates === null) {
          return { ...inc, status: 'closed', report: finalReport, ambulanceState: undefined };
        }
        return { 
          ...inc, 
          ambulanceState: { 
            ...(inc.ambulanceState || { currentPos: ambulanceBasePos, phase: 'idle', eta: 5, distance: 1 }), 
            ...updates 
          } 
        };
      }
      return inc;
    }));
  }, []);

  const handleUpdateStatus = useCallback((incidentId: string, newStatus: 'active' | 'triage' | 'transit' | 'closed') => {
    setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: newStatus } : inc));
  }, []);

  const handleDispatch = useCallback((incidentId: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return { 
          ...inc, 
          ambulanceState: {
            currentPos: ambulanceBasePos,
            phase: 'idle',
            eta: 5,
            distance: 1,
            timestamps: { dispatched: new Date().toLocaleTimeString() }
          }
        };
      }
      return inc;
    }));
    auditLogger.log(currentUser!, 'DISPATCH_AMBULANCE', incidentId);
  }, [currentUser]);

  const handleTriggerSOS = useCallback(() => {
    if (!currentUser) return;
    const company = COMPANIES.find(c => c.id === currentUser.companyId);
    const newIncident: EmergencyCase = {
      id: `SSM-SOS-${Math.floor(Math.random() * 900) + 100}`,
      timestamp: 'Agora',
      type: 'ALERTA BOTÃO DE EMERGÊNCIA',
      locationName: company?.name || 'Localização Corporativa',
      status: 'active',
      priority: EmergencyPriority.CRITICAL,
      coords: [-25.9692 + (Math.random() - 0.5) * 0.01, 32.5732 + (Math.random() - 0.5) * 0.01],
      companyId: currentUser.companyId
    };
    setIncidents(prev => [newIncident, ...prev]);
    auditLogger.log(currentUser, 'CORPORATE_SOS_TRIGGERED', newIncident.id);
  }, [currentUser]);

  // Simulação de Movimento da Ambulância
  useEffect(() => {
    const simulate = () => {
      setIncidents(prev => prev.map(inc => {
        if (!inc.ambulanceState || ['idle', 'at_patient', 'at_hospital'].includes(inc.ambulanceState.phase)) return inc;

        const target = inc.ambulanceState.phase === 'en_route_to_patient' ? inc.coords : hospitalCoords;
        const current = inc.ambulanceState.currentPos;
        const speed = 0.0001; // Velocidade de simulação
        const latDiff = target[0] - current[0];
        const lngDiff = target[1] - current[1];
        const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        if (dist < 0.0002) {
          const nextPhase = inc.ambulanceState.phase === 'en_route_to_patient' ? 'at_patient' : 'at_hospital';
          return {
            ...inc,
            ambulanceState: { ...inc.ambulanceState, currentPos: target, phase: nextPhase, eta: 0, distance: 0 }
          };
        }

        const move = speed / dist;
        return {
          ...inc,
          ambulanceState: {
            ...inc.ambulanceState,
            currentPos: [current[0] + latDiff * move, current[1] + lngDiff * move],
            eta: Math.max(0.1, inc.ambulanceState.eta - 0.02),
            distance: Math.max(0.01, inc.ambulanceState.distance - 0.01)
          }
        };
      }));
      animationFrameRef.current = requestAnimationFrame(simulate);
    };
    animationFrameRef.current = requestAnimationFrame(simulate);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, []);

  if (!currentUser) return <Login onLoginSuccess={handleLogin} />;

  if (currentUser.role === 'AMBULANCIA') {
    const myIncident = incidents.find(i => i.ambulanceState !== undefined);
    return (
      <AmbulanceMode 
        adminName={currentUser.name} 
        onLogout={handleLogout}
        incident={myIncident || null}
        onUpdateAmbulance={handleUpdateAmbulance}
        onUpdateStatus={handleUpdateStatus}
      />
    );
  }

  if (currentUser.role === 'EMPRESA_CLIENTE') {
    return <CorporateClientMode onTriggerEmergency={handleTriggerSOS} onLogout={handleLogout} adminName={currentUser.name} companyId={currentUser.companyId} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] relative">
      {/* Overlay de Chamada SOS Entrante */}
      {incomingSOS && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl flex flex-col items-center text-center border-t-[12px] border-red-600">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-8 animate-bounce">
              <Phone className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black font-corporate uppercase tracking-tight text-slate-900">SOS Corporativo</h2>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">Solicitação de Emergência em Tempo-Real</p>
            
            <div className="w-full bg-slate-50 rounded-3xl p-6 my-8 border border-slate-100 text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem</p>
                  <p className="text-lg font-black text-slate-900">{incomingSOS.locationName}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => setIncomingSOS(null)} className="py-5 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Ignorar</button>
              <button onClick={handleAcceptCall} className="py-5 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Phone className="w-4 h-4" /> Atender SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Chamada Ativa (Durante Triagem) */}
      {activeCall && activeTab === 'protocols' && (
        <div className="fixed bottom-10 right-10 z-[150] bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-6 animate-in slide-in-from-right-10">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div>
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Canal de Voz Activo</p>
            <p className="text-sm font-black uppercase">{activeCall.locationName}</p>
          </div>
          <button onClick={() => setActiveCall(null)} className="p-3 bg-red-600 hover:bg-red-700 rounded-xl transition-all">
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={currentUser.role} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto pb-20">
            {activeTab === 'dashboard' && <DashboardOverview incidents={incidents} onDispatch={handleDispatch} currentUser={currentUser} onUpdateIncident={handleUpdateIncident} />}
            {activeTab === 'map' && <ResourceManagement incidents={incidents} />}
            {activeTab === 'protocols' && <div className="space-y-12"><ProtocolAssistant onAddIncident={handleAddIncident} activeCall={activeCall} /><WorkflowSection /></div>}
            {activeTab === 'providers' && <AnalyticsDashboard currentUser={currentUser} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
