import type { ProfessorsResponse, ProfessorResult } from "./types.js";
import { lookupProfessorFromRmp } from "./rmpProvider.js";

function notFoundProfessor(name: string): ProfessorResult {
  return {
    found: false,
    name,
    summary: `No professor insight found for ${name}.`
  };
}

export async function lookupProfessors(
  school: string,
  professorNames: string[]
): Promise<ProfessorsResponse> {
  const response: ProfessorsResponse = {
    schoolFound: school,
    professors: {}
  };

  for (const requestedName of professorNames) {
    try {
      response.professors[requestedName] = await lookupProfessorFromRmp(
        school,
        requestedName
      );
    } catch (error) {
      console.error(`Failed to lookup ${requestedName}:`, error);
      response.professors[requestedName] = notFoundProfessor(requestedName);
    }
  }

  return response;
}