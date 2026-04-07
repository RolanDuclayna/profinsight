import express from "express";
import cors from "cors";
import professorRoutes from "./routes/professors.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/professors", professorRoutes);

app.listen(4000, () => {
  console.log("API running on http://localhost:4000");
});

