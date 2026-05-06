import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { lookupProfessors } from './professorService.js';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';

const app = express();
const port = Number(process.env.PORT ?? 8787);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

type DprNeededCourse = {
  course: string;
};

type DprAnalysis = {
  neededCourses: DprNeededCourse[];
  majorElectiveUnitsNeeded: number | null;
};

function normalizeDprText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function extractNeededCoursesFromDpr(text: string): DprNeededCourse[] {
  const lines = normalizeDprText(text).split('\n');
  const neededCourses: DprNeededCourse[] = [];
  const seenCourses = new Set<string>();

  const courseHeadingRegex = /^([A-Z]{2,5}\s\d{3,4}[A-Z]?)\s*:?\s*$/;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const courseMatch = line.match(courseHeadingRegex);

    if (courseMatch === null) {
      continue;
    }

    const course = courseMatch[1];

    const requirementLines: string[] = [];

    for (let nextIndex = index; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = lines[nextIndex].trim();

      if (nextIndex !== index && courseHeadingRegex.test(nextLine)) {
        break;
      }

      requirementLines.push(nextLine);
    }

    const requirementText = requirementLines.join(' ');
    const isNeeded = requirementText.includes('0 taken, 1 needed');

    if (!isNeeded) {
      continue;
    }

    if (seenCourses.has(course)) {
      continue;
    }

    neededCourses.push({
      course,
    });

    seenCourses.add(course);
  }

  return neededCourses;
}

function extractMajorElectiveUnitsNeeded(text: string): number | null {
  const normalizedText = normalizeDprText(text);

  const majorElectiveMatch = normalizedText.match(
    /Major Elective Requirement:[\s\S]*?Units:\s*21\.00 required,\s*16\.00 taken,\s*([0-9.]+) needed/i,
  );

  if (majorElectiveMatch === null) {
    return null;
  }

  const unitsNeeded = Number(majorElectiveMatch[1]);

  if (Number.isNaN(unitsNeeded)) {
    return null;
  }

  return unitsNeeded;
}

function analyzeDprText(text: string): DprAnalysis {
  return {
    neededCourses: extractNeededCoursesFromDpr(text),
    majorElectiveUnitsNeeded: extractMajorElectiveUnitsNeeded(text),
  };
}

function buildDprPrompt(analysis: DprAnalysis): string {
  const neededCoursesText =
    analysis.neededCourses.length > 0
      ? analysis.neededCourses
          .map((neededCourse) => {
            return neededCourse.course;
          })
          .join(', ')
      : 'No needed courses detected.';

  const electiveText =
    analysis.majorElectiveUnitsNeeded !== null
      ? `${analysis.majorElectiveUnitsNeeded} major elective units needed`
      : 'Major elective units needed were not detected.';

  return `
You are helping a college student understand a Degree Progress Report.

Write 3 short bullet points.
Do not write an introduction.
Do not invent requirements.
Mention that this analysis is only a demo estimate and the student should verify with an advisor.
Use simple wording.

Detected needed courses:
${neededCoursesText}

Detected elective requirement:
${electiveText}
`;
}

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  }),
);
app.use(express.json({ limit: '64kb' }));

const professorsRequestSchema = z.object({
  school: z.string().trim().min(1, 'school is required'),
  professors: z
    .array(z.string().trim().min(1))
    .min(1, 'professors must include at least one name'),
});

const professorSummaryRequestSchema = z.object({
  professorName: z.string().trim().min(1),
  course: z.string().optional(),
  rating: z.number().nullable().optional(),
  difficulty: z.number().nullable().optional(),
  numRatings: z.number().nullable().optional(),
  wouldTakeAgain: z.number().nullable().optional(),
  department: z.string().optional(),
  reviewUrl: z.string().trim().min(1),
});

const scheduleClassSchema = z.object({
  id: z.string().optional(),
  professorName: z.string().optional(),
  course: z.string().optional(),
  crn: z.string().optional(),
  section: z.string().optional(),
  daysTime: z.string().optional(),
  room: z.string().optional(),
  meetingDates: z.string().optional(),
  rating: z.number().nullable().optional(),
  difficulty: z.number().nullable().optional(),
  reviewUrl: z.string().optional(),
  source: z.string().optional(),
});

