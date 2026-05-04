import { schools } from "./mockProfessorData.js";
import type { ProfessorResult, ProfessorsResponse } from "./types.js";

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findSchool(input: string) {
  const normalized = normalize(input);
  return schools.find(
    (school) =>
      normalize(school.displayName) === normalized ||
      school.aliases.some((alias) => normalize(alias) === normalized)
  );
}

function notFoundProfessor(name: string): ProfessorResult {
  return {
    found: false,
    name,
    summary: `No professor insight found for ${name}.`
  };
}

export async function lookupProfessors(
  schoolInput: string,
  professorNames: string[]
): Promise<ProfessorsResponse> {
  const school = findSchool(schoolInput);
  const response: ProfessorsResponse = {
    schoolFound: school?.displayName ?? null,
    professors: {}
  };

  for (const requestedName of professorNames) {
    const key = normalize(requestedName);
    const match = school?.professors[key];
    response.professors[requestedName] = match ?? notFoundProfessor(requestedName);
  }

  return response;
}
