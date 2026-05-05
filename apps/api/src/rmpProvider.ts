import type { ProfessorResult } from "./types.js";

const CPP_RMP_SCHOOL_ID = "13914";
const RMP_BASE_URL = "https://www.ratemyprofessors.com";

const cache = new Map<string, ProfessorResult>();

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeForExactMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractProfessorNameFromPage(html: string): string | null {
  const text = html.replace(/\s+/g, " ");

  const match = text.match(/<title>(.*?)\s+at\s+Cal Poly Pomona/i);
  if (match?.[1]) {
    return match[1].trim();
  }

  const jsonMatch = text.match(/"firstName":"([^"]+)","lastName":"([^"]+)"/);
  if (jsonMatch) {
    return `${jsonMatch[1]} ${jsonMatch[2]}`;
  }

  return null;
}

function notFoundProfessor(name: string): ProfessorResult {
  return {
    found: false,
    name,
    summary: `No RateMyProfessors data found for ${name}.`
  };
}

function extractNumber(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

function extractProfessorId(html: string): string | null {
  const match = html.match(/\/professor\/(\d+)/);
  return match?.[1] ?? null;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 ProfInsight/1.0 educational project local-dev",
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`RateMyProfessors request failed: ${response.status}`);
  }

  return response.text();
}

export async function lookupProfessorFromRmp(
  school: string,
  professorName: string
): Promise<ProfessorResult> {
  const cacheKey = `${school}:${professorName}`.toLowerCase();

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const searchUrl = `${RMP_BASE_URL}/search/professors/${CPP_RMP_SCHOOL_ID}?q=${encodeURIComponent(
    professorName
  )}`;

  const searchHtml = await fetchText(searchUrl);
  const professorId = extractProfessorId(searchHtml);

  if (!professorId) {
    const result = notFoundProfessor(professorName);
    cache.set(cacheKey, result);
    return result;
  }

  const professorUrl = `${RMP_BASE_URL}/professor/${professorId}`;
  const professorHtml = await fetchText(professorUrl);

  const rmpProfessorName = extractProfessorNameFromPage(professorHtml);

if (
  !rmpProfessorName ||
  normalizeForExactMatch(rmpProfessorName) !== normalizeForExactMatch(professorName)
) {
  const result = notFoundProfessor(professorName);
  cache.set(cacheKey, result);
  return result;
}

  const pageText = professorHtml.replace(/\s+/g, " ");

  const rating = extractNumber(
  pageText,
  /"avgRating":\s*([0-5](?:\.\d+)?)/i
);
  const difficulty = extractNumber(
  pageText,
  /"avgDifficulty":\s*([0-5](?:\.\d+)?)/i
);
  const wouldTakeAgain = extractNumber(
  pageText,
  /"wouldTakeAgainPercent":\s*(\d+(?:\.\d+)?)/i
);
  const numRatings = extractNumber(
  pageText,
  /"numRatings":\s*(\d+)/i
);

  const departmentMatch = pageText.match(
    /Professor in the ([^<]+?) department at Cal Poly Pomona/i
  );

  const department = departmentMatch?.[1]?.trim() ?? "Unknown";

  const result: ProfessorResult = {
    found: true,
    name: professorName,
    rating: rating ?? 0,
    difficulty: difficulty ?? 0,
    summary: `${professorName} is a professor in the ${department} department at Cal Poly Pomona.`,
    reviewUrl: professorUrl,
    course: department,
    numRatings: numRatings ?? 0,
    wouldTakeAgain: wouldTakeAgain ?? 0,
    department,
    compareOptions: []
  };

  cache.set(cacheKey, result);
  return result;
}