const scheduleSummaryRequestSchema = z.object({
  classes: z.array(scheduleClassSchema),
});

function buildSchedulePrompt(classes: z.infer<typeof scheduleClassSchema>[]) {
  const formattedClasses = classes
    .map((savedClass, index) => {
      const ratingText =
        savedClass.rating !== null && savedClass.rating !== undefined
          ? `${savedClass.rating}/5`
          : 'not provided';

      return [
        `Class ${index + 1}:`,
        `Course: ${savedClass.course?.trim() || 'not provided'}`,
        `CRN: ${savedClass.crn?.trim() || 'not provided'}`,
        `Time: ${savedClass.daysTime?.trim() || 'not provided'}`,
        `Professor: ${savedClass.professorName?.trim() || 'not provided'}`,
        `Professor RMP Rating: ${ratingText}`,
        `Room: ${savedClass.room?.trim() || 'not provided'}`,
      ].join('\n');
    })
    .join('\n\n');

  return `
You are a schedule helper for a college student.

Write 2 to 3 short bullet points.
Do not write an introduction.
Do not repeat every class detail.
Do not invent missing information.
The ratings are RateMyProfessors ratings for the professors, not grades, student performance, or course ratings.
When mentioning ratings, say "professor rating" or "RMP rating".
Do not say the student has a rating.

Important data rules:
A CRN is present if the CRN line contains any number.
Never say a CRN is missing if a CRN number is shown.
If a field has a value, do not call it missing.
Only say CRN, time, room, or professor information is missing when the field says exactly "not provided".

Look for these issues:
- Classes with the exact same or overlapping days and times.
- Back-to-back classes in different buildings where the student may need enough walking time.
- Missing CRN, time, room, or professor information only when the field says exactly "not provided".
- Professor RMP ratings that may be useful when comparing sections.

If there are no clear issues, summarize the schedule in a helpful way.
Keep each bullet point to one short sentence.

Schedule:
${formattedClasses}
`;
}

