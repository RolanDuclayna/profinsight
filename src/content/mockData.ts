export type ComparisonProfessor = {
  name: string;
  rating: number;
  difficulty: number;
  summary: string;
};

export type ProfessorInfo = {
  name: string;
  rating: number | null;
  difficulty: number | null;
  summary: string;
  reviewUrl: string;
  course: string;
  compareOptions: ComparisonProfessor[];
};

// JSON.parse(localStorage.getItem("profinsight_schedule") || "[]")

export const professorData: Record<string, ProfessorInfo> = {
  "Tony Diaz": {
    name: "Tony Diaz",
    rating: 4.6,
    difficulty: 3.2,
    summary: "Explains clearly, organized lectures, and fair grading.",
    reviewUrl: "https://www.ratemyprofessors.com/",
    course: "CS 2400",
    compareOptions: [
      {
        name: "Maria Lopez",
        rating: 4.2,
        difficulty: 2.8,
        summary: "Friendly teaching style and lighter workload."
      },
      {
        name: "Kevin Patel",
        rating: 3.9,
        difficulty: 3.7,
        summary: "Solid lectures but more difficult exams."
      },
      {
        name: "Sarah Kim",
        rating: 4.8,
        difficulty: 4.1,
        summary: "Excellent teaching, but demanding class pace."
      }
    ]
  },
  "John Smith": {
    name: "John Smith",
    rating: 4.5,
    difficulty: 3.1,
    summary: "Clear lectures and fair grading.",
    reviewUrl: "https://www.ratemyprofessors.com/",
    course: "MATH 1060",
    compareOptions: [
      {
        name: "Jane Doe",
        rating: 3.9,
        difficulty: 4.0,
        summary: "Interesting class but heavier workload."
      },
      {
        name: "Alan Chu",
        rating: 4.1,
        difficulty: 3.3,
        summary: "Balanced teaching and straightforward exams."
      }
    ]
  },
  "Jane Doe": {
    name: "Jane Doe",
    rating: 3.9,
    difficulty: 4.0,
    summary: "Interesting class but heavier workload.",
    reviewUrl: "https://www.ratemyprofessors.com/",
    course: "MATH 1060",
    compareOptions: [
      {
        name: "John Smith",
        rating: 4.5,
        difficulty: 3.1,
        summary: "Clear lectures and fair grading."
      },
      {
        name: "Alan Chu",
        rating: 4.1,
        difficulty: 3.3,
        summary: "Balanced teaching and straightforward exams."
      }
    ]
  }
};