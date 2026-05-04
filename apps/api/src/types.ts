export type CompareOption = {
  name: string;
  rating: number;
  difficulty: number;
  summary: string;
  numRatings: number;
  wouldTakeAgain: number | null;
  department: string;
};

export type ProfessorResult = {
  found: boolean;
  name: string;
  rating?: number;
  difficulty?: number;
  summary?: string;
  reviewUrl?: string;
  course?: string;
  numRatings?: number;
  wouldTakeAgain?: number | null;
  department?: string;
  departmentRank?: number;
  departmentTotal?: number;
  compareOptions?: CompareOption[];
};

export type ProfessorsResponse = {
  schoolFound: string | null;
  professors: Record<string, ProfessorResult>;
};
