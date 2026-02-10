
import React, { useState } from 'react';
import { FileText, CheckCircle2, Shield, Printer, ArrowRight, ArrowLeft, AlertCircle, Info, ClipboardList, Stethoscope, Building2, Send } from 'lucide-react';
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
}

const ProtocolAssistant: React.FC<ProtocolAssistantProps> = ({ onAddIncident }) => {
  const [suggestion, setSuggestion] = useState<ProtocolSuggestion | null>(null);
  
  // Structured Flow State
  const [currentStep, setCurrentStep] = useState(0);
  const [triageData, setTriageData] = useState<TriageData>({ 
    company: 'Absa Bank Moçambique', 
    patientName: '', 
    age: '', 
    location: '', 
    contact: '' 
  });
  const [results, setResults] = useState<Record<string, boolean>>({});

  const steps = [
    {
      id: 0,
      title: 'Validação Mínima (Etapa 0)',
      description: 'Identificação da origem corporativa e dados do paciente.',
      questions: []
    },
    {
      id: 1,
      title: 'Discriminadores Críticos (Etapa 1)',
      description: 'Identificação de perigo imediato de vida.',
      priority: EmergencyPriority.CRITICAL,
      questions: [
        { id: 'q1_1', text: 'A pessoa está inconsciente ou desmaiou?' },
        { id: 'q1_2', text: 'Dispneia grave ou não consegue falar frases completas?' },
        { id: 'q1_3', text: 'Há dor no peito forte, opressiva ou irradiando?' },
        { id: 'q1_4', text: 'Há/houve convulsão ou confusão súbita?' },
        { id: 'q1_5', text: 'Existe hemorragia activa que não para com compressão?' },
        { id: 'q1_6', text: 'Sofreu trauma grave na cabeça?' },
        { id: 'q1_7', text: 'Sofreu trauma grave no tórax/abdómen?' },
        { id: 'q1_8', text: 'Queda >2 m, esmagamento, explosão ou electrocussão?' },
        { id: 'q1_9', text: 'Há suspeita de AVC? (Boca torta, fraqueza de um lado, confusão)' }
      ]
    },
    {
      id: 2,
      title: 'Discriminadores de Alto Risco (Etapa 2)',
      description: 'Sinais de gravidade elevada sem perigo imediato.',
      priority: EmergencyPriority.HIGH,
      questions: [
        { id: 'q2_1', text: 'Está consciente, mas sonolento?' },
        { id: 'q2_2', text: 'Dispneia moderada (com ou sem chiados)?' },
        { id: 'q2_3', text: 'Trauma na cabeça sem perda de consciência?' },
        { id: 'q2_4', text: 'Trauma torácico sem dispneia?' },
        { id: 'q2_5', text: 'Trauma abdominal sem perfuração?' },
        { id: 'q2_6', text: 'Dor torácica moderada (escala 4 – 7/10)?' },
        { id: 'q2_7', text: 'Fractura com exposição óssea?' },
        { id: 'q2_8', text: 'Queimadura extensa (mãos, pés, face ou genitália)?' },
        { id: 'q2_9', text: 'Confusão mental com ou sem febre alta?' }
      ]
    },
    {
      id: 3,
      title: 'Urgência Estável (Etapa 3)',
      description: 'Condições que requerem avaliação mas estão estáveis.',
      priority: EmergencyPriority.MODERATE,
      questions: [
        { id: 'q3_1', text: 'Cefaleia intensa sem perda de força ou confusão mental?' },
        { id: 'q3_2', text: 'Fractura sem exposição óssea?' },
        { id: 'q3_3', text: 'Entorse ou deslocamento ósseo?' },
        { id: 'q3_4', text: 'Cefaleia intensa?' },
        { id: 'q3_5', text: 'Mal-estar geral persistente?' },
        { id: 'q3_6', text: 'Pequenas queimaduras?' },
        { id: 'q3_7', text: 'Reacção alérgica moderada?' }
      ]
    },
    {
      id: 4,
      title: 'Baixa Prioridade (Etapa 4)',
      description: 'Queixas ligeiras sem sinais de alarme.',
      priority: EmergencyPriority.LOW,
      questions: [
        { id: 'q4_1', text: 'Ferimentos superficiais?' },
        { id: 'q4_2', text: 'Dor Lombar?' },
        { id: 'q4_3', text: 'Pequenos acidentes sem trauma significativo?' },
        { id: 'q4_4', text: 'Vómitos com ou sem diarreia?' }
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
          actionRequired: stepPriority === EmergencyPriority.CRITICAL ? 'EMERGÊNCIA - SAV/UCI' : stepPriority === EmergencyPriority.HIGH ? 'MUITO URGENTE - SAV/UCI' : stepPriority === EmergencyPriority.MODERATE ? 'URGENTE - Ambulância Básica' : 'POUCO URGENTE - Veículo não médico',
          reasoning: `Classificação atribuída por discriminador positivo na Etapa ${currentStep} do Protocolo de Triagem SSM.`,
          suggestedResources: stepPriority === EmergencyPriority.CRITICAL || stepPriority === EmergencyPriority.HIGH ? ['Acionamento SAV', 'Oxigénio', 'Monitorização Contínua'] : ['Ambulância Básica', 'Atendimento no Local']
        });
        setCurrentStep(5);
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setSuggestion({
        classification: EmergencyPriority.LOW,
        actionRequired: 'NÃO URGENTE (AZUL)',
        reasoning: 'Nenhum discriminador de urgência detectado durante o fluxograma de triagem telefónica.',
        suggestedResources: ['Acompanhamento Telefónico', 'Encaminhamento para Clínica de Rede']
      });
      setCurrentStep(5);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setResults({});
    setSuggestion(null);
    setTriageData({ 
      company: 'Absa Bank Moçambique', 
      patientName: '', 
      age: '', 
      location: '', 
      contact: '' 
    });
  };

  const handleSubmitToOperations = () => {
    if (!suggestion || !onAddIncident) return;

    const newCase: EmergencyCase = {
      id: `SSM-MZ-${Math.floor(Math.random() * 900) + 100}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: suggestion.actionRequired,
      locationName: triageData.location || 'Local Não Especificado',
      status: 'active',
      priority: suggestion.classification,
      coords: [-25.9692 + (Math.random() - 0.5) * 0.01, 32.5732 + (Math.random() - 0.5) * 0.01],
      patientName: triageData.patientName,
      companyId: 'ABSA',
      employeeId: 'EXTERNAL'
    };

    onAddIncident(newCase);
    alert('Caso submetido com sucesso para as operações em tempo-real.');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Plataforma de Triagem SSM</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight font-corporate uppercase">
              Protocolo de <br /> <span className="text-blue-600">Triagem SSM</span>
            </h2>
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full">
          {currentStep < 5 ? (
            <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-inner flex flex-col md:flex-row min-h-[500px]">
              {/* Stepper Sidebar */}
              <div className="w-full md:w-72 bg-white border-r border-slate-100 p-8 shrink-0">
                <div className="space-y-6">
                  {steps.map((step, idx) => (
                    <div key={idx} className={`flex items-center gap-4 transition-all ${currentStep === idx ? 'opacity-100 scale-105' : 'opacity-40 grayscale'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${currentStep === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {idx}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Passo</p>
                        <p className={`text-[10px] font-black uppercase tracking-tighter truncate ${currentStep === idx ? 'text-blue-600' : 'text-slate-700'}`}>
                          {step.title.split(' (')[0]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Area */}
              <div className="flex-1 p-10 flex flex-col animate-in slide-in-from-right-4">
                <div className="mb-10">
                  <h3 className="text-2xl font-black text-slate-900 font-corporate uppercase tracking-tight">{steps[currentStep].title}</h3>
                  <p className="text-sm font-medium text-slate-500 mt-2">{steps[currentStep].description}</p>
                </div>

                <div className="flex-1 space-y-6">
                  {currentStep === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-blue-600" /> Empresa Solicitante (Auto-preenchido)
                        </label>
                        <input 
                          type="text" 
                          className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-6 py-4 text-sm font-black text-blue-900 focus:border-blue-600 outline-none shadow-inner"
                          placeholder="Nome da Empresa"
                          value={triageData.company}
                          readOnly
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Doente</label>
                        <input 
                          type="text" 
                          className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-black focus:border-blue-600 outline-none"
                          placeholder="Nome Completo"
                          value={triageData.patientName}
                          onChange={e => setTriageData({...triageData, patientName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Idade</label>
                        <input 
                          type="text" 
                          className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-black focus:border-blue-600 outline-none"
                          placeholder="Ex: 34"
                          value={triageData.age}
                          onChange={e => setTriageData({...triageData, age: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local Exacto do Evento</label>
                        <input 
                          type="text" 
                          className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-black focus:border-blue-600 outline-none"
                          placeholder="Andar, Sala, Referência..."
                          value={triageData.location}
                          onChange={e => setTriageData({...triageData, location: e.target.value})}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {steps[currentStep].questions.map(q => (
                        <div key={q.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all">
                          <span className="text-sm font-bold text-slate-700">{q.text}</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setResults({...results, [q.id]: true})}
                              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${results[q.id] === true ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                              Sim
                            </button>
                            <button 
                              onClick={() => setResults({...results, [q.id]: false})}
                              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${results[q.id] === false ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                              Não
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-200">
                  <button 
                    onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button 
                    onClick={handleNextFlow}
                    className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-3"
                  >
                    {currentStep === 0 ? 'Iniciar Fluxograma' : 'Continuar Triagem'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* RESULT VIEW */
            <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-[3rem] p-12 shadow-xl animate-in zoom-in-95">
              <div className="text-center mb-10">
                 <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 ${PRIORITY_COLORS[suggestion!.classification]}`}>
                    <span className="text-5xl font-black font-corporate">{suggestion!.classification}</span>
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 font-corporate uppercase tracking-tight">{suggestion!.actionRequired}</h3>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Classificação Final de Triagem</p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-8 mb-10">
                 <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa</p>
                      <p className="text-sm font-black text-blue-600">{triageData.company}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paciente</p>
                      <p className="text-sm font-black text-slate-900">{triageData.patientName || 'Não Informado'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Localização</p>
                      <p className="text-sm font-black text-slate-900">{triageData.location || 'Não Informada'}</p>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> Orientações Imediatas</h4>
                    <div className="grid grid-cols-1 gap-3">
                       {suggestion?.suggestedResources.map((res, i) => (
                         <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{res}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
                      "Nunca baixar prioridade após subida". Manter observação contínua até chegada do meio.
                    </p>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                 <button onClick={handleReset} className="flex-1 py-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Nova Triagem</button>
                 <button 
                  onClick={handleSubmitToOperations}
                  className="flex-1 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all"
                 >
                    <Send className="w-4 h-4" /> Submeter para Operações
                 </button>
                 <button className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                    <Printer className="w-4 h-4" /> Imprimir Guia
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
