
import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Siren, 
  Users, 
  Settings, 
  LogOut
} from 'lucide-react';
import SSMLogo from './SSMLogo';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, onLogout }) => {
  const allMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'CENTRO DE COMANDO DIGITAL', roles: ['ADMIN_OC', 'OPERADOR_SALA', 'ANALISTA_RISCO'] },
    { id: 'protocols', icon: ClipboardList, label: 'TRIAGEM SSM', roles: ['ADMIN_OC', 'OPERADOR_SALA'] },
    { id: 'map', icon: Siren, label: 'EMERGÊNCIA', roles: ['ADMIN_OC', 'OPERADOR_SALA'] },
    { id: 'providers', icon: Users, label: 'GESTÃO SSM', roles: ['ADMIN_OC', 'ANALISTA_RISCO'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-950 text-slate-400 flex flex-col h-screen sticky top-0 border-r border-slate-800">
      <div className="p-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <SSMLogo className="w-10 h-10 drop-shadow-md" />
          <span className="text-2xl font-black text-white tracking-tight font-corporate">SSM</span>
        </div>
        <div className="px-1 border-l-2 border-blue-500/30 pl-3 py-0.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-tight font-corporate">
            Safety & Security
          </p>
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em] leading-tight font-corporate">
            Medical
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isEmergencyItem = item.id === 'map';
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                isActive 
                  ? (isEmergencyItem ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20')
                  : (isEmergencyItem ? 'bg-red-500/5 text-red-500 hover:bg-red-500/10 border border-red-500/10' : 'hover:bg-slate-900 hover:text-slate-200')
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isEmergencyItem && !isActive ? 'animate-pulse text-red-500' : ''}`} />
              <span className={`leading-tight ${isEmergencyItem ? 'font-corporate font-black' : ''} ${isEmergencyItem && !isActive ? 'text-red-500 brightness-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]' : ''}`}>
                {item.label}
              </span>
              {isEmergencyItem && !isActive && (
                <span className="ml-auto flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-900 hover:text-slate-200 transition-all">
          <Settings className="w-5 h-5" />
          Configurações
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
