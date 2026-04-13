import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";

const PORT = process.env.PORT;

const app = express();

app.set("trust-proxy", 1);

app.use(express.json());
app.use(helmet());
app.use(cors());

// Global
app.get("/api/health", (req, res) => {
  res.json({
    status: "Ok",
  });
});

app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Porta ${PORT} rodando`);
});
