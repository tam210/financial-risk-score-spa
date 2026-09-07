import { app } from "./app";

const rawPort = process.env.PORT;
const port = Number(rawPort);

if (!rawPort || !Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
