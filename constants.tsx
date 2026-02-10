
import { Company, Employee, WorkflowStep, EmergencyPriority, Resource, AdminUser, ActivityLog } from './types';

export const PRIORITY_COLORS: Record<EmergencyPriority, string> = {
  [EmergencyPriority.LOW]: 'bg-emerald-500 text-white',
  [EmergencyPriority.MODERATE]: 'bg-yellow-400 text-slate-900',
  [EmergencyPriority.HIGH]: 'bg-orange-500 text-white',
  [EmergencyPriority.CRITICAL]: 'bg-red-600 text-white',
};

export const ADMINS: (AdminUser & { password?: string })[] = [
  { 
    id: 'ADM-001', 
    name: 'Marina Sengo', 
    username: 'marina.sengo',
    email: 'marina.sengo@ssm.co.mz',
    password: '123456',
    phone: '+258 84 000 0001',
    address: 'Av. Julius Nyerere, Maputo',
    dob: '1985-05-15',
    gender: 'F',
    idDocument: '110203456789M',
    role: 'ADMIN_OC', 
    avatar: 'https://ui-avatars.com/api/?name=Marina+Sengo&background=1E40AF&color=fff', 
    initials: 'MS',
    isFirstAccess: false,
    preferences: {
      language: 'Português (PT)',
      timezone: 'Maputo (GMT+2)',
      theme: 'claro',
      notifications: { email: true, sms: true, whatsapp: true, push: true, frequency: 'imediata' }
    }
  },
  { 
    id: 'OP-002', 
    name: 'Ricardo Tembe', 
    username: 'ricardo.tembe',
    email: 'ricardo.tembe@ssm.co.mz',
    phone: '+258 82 000 0002',
    address: 'Bairro Central, Maputo',
    dob: '1990-11-20',
    gender: 'M',
    idDocument: '020304567890B',
    role: 'OPERADOR_SALA', 
    avatar: 'https://ui-avatars.com/api/?name=Ricardo+Tembe&background=0F172A&color=fff', 
    initials: 'RT',
    isFirstAccess: false,
    preferences: {
      language: 'Português (PT)',
      timezone: 'Maputo (GMT+2)',
      theme: 'claro',
      notifications: { email: true, sms: false, whatsapp: true, push: true, frequency: 'imediata' }
    }
  },
  { 
    id: 'ANL-003', 
    name: 'Elsa Mondlane', 
    username: 'elsa.m', 
    email: 'elsa.m@ssm.co.mz', 
    phone: '+258 85 000 0003', 
    address: 'Sommerschield, Maputo', 
    dob: '1988-03-10', 
    gender: 'F', 
    idDocument: '081234455667F', 
    role: 'ANALISTA_RISCO', 
    avatar: 'https://ui-avatars.com/api/?name=Elsa+Mondlane&background=4F46E5&color=fff', 
    initials: 'EM',
    isFirstAccess: true 
  },
  { id: 'AMB-001', name: 'João Condestável', username: 'joao.condestavel', email: 'joao.c@ssm.co.mz', phone: '+258 87 000 0004', address: 'Matola, MZ', dob: '1982-07-25', gender: 'M', idDocument: '090807060504P', role: 'AMBULANCIA', avatar: 'https://ui-avatars.com/api/?name=Joao+Ambulancia&background=EF4444&color=fff', initials: 'JC' },
  { id: 'CLI-001', name: 'Gestor Absa', username: 'gestor.absa', email: 'emergencia@absa.co.mz', phone: '+258 21 000 000', address: 'Torre Absa, Maputo', dob: '1980-01-01', gender: 'Outro', idDocument: 'ENT-ABSA-001', role: 'EMPRESA_CLIENTE', avatar: 'https://ui-avatars.com/api/?name=Absa+Bank&background=bf0000&color=fff', initials: 'GB', companyId: 'ABSA' },
];

