import cors from "cors";
import express from "express";
import helmet from "helmet";

const frontendOrigin = process.env.FRONTEND_ORIGIN;

if (!frontendOrigin) {
  throw new Error("FRONTEND_ORIGIN is required");
}

export const app = express();

app.use(helmet());
app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "16kb" }));
