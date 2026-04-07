import { Router } from "express";
import { professors } from "../data/demoData.js";

const router = Router();

// GET all professors
router.get("/", (req, res) => {
  res.json(professors);
});

// ✅ GET professor by ID
router.get("/:id", (req, res) => {
  const professor = professors.find(
    (p) => p.id === req.params.id
  );

  if (!professor) {
    return res.status(404).json({ error: "Professor not found" });
  }

  res.json(professor);
});

export default router;