export const ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'LOG-001', adminId: 'ADM-001', adminName: 'Marina Sengo', action: 'Despacho de Ambulância', timestamp: '12:45:10', details: 'Caso #SSM-MZ-001 despachado para Torre Absa.', type: 'emergency' },
  { id: 'LOG-002', adminId: 'OP-002', adminName: 'Ricardo Tembe', action: 'Atendimento de Chamada', timestamp: '12:30:05', details: 'Atendimento via vídeo para ocorrência no ISCTEM.', type: 'emergency' },
  { id: 'LOG-003', adminId: 'ADM-001', adminName: 'Marina Sengo', action: 'Atualização de Protocolo', timestamp: '11:20:00', details: 'Protocolo de AVC atualizado para versão 2026.1.', type: 'protocol' },
  { id: 'LOG-004', adminId: 'ANL-003', adminName: 'Elsa Mondlane', action: 'Login no Sistema', timestamp: '09:00:15', details: 'Acesso via terminal Comando Central Maputo.', type: 'auth' },
];

export const COMPANIES: Company[] = [
  { id: 'ABSA', name: 'Absa Bank Moçambique', logo: 'https://ui-avatars.com/api/?name=Absa+Bank&background=bf0000&color=fff', color: '#bf0000' },
  { id: 'LETSHEGO', name: 'Banco Letshego', logo: 'https://ui-avatars.com/api/?name=Letshego&background=ffcc00&color=000', color: '#ffcc00' },
  { id: 'NEDBANK', name: 'Nedbank Moçambique', logo: 'https://ui-avatars.com/api/?name=Nedbank&background=006633&color=fff', color: '#006633' },
  { id: 'AISM', name: 'AISM Maputo', logo: 'https://ui-avatars.com/api/?name=AISM&background=003366&color=fff', color: '#003366' },
  { id: 'ISCTEM', name: 'ISCTEM', logo: 'https://ui-avatars.com/api/?name=ISCTEM&background=e21d24&color=fff', color: '#e21d24' },
  { id: 'UNITIVA', name: 'Universidade UNITIVA', logo: 'https://ui-avatars.com/api/?name=UNITIVA&background=2c3e50&color=fff', color: '#2c3e50' },
];

export const EMPLOYEES: Employee[] = [
  {
    id: 'EMP-001',
    companyId: 'ABSA',
    name: 'António Mucavele',
    bi: '110203456789M',
    age: 34,
    sex: 'M',
    bloodType: 'A+',
    insurer: 'Hollard Moçambique',
    policyNumber: 'H-ABSA-9821',
    policyValidity: '31/12/2025',
    emergencyContact: { name: 'Maria Mucavele', relation: 'Esposa', phone: '+258 84 123 4567' },
    allergies: ['Penicilina']
  },
  {
    id: 'EMP-002',
    companyId: 'LETSHEGO',
    name: 'Sónia Mondlane',
    bi: '020198765432F',
    age: 28,
    sex: 'F',
    bloodType: 'O-',
    insurer: 'MCS - Medical Care Services',
    policyNumber: 'MCS-LET-4421',
    policyValidity: '15/08/2025',
    emergencyContact: { name: 'João Mondlane', relation: 'Pai', phone: '+258 82 987 6543' }
  },
  {
    id: 'EMP-003',
    companyId: 'AISM',
    name: 'David Thompson',
    bi: 'INT-USA-554433',
    age: 45,
    sex: 'M',
    bloodType: 'B+',
    insurer: 'Cigna Global',
    policyNumber: 'CG-AISM-001',
    policyValidity: '01/01/2026',
    emergencyContact: { name: 'Sarah Thompson', relation: 'Esposa', phone: '+258 85 555 1234' }
  },
  {
    id: 'EMP-004',
    companyId: 'ISCTEM',
    name: 'Dra. Elsa Tembe',
    bi: '081234455667F',
    age: 52,
    sex: 'F',
    bloodType: 'AB+',
    insurer: 'EMOSE',
    policyNumber: 'EM-ISC-8890',
    policyValidity: '10/10/2025',
    emergencyContact: { name: 'Pedro Tembe', relation: 'Filho', phone: '+258 84 000 9988' }
  }
];

