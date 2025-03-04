import express from "express";
import { isAdminOrSeller } from "../middlewares/auth.middleware.js"; // ✅ Corrected Import

import {
  dailyReport,
  totalReport,
  trendReport,
} from "../services/report.service.js";

const app = express.Router();

app.get("/reports/daily", isAdminOrSeller, dailyReport);
app.get("/reports/total", isAdminOrSeller, totalReport);
app.get("/reports/trends", isAdminOrSeller, trendReport);

export default app;
    