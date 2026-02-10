
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Fingerprint, Loader2, AlertCircle, Smartphone, Key, Mail, UserPlus, Building2, ArrowLeft, Send, User, Globe, MapPin, ChevronRight, CheckCircle2, ShieldAlert, Phone } from 'lucide-react';
import SSMLogo from './SSMLogo';
import { ADMINS } from '../constants';
import { AdminUser } from '../types';
import { auditLogger } from '../services/auditLogger';

interface LoginProps {
  onLoginSuccess: (user: AdminUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'activate' | 'welcome'>('login');
  const [step, setStep] = useState<'form' | 'checking' | '2fa' | 'success'>('form');
  const [identityInput, setIdentityInput] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<{msg: string, code?: string} | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDetectedLocation('IP: 197.249.1.xxx (Canal Encriptado SSM)');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityInput.trim() || !password) {
      setError({ msg: 'Introduza a sua Identidade de Acesso (E-mail, Username ou ID) e palavra-passe.' });
      return;
    }
    
    setError(null);
    setStep('checking');
    
    setTimeout(() => {
      const user = (ADMINS as any[]).find(u => 
        u.id.toLowerCase() === identityInput.toLowerCase().trim() || 
        u.email.toLowerCase() === identityInput.toLowerCase().trim() ||
        u.username?.toLowerCase() === identityInput.toLowerCase().trim()
      );

      // Validação de password para ADM-001 (Simulação de sistema real)
      if (user?.id === 'ADM-001' && password !== user.password) {
         setStep('form');
         setError({ msg: 'Palavra-passe incorreta para Administrador 001.' });
         return;
      }

      if (!user) {
        setStep('form');
        setError({ 
          msg: 'Credenciais de acesso inválidas ou conta não autorizada.', 
          code: identityInput.startsWith('ADM') ? 'AUTH_ERR_401' : undefined 
        });
        return;
      }

      setAuthenticatedUser(user);

      if (user.isFirstAccess) {
        setView('activate');
        setStep('form');
      } else if (user.role === 'ADMIN_OC' || user.role === 'OPERADOR_SALA') {
        setStep('2fa');
      } else {
        showWelcome(user);
      }
    }, 1500);
  };

  const showWelcome = (user: AdminUser) => {
    setView('welcome');
    setStep('success');
    auditLogger.log(user, 'LOGIN_SUCCESS');
    setTimeout(() => onLoginSuccess(user), 2500);
  };

  const handleActivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError({ msg: 'As palavras-passe não coincidem.' });
      return;
    }
    if (newPassword.length < 8) {
      setError({ msg: 'A palavra-passe deve ter pelo menos 8 caracteres.' });
      return;
    }
    
    setStep('checking');
    setTimeout(() => {
      if (authenticatedUser) {
        const updatedUser = { ...authenticatedUser, isFirstAccess: false };
        showWelcome(updatedUser);
      }
    }, 1800);
  };

  const handlePartnerRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('checking');
    setTimeout(() => {
      setView('login');
      setStep('form');
      alert('Solicitação enviada com sucesso! A equipa SSM entrará em contacto após a avaliação técnica do perfil corporativo.');
    }, 2000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const getRoleLabel = (user: AdminUser) => {
    if (user.id === 'ADM-001') return 'Administrador 001';
    if (user.role === 'AMBULANCIA') return 'Equipa de Unidade Móvel';
    if (user.role === 'EMPRESA_CLIENTE') return 'Gestor Corporativo';
    if (user.role === 'OPERADOR_SALA') return 'Operador de Coordenação';
    return 'Analista SSM';
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans selection:bg-blue-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-[3rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] overflow-hidden">
          
          <div className="p-10 pb-8 text-center bg-slate-50/50 border-b border-slate-100 relative">
            {detectedLocation && (
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100 shadow-sm animate-in slide-in-from-top-2">
                  <Globe className="w-2.5 h-2.5" /> {detectedLocation}
                </div>
              </div>
            )}
            
            <div className="flex justify-center mt-4 mb-6">
              <div className="w-16 h-16 bg-slate-950 rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-slate-800 transition-transform duration-500 hover:scale-105">
                <SSMLogo className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-corporate uppercase leading-tight">
              {view === 'login' && 'SISTEMA DE EMERGÊNCIA SSM'}
              {view === 'activate' && 'ATIVAR CONTA CORPORATIVA'}
              {view === 'signup' && 'SOLICITAR PARCERIA SSM'}
              {view === 'welcome' && 'ACESSO AUTORIZADO'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Comando Digital & Governação Médica</p>
          </div>

          <div className="p-10">
            {step === 'form' && view === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[11px] font-bold flex flex-col gap-1 animate-in shake">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {error.msg}
                    </div>
                    {error.code && <span className="text-[9px] font-black opacity-40 ml-6">ERRO_SISTEMA: {error.code}</span>}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identidade de Acesso</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="text"
                      value={identityInput}
                      onChange={(e) => setIdentityInput(e.target.value)}
                      placeholder="ID, E-mail ou Username"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Palavra-passe</label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-slate-950/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Fingerprint className="w-5 h-5" /> Autenticar Sessão
                </button>

                <div className="text-center pt-2 flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Problemas? <button type="button" onClick={() => setView('forgot')} className="text-blue-600 font-black hover:underline">Recuperar PIN</button>
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Não é parceiro? <button type="button" onClick={() => setView('signup')} className="text-blue-600 font-black hover:underline">Solicitar Acesso / Tornar-se Cliente</button>
                  </p>
                </div>
              </form>
            )}

            {view === 'activate' && step === 'form' && (
              <form onSubmit={handleActivation} className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide leading-relaxed">
                    Primeiro Acesso Detectado: Defina a sua palavra-passe para ativar a conta corporativa SSM.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Palavra-passe</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-black outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Palavra-passe</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-black outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                  Ativar Conta <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            {view === 'signup' && (
              <form onSubmit={handlePartnerRequest} className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="text-center">
                   <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><Building2 className="w-8 h-8" /></div>
                   <h3 className="text-lg font-black text-slate-900 uppercase font-corporate tracking-tight">Tornar-se Membro SSM</h3>
                   <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed px-4">Solicite a adesão da sua empresa à plataforma de governação médica.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nome da Organização</label>
                    <input type="text" placeholder="Ex: Banco Central" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-black focus:border-blue-600" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Contacto Telefónico</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="tel" placeholder="+258..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-black focus:border-blue-600" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">E-mail Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="email" placeholder="gestao@empresa.co.mz" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-black focus:border-blue-600" required />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
                  Enviar Solicitação <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
                <button onClick={() => setView('login')} type="button" className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">
                  Voltar ao Login
                </button>
              </form>
            )}

            {step === 'checking' && (
              <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-[6px] border-blue-100 rounded-full"></div>
                  <div className="absolute inset-0 border-[6px] border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  <ShieldCheck className="absolute inset-0 m-auto w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase font-corporate tracking-tight">Encriptando Sessão</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-5 animate-pulse">Integridade TLS v1.3...</p>
              </div>
            )}

            {step === '2fa' && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase font-corporate tracking-tight">Verificação em 2 Passos</h3>
                  <p className="text-xs font-medium text-slate-400 mt-3 leading-relaxed px-4">
                    Código de segurança enviado para o dispositivo móvel corporativo de {authenticatedUser?.name.split(' ')[0]}.
                  </p>
                </div>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input 
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-12 h-14 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-black text-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all"
                    />
                  ))}
                </div>
                <button 
                  onClick={() => showWelcome(authenticatedUser!)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Confirmar <Key className="w-4 h-4" />
                </button>
              </div>
            )}

            {view === 'welcome' && (
              <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-90 duration-700">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-8 scale-110 relative">
                  <div className="absolute inset-0 bg-emerald-500 rounded-[2rem] animate-ping opacity-20"></div>
                  <ShieldCheck className="w-12 h-12 relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase font-corporate tracking-tight">Bem-vindo, {authenticatedUser?.id === 'ADM-001' ? 'ADMIN 001' : (authenticatedUser?.role === 'AMBULANCIA' ? 'Equipa Ambulância' : authenticatedUser?.name.split(' ')[0])}</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3 flex items-center gap-2 justify-center">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> {getRoleLabel(authenticatedUser!)}
                </p>
                <div className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">Sessão Persistente SSM Ativada</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest font-corporate">SEGURANÇA SSM</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest font-corporate">AES-256 Bit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
