
export enum ViewState {
  ONBOARDING = 'ONBOARDING',
  PLANNER = 'PLANNER',
  EXECUTION_TUNNEL = 'EXECUTION_TUNNEL',
  JOURNAL = 'JOURNAL',
  ANALYTICS = 'ANALYTICS',
  HISTORY = 'HISTORY'
}

export enum LogType {
  CONFESSION = 'CONFESSION',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  TASK_STARTED = 'TASK_STARTED',
  CONTRACT_BREACHED = 'CONTRACT_BREACHED',
  OBLIGATION_REPUDIATION = 'OBLIGATION_REPUDIATION', 
  GHOSTING_DETECTED = 'GHOSTING_DETECTED',
  SOCRATIC_INTERROGATION = 'SOCRATIC_INTERROGATION',
  QUIZ_FAILURE = 'QUIZ_FAILURE',
  QUIZ_SUCCESS = 'QUIZ_SUCCESS',
  JOURNAL_DUMP = 'JOURNAL_DUMP',
  AI_PSYCH_PROFILE = 'AI_PSYCH_PROFILE',
  INTEGRITY_DEBT_ACCRUED = 'INTEGRITY_DEBT_ACCRUED',
  VOID_EXPLANATION = 'VOID_EXPLANATION',
  SELF_INQUISITION = 'SELF_INQUISITION',
  ALARM_TRIGGERED = 'ALARM_TRIGGERED',
  CONTRACT_AMENDED = 'CONTRACT_AMENDED'
}

export interface UserProfile {
  situation: string;
  distractions: string;
  routine: string;
  delayReason: string;
  deadlineDate: number; 
  hasCompletedOnboarding: boolean;
  sprintGoals: string[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  content: string;
  metadata?: any;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  startTime: number;
  content: string;
  reflection?: string;
}

export interface Task {
  id: string;
  title: string;
  category: 'ANALYST_PREP' | 'LIFE_MAINTENANCE' | 'OTHER';
  description?: string;
  scheduledTimeStart: string; 
  durationMinutes: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'BREACHED' | 'FAILED' | 'MISSED';
  actualTimeSpentSeconds: number;
  stakes: 'LOW' | 'HIGH' | 'CRITICAL';
}
