import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { lookupProfessors } from "./professorService.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);

const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true
  })
);
app.use(express.json({ limit: "64kb" }));

const professorsRequestSchema = z.object({
  school: z.string().trim().min(1, "school is required"),
  professors: z.array(z.string().trim().min(1)).min(1, "professors must include at least one name")
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "profinsight-api" });
});

app.post("/api/professors", async (req, res, next) => {
  try {
    const parsed = professorsRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        issues: parsed.error.flatten()
      });
    }

    const result = await lookupProfessors(parsed.data.school, parsed.data.professors);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`ProfInsight API listening on http://localhost:${port}`);
});
