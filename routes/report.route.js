import express from "express";
import { isAdminOrSeller, isUser } from "../middlewares/auth.middleware.js"; // ✅ Corrected Import

import {
  customerAnalysis,
  dailyReport,
  getProductSalesHistory,
  profitabilityAnalysis,
  scheduleReport,
  totalReport,
  trendReport,
  yearAndMonthGrowth,
} from "../services/report.service.js";
import { searchProduct } from "../services/search.js";

const app = express.Router();

app.get("/reports/daily", isAdminOrSeller, dailyReport);
app.get("/reports/total", isAdminOrSeller, totalReport);
app.get("/reports/trends", isAdminOrSeller, trendReport);
app.get("/yoyGrowth", isAdminOrSeller, yearAndMonthGrowth);
app.get("/profit/analysis", isAdminOrSeller, profitabilityAnalysis);
app.get("/search", isUser, searchProduct);

app.get(
  "/products/sales-history/:productId",
  isAdminOrSeller,
  getProductSalesHistory
);
app.post("/schedule-report", isAdminOrSeller, scheduleReport);
app.get("/reports/customer-analysis", isAdminOrSeller,   customerAnalysis);
export default app;
