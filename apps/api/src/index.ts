import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import magicLinkRoutes from "./routes/magicLink";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/auth", magicLinkRoutes);

app.listen(4000, () => console.log("API running on :4000"));
