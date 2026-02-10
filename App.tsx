
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, User } from 'lucide-react';
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
import { EMPLOYEES, COMPANIES, ADMINS } from './constants';
import { auditLogger } from './services/auditLogger';

// Configurações de Sessão SSM v3.1
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 Horas para Admins/Clientes (Corporativo)
const AMB_SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 Horas para Ambulâncias (Campo/Crítico)

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

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
    },
    { 
      id: 'SSM-MZ-003', 
      timestamp: '12m atrás', 
      type: 'Trauma Ligeiro', 
      locationName: 'Escritórios Letshego', 
      status: 'transit', 
      priority: EmergencyPriority.MODERATE,
      coords: [-25.9620, 32.5780],
      employeeId: 'EMP-002',
      companyId: 'LETSHEGO'
    },
  ]);

  const hospitalCoords: [number, number] = [-25.975, 32.585];
  const ambulanceBasePos: [number, number] = [-25.9692, 32.5732];
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (!currentUser) return;

    const timeoutDuration = currentUser.role === 'AMBULANCIA' ? AMB_SESSION_TIMEOUT : SESSION_TIMEOUT;
    
    timeoutRef.current = window.setTimeout(() => {
      handleLogout();
    }, timeoutDuration);
  }, [currentUser]);

  useEffect(() => {
    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keypress', resetTimeout);
    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
    };
  }, [resetTimeout]);

  const handleLogout = () => {
    if (currentUser) auditLogger.log(currentUser, 'LOGOUT_MANUAL');
    setCurrentUser(null);
    setIsLoggedOut(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  };

  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user);
    setIsLoggedOut(false);
    resetTimeout();
    auditLogger.log(user, 'LOGIN_SUCCESS');
  };

  const handleUpdateCurrentUser = (updates: Partial<AdminUser>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updates });
    }
  };

  const handleUpdateIncident = useCallback((incidentId: string, updates: Partial<EmergencyCase>) => {
    setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, ...updates } : inc));
  }, []);

  const handleAddIncident = useCallback((newIncident: EmergencyCase) => {
    setIncidents(prev => [newIncident, ...prev]);
    setActiveTab('dashboard'); // Redirecionar para visualização
  }, []);

  const updateAmbulanceInApp = useCallback((id: string, updates: Partial<AmbulanceState> | null, finalReport?: OperationReport) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        if (updates === null) {
          const { ambulanceState, ...rest } = inc;
          if (currentUser) auditLogger.log(currentUser, 'MISSION_FINALIZED', id);
          return { ...rest, status: 'closed', report: finalReport };
        }
        
        const currentTimestamps = inc.ambulanceState?.timestamps || { dispatched: new Date().toLocaleTimeString() };
        if (updates.phase && updates.phase !== inc.ambulanceState?.phase) {
          if (currentUser) auditLogger.log(currentUser, 'AMBULANCE_PHASE_CHANGE', id, `Fase: ${updates.phase}`);
          if (updates.phase === 'at_patient') currentTimestamps.arrivedAtPatient = new Date().toLocaleTimeString();
          if (updates.phase === 'evacuating') currentTimestamps.leftForHospital = new Date().toLocaleTimeString();
          if (updates.phase === 'at_hospital') currentTimestamps.arrivedAtHospital = new Date().toLocaleTimeString();
        }

        return { 
          ...inc, 
          ambulanceState: { 
            ...inc.ambulanceState!, 
            ...updates, 
            timestamps: currentTimestamps 
          } 
        };
      }
      return inc;
    }));
  }, [currentUser]);

  const updateIncidentStatus = useCallback((incidentId: string, newStatus: 'active' | 'triage' | 'transit' | 'closed') => {
    setIncidents(prev => prev.map(inc => 
      inc.id === incidentId ? { ...inc, status: newStatus } : inc
    ));
  }, []);

  const handleGlobalDispatch = useCallback((incidentId: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        if (currentUser) auditLogger.log(currentUser, 'DISPATCH_AMBULANCE', incidentId);
        return { 
          ...inc, 
          ambulanceState: {
            currentPos: ambulanceBasePos,
            phase: 'idle',
            eta: 4,
            distance: 1.2,
            timestamps: { dispatched: new Date().toLocaleTimeString() }
          }
        };
      }
      return inc;
    }));
  }, [currentUser]);

  const handleTriggerEmergency = useCallback(() => {
    if (!currentUser) return;
    const company = COMPANIES.find(c => c.id === currentUser.companyId);
    const newIncident: EmergencyCase = {
      id: `SSM-MZ-${Math.floor(Math.random() * 900) + 100}`,
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

  useEffect(() => {
    const simulate = () => {
      setIncidents(prev => prev.map(inc => {
        if (!inc.ambulanceState || inc.ambulanceState.phase === 'idle' || inc.ambulanceState.phase === 'at_patient' || inc.ambulanceState.phase === 'at_hospital') {
          return inc;
        }

        const target = inc.ambulanceState.phase === 'en_route_to_patient' ? inc.coords : hospitalCoords;
        const current = inc.ambulanceState.currentPos;
        const speed = 0.00004;
        const latDiff = target[0] - current[0];
        const lngDiff = target[1] - current[1];
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        if (distance < 0.0001) {
          const newPhase = inc.ambulanceState.phase === 'en_route_to_patient' ? 'at_patient' : 'at_hospital';
          const updatedTimestamps = { ...inc.ambulanceState.timestamps! };
          if (newPhase === 'at_patient') updatedTimestamps.arrivedAtPatient = new Date().toLocaleTimeString();
          if (newPhase === 'at_hospital') updatedTimestamps.arrivedAtHospital = new Date().toLocaleTimeString();

          return {
            ...inc,
            status: (newPhase === 'at_patient' ? 'triage' : inc.status) as any,
            ambulanceState: {
              ...inc.ambulanceState,
              currentPos: target,
              phase: newPhase,
              eta: 0,
              distance: 0,
              timestamps: updatedTimestamps
            }
          };
        }

        const moveRatio = speed / distance;
        return {
          ...inc,
          ambulanceState: {
            ...inc.ambulanceState,
            currentPos: [current[0] + latDiff * moveRatio, current[1] + lngDiff * moveRatio],
            eta: Math.max(0.1, inc.ambulanceState.eta - 0.01),
            distance: Math.max(0.05, inc.ambulanceState.distance - 0.005)
          }
        };
      }));
      animationFrameRef.current = requestAnimationFrame(simulate);
    };

    animationFrameRef.current = requestAnimationFrame(simulate);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, []);

  const filteredIncidents = incidents.filter(inc => {
    if (!currentUser) return false;
    if (currentUser.role === 'EMPRESA_CLIENTE') {
      return inc.companyId === currentUser.companyId;
    }
    if (currentUser.role === 'AMBULANCIA') {
      return inc.ambulanceState !== undefined;
    }
    return true;
  });

  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  if (currentUser.role === 'AMBULANCIA') {
    const myIncident = filteredIncidents[0];
    return (
      <AmbulanceMode 
        adminName={currentUser.name} 
        onLogout={handleLogout}
        incident={myIncident || null}
        onUpdateAmbulance={updateAmbulanceInApp}
        onUpdateStatus={updateIncidentStatus}
      />
    );
  }

  if (currentUser.role === 'EMPRESA_CLIENTE') {
    return (
      <CorporateClientMode 
        onTriggerEmergency={handleTriggerEmergency}
        onLogout={handleLogout}
        adminName={currentUser.name}
        companyId={currentUser.companyId}
      />
    );
  }

  const getRoleDisplayName = (role: string, id: string) => {
    if (id === 'ADM-001') return 'Administrador 001';
    switch (role) {
      case 'ADMIN_OC': return 'Administrador Global';
      case 'OPERADOR_SALA': return 'Coordenação Central';
      case 'ANALISTA_RISCO': return 'Análise de Risco';
      default: return role;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-slate-900 font-sans relative">
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden opacity-[0.03] select-none rotate-[-15deg]">
        <div className="flex flex-wrap gap-20 p-20 whitespace-nowrap text-4xl font-black">
          {Array(20).fill(`CONFIDENCIAL SSM PORTAL - ${currentUser.name} - ${new Date().toLocaleDateString()}`).join(' ')}
        </div>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={currentUser.role} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto pb-20">
            {activeTab !== 'profile' && activeTab !== 'settings' && activeTab !== 'accounts' && (
              <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg shadow-slate-900/10">
                      <User className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{getRoleDisplayName(currentUser.role, currentUser.id)}</span>
                    </div>
                    <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/10">
                      <span className="text-[10px] font-black uppercase tracking-widest">ID: {currentUser.id}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                      <ShieldCheck className="w-3.5 h-3.5" /> Sessão Segura
                    </div>
                  </div>
                  <h1 className="text-4xl font-black text-[#1E293B] tracking-tight font-corporate uppercase">
                    {activeTab === 'map' ? 'EMERGÊNCIA' : activeTab === 'protocols' ? 'TRIAGEM SSM' : activeTab === 'providers' ? 'GESTÃO SSM' : 'Centro de Comando'}
                  </h1>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-right min-w-[140px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status Conexão</p>
                  <p className="text-lg font-black text-emerald-600 font-mono tracking-tighter uppercase">Encriptada</p>
                </div>
              </header>
            )}
            
            {activeTab === 'dashboard' && <DashboardOverview incidents={filteredIncidents} onDispatch={handleGlobalDispatch} currentUser={currentUser} onUpdateIncident={handleUpdateIncident} />}
            {activeTab === 'map' && <ResourceManagement incidents={filteredIncidents} />}
            {activeTab === 'protocols' && <div className="space-y-12"><ProtocolAssistant onAddIncident={handleAddIncident} /><WorkflowSection /></div>}
            {activeTab === 'providers' && <AnalyticsDashboard currentUser={currentUser} />}
            
            {activeTab === 'profile' && (
              <UserProfileSettings 
                user={currentUser} 
                initialTab="perfil" 
                onUpdateUser={handleUpdateCurrentUser} 
                onClose={() => setActiveTab('dashboard')} 
              />
            )}
            {activeTab === 'settings' && (
              <UserProfileSettings 
                user={currentUser} 
                initialTab="definicoes" 
                onUpdateUser={handleUpdateCurrentUser} 
                onClose={() => setActiveTab('dashboard')} 
              />
            )}
            {activeTab === 'accounts' && (
              <AccountManagement 
                onClose={() => setActiveTab('dashboard')} 
              />
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @media print { .no-print { display: none; } }
      `}</style>
    </div>
  );
};

export default App;
