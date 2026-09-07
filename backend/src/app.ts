import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { handleLogin } from "./login";

const frontendOrigin = process.env.FRONTEND_ORIGIN;

if (!frontendOrigin) {
  throw new Error("FRONTEND_ORIGIN is required");
}

export const app = express();

app.use(helmet());
app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "16kb" }));

app.post("/login", handleLogin);

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof SyntaxError && "status" in err && err.status === 400) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  },
);