function cleanRmpReviewText(value: string) {
  return value
    .replace(/\\n/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractVisibleReviewComments(html: string, maxReviews = 5) {
  const comments: string[] = [];
  const seenComments = new Set<string>();

  const commentRegexes = [
    /"comment"\s*:\s*"((?:\\"|[^"])*)"/g,
    /"rComments"\s*:\s*"((?:\\"|[^"])*)"/g,
  ];

  for (const commentRegex of commentRegexes) {
    let match = commentRegex.exec(html);

    while (match !== null && comments.length < maxReviews) {
      const comment = cleanRmpReviewText(match[1] ?? '');

      if (comment.length > 20 && !seenComments.has(comment)) {
        comments.push(comment);
        seenComments.add(comment);
      }

      match = commentRegex.exec(html);
    }

    if (comments.length >= maxReviews) {
      break;
    }
  }

  return comments;
}

function buildProfessorReviewPrompt(
  professor: z.infer<typeof professorSummaryRequestSchema>,
  comments: string[],
) {
  const ratingText =
    professor.rating !== null && professor.rating !== undefined
      ? `${professor.rating}/5`
      : 'not provided';

  const difficultyText =
    professor.difficulty !== null && professor.difficulty !== undefined
      ? `${professor.difficulty}/5`
      : 'not provided';

  const numRatingsText =
    professor.numRatings !== null && professor.numRatings !== undefined
      ? `${professor.numRatings}`
      : 'not provided';

  const wouldTakeAgainText =
    professor.wouldTakeAgain !== null && professor.wouldTakeAgain !== undefined
      ? `${professor.wouldTakeAgain}%`
      : 'not provided';

  const reviewText =
    comments.length > 0
      ? comments
          .map((comment, index) => {
            return `Review ${index + 1}: ${comment}`;
          })
          .join('\n')
      : 'No recent review comments were available.';

  return `
You are helping a college student understand RateMyProfessors feedback.

Output only 2 to 3 short bullet points.
Do not write an introduction.
Do not write a sentence explaining what the bullets are.
Do not say "Here are".
Do not invent information.
Do not quote long review text.
Do not use phrases like "job satisfaction" because these are student course reviews, not employee reviews.
Summarize the main themes from the student review snippets.
Do not make a bullet point only to restate the RMP rating, difficulty, number of ratings, or would-take-again percentage.
Use rating statistics only as supporting context if they help explain the review themes.
The ratings are RateMyProfessors ratings for the professor, not grades or student performance.
When mentioning ratings, say "RMP rating" or "professor rating".
If review comments are unavailable, summarize only the rating statistics.
Keep each bullet point short and useful.

Professor:
Name: ${professor.professorName}
Course saved by student: ${professor.course ?? 'not provided'}
Department: ${professor.department ?? 'not provided'}
RMP Rating: ${ratingText}
RMP Difficulty: ${difficultyText}
Number of Ratings: ${numRatingsText}
Would Take Again: ${wouldTakeAgainText}
RMP Link: ${professor.reviewUrl}

Recent student review snippets:
${reviewText}
`;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'profinsight-api' });
});

app.post('/api/professors', async (req, res, next) => {
  try {
    const parsed = professorsRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        issues: parsed.error.flatten(),
      });
    }

    const result = await lookupProfessors(
      parsed.data.school,
      parsed.data.professors,
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/schedule-summary', async (req, res, next) => {
  try {
    const parsed = scheduleSummaryRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        issues: parsed.error.flatten(),
      });
    }

    if (parsed.data.classes.length === 0) {
      return res.json({
        summary: 'Add classes to your schedule first.',
      });
    }

    const prompt = buildSchedulePrompt(parsed.data.classes);

    console.log('Schedule summary request:');
    console.log(JSON.stringify(parsed.data.classes, null, 2));

    console.log('Ollama prompt:');
    console.log(prompt);

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 220,
        },
      }),
    });

    if (!ollamaResponse.ok) {
      return res.status(502).json({
        error: 'Ollama request failed',
      });
    }

    const ollamaData = (await ollamaResponse.json()) as {
      response?: string;
    };

    console.log('Ollama response:');
    console.log(ollamaData.response);

    return res.json({
      summary: ollamaData.response?.trim() ?? 'No summary was generated.',
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/professor-summary', async (req, res, next) => {
  try {
    const parsed = professorSummaryRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        issues: parsed.error.flatten(),
      });
    }

    console.log('Professor summary request:');
    console.log(JSON.stringify(parsed.data, null, 2));

    const rmpResponse = await fetch(parsed.data.reviewUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 ProfessorInsight Class Project',
      },
    });

    if (!rmpResponse.ok) {
      return res.status(502).json({
        error: 'Could not fetch RMP professor page',
      });
    }

    const html = await rmpResponse.text();
    const comments = extractVisibleReviewComments(html, 5);

    console.log('Extracted RMP comments:');
    console.log(comments);

    const prompt = buildProfessorReviewPrompt(parsed.data, comments);

    console.log('Professor summary prompt:');
    console.log(prompt);

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 260,
        },
      }),
    });

    if (!ollamaResponse.ok) {
      return res.status(502).json({
        error: 'Ollama request failed',
      });
    }

    const ollamaData = (await ollamaResponse.json()) as {
      response?: string;
    };

    console.log('Professor summary response:');
    console.log(ollamaData.response);

    return res.json({
      summary:
        ollamaData.response?.trim() ?? 'No professor summary was generated.',
      commentsFound: comments.length,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/dpr-summary', upload.single('file'), async (req, res, next) => {
  try {
    if (req.file === undefined) {
      return res.status(400).json({
        error: 'No PDF file uploaded',
      });
    }

    const parser = new PDFParse({
      data: req.file.buffer,
    });

    const parsedPdf = await parser.getText();
    const dprText = parsedPdf.text;

    await parser.destroy();
    const analysis = analyzeDprText(dprText);
    const prompt = buildDprPrompt(analysis);

    console.log('DPR analysis:');
    console.log(JSON.stringify(analysis, null, 2));

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 220,
        },
      }),
    });

    if (!ollamaResponse.ok) {
      return res.status(502).json({
        error: 'Ollama request failed',
      });
    }

    const ollamaData = (await ollamaResponse.json()) as {
      response?: string;
    };

    return res.json({
      summary: ollamaData.response?.trim() ?? 'No DPR summary was generated.',
      analysis,
    });
  } catch (error) {
    return next(error);
  }
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

app.listen(port, () => {
  console.log(`ProfInsight API listening on http://localhost:${port}`);
});