export const RESOURCES: Resource[] = [
  {
    id: 'RES-001',
    name: 'Ambulância Alpha-1',
    type: 'Suporte Avançado de Vida',
    category: 'ambulance',
    status: 'available',
    location: 'Maputo, MZ',
    capacity: '2 pacientes',
    equipment: ['Equipamento ALS'],
    eta: '5 mins'
  },
  {
    id: 'RES-002',
    name: 'Ambulância Beta-2',
    type: 'Suporte Básico de Vida',
    category: 'ambulance',
    status: 'assigned',
    location: 'Matola, MZ',
    capacity: '2 pacientes',
    equipment: ['Equipamento BLS'],
    eta: '12 mins',
    currentAssignment: 'CASE-2024-0178 - Emergência Cardíaca na Av. 24 de Julho'
  },
  {
    id: 'RES-003',
    name: 'Hospital Geral da Polana',
    type: 'Centro de Trauma Nível 1',
    category: 'hospital',
    status: 'available',
    location: 'Polana, Maputo',
    capacity: '8 camas de emergência',
    equipment: ['Sala de Trauma Completa']
  },
  {
    id: 'RES-004',
    name: 'Ambulância Gamma-3',
    type: 'Transporte de Cuidados Críticos',
    category: 'ambulance',
    status: 'offline',
    location: 'Xai-Xai, MZ',
    capacity: '1 paciente',
    equipment: ['Equipamento CCT']
  },
  {
    id: 'RES-005',
    name: 'Equipa de Resposta Alpha',
    type: 'Equipa de Paramédicos',
    category: 'team',
    status: 'available',
    location: 'Beira, MZ',
    capacity: '4 membros',
    equipment: ['Kit de Resposta Móvel']
  },
  {
    id: 'RES-006',
    name: 'Centro Médico da Matola',
    type: 'Centro de Trauma Nível 2',
    category: 'hospital',
    status: 'available',
    location: 'Matola, MZ',
    capacity: '6 camas de emergência',
    equipment: ['Suíte Avançada de ER']
  },
  {
    id: 'RES-007',
    name: 'Ambulância Delta-4',
    type: 'Suporte Básico de Vida',
    category: 'ambulance',
    status: 'maintenance',
    location: 'Nampula, MZ',
    capacity: '2 pacientes',
    equipment: ['Equipamento BLS']
  },
  {
    id: 'RES-008',
    name: 'Equipa de Resposta Beta',
    type: 'Equipa EMT',
    category: 'team',
    status: 'assigned',
    location: 'Tete, MZ',
    capacity: '3 membros',
    equipment: ['Kit Básico de Resposta'],
    currentAssignment: 'CASE-2024-0179 - Acidente de Viação na Estrada Nacional 1'
  }
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: 'Alerta e Recepção',
    icon: 'Bell',
    description: 'Receção imediata do pedido de ajuda via app ou linha dedicada.',
    details: ['Geolocalização Automática', 'Identificação do Perfil Corporativo', 'Notificação de Gestores de Risco']
  },
  {
    id: 2,
    title: 'Triagem Clínica IA',
    icon: 'Stethoscope',
    description: 'Classificação imediata baseada em protocolos clínicos internacionais.',
    details: ['Avaliação de Sintomas', 'Classificação de Risco (A, B, C, D)', 'Suporte à Decisão Médica']
  },
  {
    id: 3,
    title: 'Acionamento de Rede',
    icon: 'Truck',
    description: 'Despacho de ambulância ou encaminhamento para clínica de rede.',
    details: ['Localização da Viatura mais próxima', 'Transmissão de Ficha Clínica', 'Abertura de Guia de Seguro']
  }
];
