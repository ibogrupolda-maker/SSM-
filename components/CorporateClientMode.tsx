
import React, { useState, useEffect } from 'react';
import { Siren, Phone, MapPin, ShieldCheck, Activity, X, LogOut, Heart, Bell, ShieldAlert } from 'lucide-react';
import SSMLogo from './SSMLogo';
import { COMPANIES } from '../constants';

interface CorporateClientModeProps {
  onTriggerEmergency: () => void;
  onLogout: () => void;
  adminName: string;
  companyId?: string;
}

const CorporateClientMode: React.FC<CorporateClientModeProps> = ({ 
  onTriggerEmergency, 
  onLogout, 
  adminName, 
  companyId 
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const company = COMPANIES.find(c => c.id === companyId);

  const handleTrigger = () => {
    setIsActivating(true);
    setTimeout(() => {
      onTriggerEmergency();
      setIsActivating(false);
      setEmergencyTriggered(true);
      setIsCallActive(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-100 p-6 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border-2 border-slate-50 shadow-md">
            <SSMLogo className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight font-corporate">Portal Corporativo SSM</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistema Operacional • {company?.name || 'Cliente Corporativo'}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="p-3 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-2xl transition-all active:scale-95"
          title="Sair"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-lg space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-red-50 px-4 py-1.5 rounded-full border border-red-100 animate-pulse">
               <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
               <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Acionamento Direto Command Center</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase font-corporate">Centro de Emergência</h2>
            <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              O acionamento notifica instantaneamente o **Centro de Comando Administrativo**. Um operador entrará em contacto imediato.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              disabled={isActivating || emergencyTriggered}
              onClick={handleTrigger}
              className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full flex flex-col items-center justify-center transition-all duration-500 border-[16px] shadow-[0_25px_50px_-12px_rgba(239,68,68,0.3)] active:scale-90 select-none group ${
                emergencyTriggered 
                  ? 'bg-emerald-600 border-emerald-100 text-white cursor-default shadow-emerald-500/20' 
                  : 'bg-red-600 border-red-100 text-white hover:bg-red-700'
              }`}
            >
              {isActivating ? (
                <div className="flex flex-col items-center gap-4">
                  <Activity className="w-16 h-16 animate-pulse" />
                  <span className="text-sm font-black uppercase tracking-[0.2em] animate-bounce">Ativando...</span>
                </div>
              ) : emergencyTriggered ? (
                <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                  <ShieldCheck className="w-20 h-20" />
                  <div className="text-center">
                    <span className="block text-sm font-black uppercase tracking-[0.2em]">EMERGÊNCIA</span>
                    <span className="block text-sm font-black uppercase tracking-[0.2em]">CONFIRMADA</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping group-hover:animate-none group-active:animate-none"></div>
                  <Siren className="w-24 h-24 md:w-32 md:h-32 mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] font-corporate">EMERGÊNCIA</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Localização</p>
                <p className="text-xs font-black text-slate-900">Maputo Central</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Canal Coordenação</p>
                <p className="text-xs font-black text-slate-900">Seguro</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CHAMADA COM CENTRO DE COMANDO ADMINISTRATIVO */}
      {isCallActive && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border border-slate-200">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl relative z-10 border-4 border-white">
                <Phone className="w-10 h-10" />
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 uppercase font-corporate tracking-tight mb-2">Conectando...</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Centro de Comando Digital (Coordenação)</p>
            
            <div className="space-y-4 w-full">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-start gap-4 text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-slate-700 uppercase leading-relaxed tracking-wider">
                  Este canal liga-o exclusivamente ao operador de sala para suporte clínico e despacho de recursos.
                </p>
              </div>

              <button 
                onClick={() => { setIsCallActive(false); setEmergencyTriggered(false); }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all"
              >
                Cancelar Chamada
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="p-8 border-t border-slate-100 flex items-center justify-center gap-8 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordenação Administrativa Ativa</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo Médica Governação SSM</span>
        </div>
      </footer>
    </div>
  );
};

export default CorporateClientMode;
