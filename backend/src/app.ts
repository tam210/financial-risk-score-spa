import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { requireAuth } from "./auth-middleware";
import { handleLogin } from "./login";
import { handleGetScore } from "./score-route";

const frontendOrigin = process.env.FRONTEND_ORIGIN;

if (!frontendOrigin) {
  throw new Error("FRONTEND_ORIGIN is required");
}

export const app = express();

app.use(helmet());
app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "16kb" }));

app.post("/login", handleLogin);
app.get("/score/:rut", requireAuth, handleGetScore);

function readErrorStatus(err: unknown): number | null {
  if (err === null || typeof err !== "object") {
    return null;
  }

  if ("status" in err && typeof err.status === "number") {
    return err.status;
  }

  if ("statusCode" in err && typeof err.statusCode === "number") {
    return err.statusCode;
  }

  return null;
}

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    const status = readErrorStatus(err);

    if (status === 413) {
      res.status(413).json({ error: "Invalid request" });
      return;
    }

    if (err instanceof SyntaxError && status === 400) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  },
);
