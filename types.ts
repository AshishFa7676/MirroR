
export enum ViewState {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  TASKS = 'TASKS',
  JOURNAL = 'JOURNAL',
  ANALYTICS = 'ANALYTICS',
  HISTORY = 'HISTORY'
}

export enum LogType {
  CONFESSION = 'CONFESSION',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  TASK_STARTED = 'TASK_STARTED',
  TASK_PAUSED = 'TASK_PAUSED',
  TASK_RESUMED = 'TASK_RESUMED',
  CONTRACT_BREACHED = 'CONTRACT_BREACHED',
  TASK_DELETED = 'TASK_DELETED',
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
  CONTRACT_AMENDED = 'CONTRACT_AMENDED',
  SHIELD_LOGGED = 'SHIELD_LOGGED',
  POMODORO_SESSION = 'POMODORO_SESSION',
  TASK_COMPLETED = 'TASK_COMPLETED',
  REFLECTION_SUBMITTED = 'REFLECTION_SUBMITTED',
  REFLECTION_SESSION_COMPLETED = 'REFLECTION_SESSION_COMPLETED'
}

export interface UserProfile {
  id: string; // key for DB
  situation: string;
  distractions: string;
  routine: string;
  delayReason: string;
  deadlineDate: number; 
  hasCompletedOnboarding: boolean;
  sprintGoals: string[];
  integrityDebt: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  content: string;
  metadata?: any; 
}

export interface JournalMetadata {
  word_count: number;
  char_count: number;
  writing_duration_seconds: number;
  keystrokes: number;
  pauses: number;
  words_per_minute: number;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  hour_of_day: number;
  day_of_week: string;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  startTime: number;
  endTime?: number;
  content: string;
  reflection?: string;
  metadata?: JournalMetadata;
}

export interface ReflectionResponse {
  id: string; // unique ID for this specific answer (date-promptId)
  promptId: number;
  question: string;
  category: string;
  response: string;
  timestamp: number;
  dateString: string; // For easy "today" filtering
}

export interface PomodoroState {
  id: string; // usually 'global_pomodoro'
  isActive: boolean;
  isBreak: boolean;
  startTime?: number; // When the current session started (Date.now())
  durationMinutes: number; // Target duration (25 or 5)
  settings: {
    work: number;
    break: number;
  };
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'ANALYST_PREP' | 'LIFE_MAINTENANCE' | 'OTHER';
  tags: string[];
  
  // Scheduling
  scheduledTimeStart: string; // ISO string or timestamp
  scheduledTimestamp?: number; // Numeric timestamp for easier calc
  deadlineTimestamp?: number; 
  durationMinutes: number;
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY';
  remindersEnabled: boolean; // Added
  
  // State
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'BREACHED' | 'FAILED' | 'MISSED';
  stakes: 'LOW' | 'HIGH' | 'CRITICAL';
  escapeAttempts: number;
  
  // Independent Timer Logic
  accumulatedTimeSeconds: number; 
  lastSessionStart?: number; 
  pausedUntil?: number; 
  
  // Logic
  dependencies: string[]; 
  subTasks: SubTask[];
  technicalEvidence?: string;
}

export interface PatternAnalysis {
  overallScore: number;
  primaryPattern: string;
  escapePatterns: Array<{
    pattern: string;
    frequency: string;
    triggerTime: string;
  }>;
  productivityInsights: {
    peakHours: string[];
    worstHours: string[];
    bestCategory: string;
    worstCategory: string;
  };
  excusePatterns: string[];
  selfDeceptionFlags: string[];
  strengths: string[];
  urgentRecommendations: Array<{
    recommendation: string;
    reason: string;
  }>;
  honestTruth: string;
}
