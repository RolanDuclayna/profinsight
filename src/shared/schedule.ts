export type SavedScheduleItem = {
  id: string;
  professorName: string;
  course: string;
  crn: string;
  section: string;
  daysTime: string;
  room: string;
  meetingDates: string;
  rating: number | null;
  difficulty: number | null;
  reviewUrl: string;
  source: string;
};

export type ProfessorAiSummaryState = {
  status: 'loading' | 'done' | 'error';
  summary: string;
};

export const PROFESSOR_SUMMARY_STORAGE_KEY = 'profinsightProfessorSummaries';
export const SCHEDULE_STORAGE_KEY = 'profinsightSchedule';
export const AI_SUMMARY_STORAGE_KEY = 'profinsightAiSummary';
export const AI_SUMMARY_LOADING_KEY = 'profinsightAiSummaryLoading';
