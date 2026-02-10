
import React, { useState, useEffect } from 'react';
import { ClipboardList, Stethoscope, Building2, Send, ArrowRight, ArrowLeft, Info, CheckCircle2, AlertCircle, Printer } from 'lucide-react';
import { ProtocolSuggestion, EmergencyPriority, EmergencyCase } from '../types';
import { PRIORITY_COLORS } from '../constants';

interface TriageData {
  company: string;
  patientName: string;
  age: string;
  location: string;
  contact: string;
}

interface ProtocolAssistantProps {
  onAddIncident?: (incident: EmergencyCase) => void;
  activeCall?: EmergencyCase | null;
}

const ProtocolAssistant: React.FC<ProtocolAssistantProps> = ({ onAddIncident, activeCall }) => {
  const [suggestion, setSuggestion] = useState<ProtocolSuggestion | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [triageData, setTriageData] = useState<TriageData>({ 
    company: 'Absa Bank Moçambique', 
    patientName: '', 
    age: '', 
    location: '', 
    contact: '' 
  });
  const [results, setResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeCall) {
      setTriageData(prev => ({
        ...prev,
        location: activeCall.locationName || '',
        company: activeCall.companyId ? 'Absa Bank Moçambique' : 'Empresa Cliente'
      }));
    }
  }, [activeCall]);

  const steps = [
    {
      id: 0,
      title: 'Identificação e Validação',
      description: 'Identificação da origem corporativa e dados do paciente.',
      questions: []
    },
    {
      id: 1,
      title: 'Discriminadores Críticos',
      description: 'Identificação de perigo imediato de vida.',
      priority: EmergencyPriority.CRITICAL,
      questions: [
        { id: 'q1_1', text: 'A pessoa está inconsciente ou desmaiou?' },
        { id: 'q1_2', text: 'Dispneia grave ou não consegue falar frases completas?' },
        { id: 'q1_3', text: 'Há dor no peito forte, opressiva ou irradiando?' },
        { id: 'q1_9', text: 'Há suspeita de AVC? (Boca torta, fraqueza, confusão)' }
      ]
    },
    {
      id: 2,
      title: 'Alto Risco',
      description: 'Sinais de gravidade elevada sem perigo imediato.',
      priority: EmergencyPriority.HIGH,
      questions: [
        { id: 'q2_2', text: 'Dispneia moderada (com ou sem chiados)?' },
        { id: 'q2_6', text: 'Dor torácica moderada (escala 4 – 7/10)?' },
        { id: 'q2_7', text: 'Fractura com exposição óssea?' }
      ]
    }
  ];

  const handleNextFlow = () => {
    if (currentStep > 0) {
      const currentQuestions = steps[currentStep].questions;
      const hasYes = currentQuestions.some(q => results[q.id]);
      
      if (hasYes) {
        const stepPriority = steps[currentStep].priority;
        setSuggestion({
          classification: stepPriority!,
          actionRequired: stepPriority === EmergencyPriority.CRITICAL ? 'EMERGÊNCIA - SAV/UCI' : 'URGENTE - Ambulância Básica',
          reasoning: `Classificação baseada em discriminadores positivos na Etapa ${currentStep}.`,
          suggestedResources: ['Acionamento SAV', 'Oxigénio', 'Monitorização']
        });
        setCurrentStep(5);
        return;
      }
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      setSuggestion({
        classification: EmergencyPriority.LOW,
        actionRequired: 'POUCO URGENTE',
        reasoning: 'Nenhum sinal de alerta crítico detectado.',
        suggestedResources: ['Encaminhamento Clínico']
      });
      setCurrentStep(5);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setResults({});
    setSuggestion(null);
  };

  const handleSubmitToOperations = () => {
    if (!suggestion || !onAddIncident) return;

    const newCase: EmergencyCase = {
      id: activeCall?.id || `SSM-TR-${Math.floor(Math.random() * 900) + 100}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: suggestion.actionRequired,
      locationName: triageData.location || 'Local Não Especificado',
      status: 'active',
      priority: suggestion.classification,
      coords: activeCall?.coords || [-25.9692, 32.5732],
      patientName: triageData.patientName,
      companyId: activeCall?.companyId || 'EXTERNAL'
    };

    onAddIncident(newCase);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm overflow-hidden relative">
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{activeCall ? 'Triagem em Chamada Activa' : 'Nova Triagem SSM'}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight font-corporate uppercase">
              Fluxograma de <br /> <span className="text-blue-600">Protocolos SSM</span>
            </h2>
          </div>
          {activeCall && (
            <div className="bg-red-50 border border-red-100 px-6 py-4 rounded-3xl flex items-center gap-4 animate-pulse">
               <AlertCircle className="w-6 h-6 text-red-600" />
               <div>
                  <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">Sinal SOS Recebido</p>
                  <p className="text-sm font-black text-slate-900">{activeCall.locationName}</p>
               </div>
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto w-full">
          {currentStep < 5 ? (
            <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-inner flex flex-col md:flex-row min-h-[500px]">
              <div className="w-full md:w-72 bg-white border-r border-slate-100 p-8 shrink-0">
                <div className="space-y-6">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className={`flex items-center gap-4 transition-all ${currentStep === idx ? 'opacity-100 scale-105' : 'opacity-40 grayscale'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${currentStep === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {idx}
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-tighter ${currentStep === idx ? 'text-blue-600' : 'text-slate-700'}`}>Passo {idx}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-10 flex flex-col">
                <div className="mb-10">
                  <h3 className="text-2xl font-black text-slate-900 font-corporate uppercase tracking-tight">{steps[currentStep]?.title || 'Triagem'}</h3>
                  <p className="text-sm font-medium text-slate-500 mt-2">{steps[currentStep]?.description}</p>
                </div>

                <div className="flex-1 space-y-6">
                  {currentStep === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa Solicitante</label>
                        <input type="text" className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-6 py-4 text-sm font-black text-blue-900 outline-none" value={triageData.company} readOnly />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Doente</label>
                        <input type="text" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-black focus:border-blue-600 outline-none" value={triageData.patientName} onChange={e => setTriageData({...triageData, patientName: e.target.value})} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local Exacto do Evento</label>
                        <input type="text" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-black focus:border-blue-600 outline-none" value={triageData.location} onChange={e => setTriageData({...triageData, location: e.target.value})} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {steps[currentStep].questions.map(q => (
                        <div key={q.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <span className="text-sm font-bold text-slate-700">{q.text}</span>
                          <div className="flex gap-2">
                            <button onClick={() => setResults({...results, [q.id]: true})} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${results[q.id] === true ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Sim</button>
                            <button onClick={() => setResults({...results, [q.id]: false})} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${results[q.id] === false ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Não</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-200">
                  <button onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)} disabled={currentStep === 0} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all"><ArrowLeft className="w-4 h-4" /> Anterior</button>
                  <button onClick={handleNextFlow} className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-3">Continuar <ArrowRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-[3rem] p-12 shadow-xl animate-in zoom-in-95">
              <div className="text-center mb-10">
                 <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 ${PRIORITY_COLORS[suggestion!.classification]}`}>
                    <span className="text-5xl font-black font-corporate">{suggestion!.classification}</span>
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 font-corporate uppercase tracking-tight">{suggestion!.actionRequired}</h3>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Parecer Técnico Final</p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6 mb-10">
                 <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paciente</p>
                      <p className="text-sm font-black text-slate-900">{triageData.patientName || 'Não Informado'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Localização</p>
                      <p className="text-sm font-black text-slate-900">{triageData.location}</p>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> Orientações</h4>
                    <div className="space-y-2">
                       {suggestion?.suggestedResources.map((res, i) => (
                         <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-slate-700 uppercase">{res}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={handleReset} className="flex-1 py-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Nova Triagem</button>
                 <button onClick={handleSubmitToOperations} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all">
                    <Send className="w-4 h-4" /> Submeter para Operações
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProtocolAssistant;
