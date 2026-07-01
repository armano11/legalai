import axios from "axios";

export type Stage = "Filed" | "Investigation" | "Hearing" | "Arguments" | "Judgment" | "Closed";
export type Priority = "critical" | "high" | "medium" | "low";

export interface Hearing {
  id: number;
  date: string;
  time?: string;
  court?: string;
  notes?: string;
  hearing_type?: string;
}

export interface NoteItem {
  id: number;
  content: string;
  note_type: "internal" | "client_call" | "document" | "meeting";
  author: string;
  created_at: string;
}

export interface DailyUpdate {
  id?: number;
  date: string;
  author: string;
  summary: string;
  research_notes?: string;
  hours_logged?: number;
}

export interface ActivityItem {
  id: number;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface CaseItem {
  id: number;
  case_no: string;
  title: string;
  description?: string;
  lawyer_name?: string;
  lawyer_email?: string;
  stage: Stage;
  priority: Priority;
  deadline?: string;
  client_name?: string;
  client_number?: string;
  case_type?: string;
  court?: string;
  hearings?: Hearing[];
  notes_log?: NoteItem[];
  daily_updates?: DailyUpdate[];
  activity_log?: ActivityItem[];
  urgency_flags?: string[];
}

export interface CaseStats {
  active: number;
  upcomingHearings: number;
  overdue: number;
  total: number;
}

export interface CasesStatsResponse {
  stats?: {
    total_active?: number;
    hearings_today?: number;
    urgent?: number;
    stale?: number;
  };
  my_cases?: CaseItem[];
}

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jurisai_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const casesAPI = {
  create: (data: any) => api.post<{ message: string; case_id: number; case_no: string; stage: string; assigned_to: string }>("/lawyers/cases", data),
  list: (params?: { search?: string; stage?: string }) =>
    api.get<{ cases: CaseItem[] }>("/lawyers/cases", { params }),
  stats: () => api.get<CaseStats>("/cases/stats"),
  detail: (id: number) => api.get<CaseItem>(`/lawyers/cases/${id}`),
  updateStage: (id: number, stage: Stage) => api.put(`/lawyers/cases/${id}/stage`, { new_stage: stage }),
  addHearing: (id: number, data: { date: string; time?: string; court?: string; hearing_type?: string; notes?: string }) =>
    api.post(`/lawyers/cases/${id}/hearings`, data),

  addNote: (id: number, data: { note_type: string; content: string }) => api.post(`/lawyers/cases/${id}/notes`, data),
  dailyUpdate: (id: number, data: { summary: string; research_notes?: string; hours_logged?: number }) =>
    api.put(`/lawyers/cases/${id}/daily-update`, data),
};

export const lawyersAPI = {
  directory: () => api.get<{ lawyers: Array<{ email: string; name: string; active_cases: number; overloaded?: boolean }> }>("/lawyers/directory"),
};

export default api;
