import type { ProfessorInfo } from "./mockData";

const API_URL = "http://localhost:8787/api/professors";

export async function fetchProfessorInfo(
  school: string,
  professorName: string
): Promise<ProfessorInfo | null> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      school,
      professors: [professorName]
    })
  });

  if (!response.ok) {
    throw new Error(`Professor API failed: ${response.status}`);
  }

  const data = await response.json();

  const normalizedName = professorName.trim().toLowerCase();
  const result = Object.values(data.professors ?? {}).find((prof: any) => {
    return prof.name?.trim().toLowerCase() === normalizedName;
  }) as ProfessorInfo | undefined;

  if (!result) {
  return null;
}

if (!(result as any).found) {
  return {
    name: professorName,
    course: "No Reviews Found",
    rating: 0,
    difficulty: 0,
    summary: "No Reviews Found",
    reviewUrl: "",
    compareOptions: []
  };
}

  return result;
}