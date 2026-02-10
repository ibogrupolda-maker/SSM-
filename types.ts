
export enum EmergencyPriority {
  CRITICAL = 'A',
  HIGH = 'B',
  MODERATE = 'C',
  LOW = 'D'
}

export type UserRole = 'ADMIN_OC' | 'OPERADOR_SALA' | 'ANALISTA_RISCO' | 'AMBULANCIA' | 'EMPRESA_CLIENTE';

export interface AdminUser {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  initials: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  gender: 'M' | 'F' | 'Outro';
  idDocument: string;
  companyId?: string;
  isFirstAccess?: boolean; // Flag para fluxo de ativação
  preferences?: {
    language: string;
    timezone: string;
    theme: 'claro' | 'escuro';
    notifications: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
      push: boolean;
      frequency: 'imediata' | 'resumo_diario' | 'semanal';
    }
  }
}

export interface EmergencyPriorityData {
  label: string;
  color: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  timestamp: string;
  details: string;
  type: 'emergency' | 'system' | 'auth' | 'protocol';
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  bi: string;
  age: number;
  sex: 'M' | 'F';
  bloodType: string;
  insurer: string;
  policyNumber: string;
  policyValidity: string; 
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  allergies?: string[];
}

export interface OperationReport {
  hospitalName: string;
  timeToBaseToPatient: string;
  timeToPatientToHospital: string;
  totalOperationTime: string;
  consciousnessState: 'Consciente' | 'Inconsciente';
  conditionWorsened: boolean;
  paramedicName: string;
  finalObservations: string;
  timestamps: {
    dispatched: string;
    arrivedAtPatient: string;
    leftForHospital: string;
    arrivedAtHospital: string;
  };
}

export interface AmbulanceState {
  currentPos: [number, number];
  phase: 'idle' | 'en_route_to_patient' | 'at_patient' | 'evacuating' | 'at_hospital';
  eta: number;
  distance: number;
  timestamps?: {
    dispatched: string;
    arrivedAtPatient?: string;
    leftForHospital?: string;
    arrivedAtHospital?: string;
  };
}

export interface EmergencyCase {
  id: string;
  priority: EmergencyPriority;
  locationName: string;
  status: 'active' | 'triage' | 'transit' | 'closed';
  timestamp: string;
  type: string;
  coords: [number, number];
  patientName?: string; // Nome vindo da triagem
  employeeId?: string; 
  companyId?: string;  
  ambulanceState?: AmbulanceState;
  report?: OperationReport;
}

export type ResourceStatus = 'available' | 'assigned' | 'offline' | 'maintenance';

export interface Resource {
  id: string;
  name: string;
  type: string;
  category: 'ambulance' | 'hospital' | 'team';
  status: ResourceStatus;
  location: string;
  capacity?: string;
  equipment?: string[];
  eta?: string;
  currentAssignment?: string;
}

export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

export interface ProtocolSuggestion {
  classification: EmergencyPriority;
  actionRequired: string;
  reasoning: string;
  suggestedResources: string[];
}
