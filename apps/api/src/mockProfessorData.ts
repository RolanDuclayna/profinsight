import type { ProfessorResult } from "./types.js";

type SchoolSeed = {
  displayName: string;
  aliases: string[];
  professors: Record<string, ProfessorResult>;
};

export const schools: SchoolSeed[] = [
  {
    displayName: "Cal Poly Pomona",
    aliases: ["cal poly pomona", "cpp", "california state polytechnic university pomona"],
    professors: {
      "tony diaz": {
        found: true,
        name: "Tony Diaz",
        rating: 2.1,
        difficulty: 3.7,
        summary: "Tony Diaz is ranked #81 out of 83 professors in Computer Science.",
        reviewUrl: "https://www.ratemyprofessors.com/professor/2213265",
        course: "Computer Science",
        numRatings: 75,
        wouldTakeAgain: 27,
        department: "Computer Science",
        departmentRank: 81,
        departmentTotal: 83,
        compareOptions: [
          {
            name: "Example Professor",
            rating: 4.2,
            difficulty: 2.9,
            summary: "A possible alternative professor for this course.",
            numRatings: 40,
            wouldTakeAgain: 85,
            department: "Computer Science"
          }
        ]
      }
    }
  }
];
