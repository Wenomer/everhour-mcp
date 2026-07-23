// Interfaces model the JSON returned by the Everhour REST API (v1.2).
// See https://everhour.docs.apiary.io/ for the source examples.

export interface Project {
  id: string;
  name: string;
  workspaceId?: string;
  workspaceName?: string;
  client?: number;
  type?: 'board' | 'list';
  favorite?: boolean;
  status?: string;
  users?: number[];
  billing?: { type: string };
  rate?: { type: string; rate: number };
  budget?: {
    type: string;
    budget: number;
    progress?: number;
    period?: string;
  };
}

export interface Section {
  id: number;
  name: string;
  project: string;
  position?: number;
  status?: 'open' | 'archived';
}

export interface TaskTime {
  total: number;
  users?: Record<string, number>;
}

export interface Task {
  id: string;
  name: string;
  projects?: string[];
  section?: number;
  labels?: string[];
  position?: number;
  description?: string;
  dueAt?: string;
  status?: 'open' | 'closed';
  time?: TaskTime;
  estimate?: TaskTime & { type?: string };
  unbillable?: boolean;
}

export interface TimeHistoryEntry {
  id: number;
  createdBy: number;
  time: number;
  previousTime: number;
  action: string;
  createdAt: string;
}

export interface TimeEntry {
  id: number;
  time: number;
  user: number;
  date: string;
  task?: { id: string; name: string };
  isLocked?: boolean;
  isInvoiced?: boolean;
  comment?: string;
  history?: TimeHistoryEntry[];
}

export interface Timer {
  status: string;
  duration: number;
  today: number;
  startedAt?: string;
  userDate?: string;
  comment?: string;
  task?: { id: string; name: string };
  user?: { id: number; name: string; role?: string; status?: string };
}

export interface User {
  id: number;
  name: string;
  headline?: string;
  avatarUrl?: string;
  email?: string;
  role?: string;
  status?: string;
}
