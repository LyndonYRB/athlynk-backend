import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "FitFriends backend is running" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
