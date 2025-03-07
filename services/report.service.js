import { createObjectCsvWriter } from "csv-writer";
import ExcelJS from "exceljs";
import fs from "fs";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { promisify } from "util";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { calculateProfitability } from "../utils/grossProfitAndProfitMargin.js";
import { categorizeProducts } from "../utils/highLowMarginProduct.js";
import { calculateProductSales } from "../utils/saleCalculator.js";
import { getTopSearchedProducts } from "../utils/topSearchedProduct.js";
import ScheduledReport from "../models/schedule.report.model.js";
import { analyzeCustomerSales } from "../utils/analyzeCustomerSales.js";
import { analyzeTopCustomerSegments } from "../utils/analyzeTopCustomerSegments.js";

const unlinkAsync = promisify(fs.unlink);
// Day-wise report endpoint (dynamic with products)
const dailyReport = async (req, res) => {
  try {
    const { date, productId } = req.query;

    // Validate date parameter
    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const startOfDay = new Date(parsedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log("Date Range:", { startOfDay, endOfDay });

    // Base query for completed orders on the date
    const query = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: "completed",
    };

    // Handle seller-specific filtering
    if (req.userInfo.role === "seller") {
      const sellerProductIds = await Product.find({
        sellerId: req.userInfo._id,
      }).distinct("_id");
      console.log("Seller's Product IDs:", sellerProductIds);

      if (sellerProductIds.length === 0) {
        console.log("Seller has no products, returning empty report");
        return res.json({
          date,
          totalProductsSold: 0,
          totalRevenue: 0,
          productBreakdown: {},
        });
      }

      query.items = {
        $elemMatch: { productId: { $in: sellerProductIds } },
      };
    }

    // Add productId filter if provided (for both seller and admin)
    if (productId) {
      if (
        typeof productId !== "string" ||
        !mongoose.Types.ObjectId.isValid(productId)
      ) {
        return res.status(400).json({ error: "Invalid productId format" });
      }
      const productObjectId = new mongoose.Types.ObjectId(productId);
      query.items = query.items
        ? {
            $elemMatch: {
              $and: [{ productId: productObjectId }, query.items.$elemMatch],
            },
          }
        : { $elemMatch: { productId: productObjectId } };
      console.log("Filtering by productId:", productId);
    }

    console.log("Final Query:", JSON.stringify(query, null, 2));

    // Fetch all orders for debugging
    const allOrdersOnDate = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: "completed",
    });
    console.log("All Completed Orders on Date:", allOrdersOnDate.length);

    // Fetch filtered orders
    const orders = await Order.find(query).populate(
      "items.productId",
      "name price"
    );
    console.log("Filtered Orders:", orders.length);

    if (orders.length === 0) {
      console.log("No matching orders found");
      return res.json({
        date,
        totalProductsSold: 0,
        totalRevenue: 0,
        productBreakdown: {},
      });
    }

    // Calculate totals and breakdown
    let totalProductsSold = 0;
    let totalRevenue = 0;
    const productBreakdown = {};

    for (const order of orders) {
      console.log("Processing Order:", order._id);
      for (const item of order.items) {
        const product = item.productId; // Already populated
        console.log("Processing Item:", {
          productId: item.productId,
          quantity: item.quantity,
        });

        // For admins, include all items; for sellers, query already filtered
        totalProductsSold += item.quantity;
        const itemRevenue = item.price * item.quantity;
        totalRevenue += itemRevenue;

        // Build product breakdown
        const productIdStr = product._id.toString();
        if (!productBreakdown[productIdStr]) {
          productBreakdown[productIdStr] = {
            name: product.name,
            quantitySold: 0,
            revenue: 0,
          };
        }
        productBreakdown[productIdStr].quantitySold += item.quantity;
        productBreakdown[productIdStr].revenue += itemRevenue;
      }
    }

    const report = {
      date,
      totalProductsSold,
      totalRevenue,
      productBreakdown,
    };

    console.log("Generated Report:", report);
    res.json(report);
  } catch (error) {
    console.error("Error in /reports/daily:", error);
    res.status(500).json({
      error: "Failed to generate daily report",
      details: error.message,
    });
  }
};
// Total report endpoint (dynamic with date range and product filtering)
const totalReport = async (req, res) => {
  try {
    const { startDate, endDate, product, exportFormat } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res
        .status(400)
        .json({ error: "Dates must be in YYYY-MM-DD format" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date values" });
    }
    if (start > end) {
      return res
        .status(400)
        .json({ error: "startDate must be before endDate" });
    }

    // Set time boundaries
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    // Build order query
    const query = {
      createdAt: { $gte: start, $lte: end },
      status: "completed",
    };

    // Seller-specific filtering for orders
    if (req.userInfo.role === "seller") {
      const sellerProductIds = await Product.find({
        sellerId: req.userInfo._id,
      }).distinct("_id");
      if (sellerProductIds.length === 0) {
        return res.json({
          period: `${startDate} to ${endDate}`,
          totalRevenue: 0,
          totalProductsSold: 0,
          productBreakdown: {},
          topSellingProducts: [],
          topSearchedProducts: [],
        });
      }
      query.items = { $elemMatch: { productId: { $in: sellerProductIds } } };
    }

    // Filter by product if provided
    if (product) {
      if (!mongoose.Types.ObjectId.isValid(product)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const productObjectId = new mongoose.Types.ObjectId(product);
      query.items = query.items
        ? {
            $elemMatch: {
              $and: [{ productId: productObjectId }, query.items.$elemMatch],
            },
          }
        : { $elemMatch: { productId: productObjectId } };
    }

    // console.log("Order Query:", JSON.stringify(query, null, 2));
    const orders = await Order.find(query).populate(
      "items.productId",
      "name price"
    );
    // console.log("Orders found:", orders.length);

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No sales found for this period" });
    }

    // Calculate product sales
    const productSales = await calculateProductSales(
      orders,
      req.userInfo.role === "seller" ? req.userInfo._id : null
    );

    // Calculate totals
    let totalRevenue = 0;
    let totalProductsSold = 0;
    for (const order of orders) {
      for (const item of order.items) {
        if (
          req.userInfo.role === "seller" &&
          !(await Product.findById(item.productId))?.sellerId.equals(
            req.userInfo._id
          )
        ) {
          continue;
        }
        totalRevenue += item.price * item.quantity;
        totalProductsSold += item.quantity;
      }
    }

    // Top 10 selling products
    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Top 10 searched products with role-based filtering
    const role = req.userInfo?.role || null; // Optional: Filter by role
    const topSearchedProducts = await getTopSearchedProducts(start, end, role);

    const report = {
      period: `${startDate} to ${endDate}`,
      totalRevenue,
      totalProductsSold,
      productBreakdown: productSales,
      topSellingProducts: topProducts,
      topSearchedProducts: topSearchedProducts.map((s) => ({
        term: s._id,
        count: s.count,
      })),
    };

    // Export functionality
    switch (exportFormat?.toLowerCase()) {
      case "csv":
        const writer = createObjectCsvWriter({
          path: "report.csv",
          header: [
            { id: "period", title: "Period" },
            { id: "totalRevenue", title: "Total Revenue" },
            { id: "totalProductsSold", title: "Total Products Sold" },
          ],
        });
        await writer.writeRecords([report]);
        return res.download("report.csv");

      case "excel":
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Sales Report");
        sheet.columns = [
          { header: "Period", key: "period" },
          { header: "Total Revenue", key: "totalRevenue" },
          { header: "Total Products Sold", key: "totalProductsSold" },
        ];
        sheet.addRow(report);
        await workbook.xlsx.writeFile("report.xlsx");
        return res.download("report.xlsx");

      case "pdf":
        const pdfPath = "report.pdf";
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);
        doc.text(
          `Sales Report\nPeriod: ${report.period}\nRevenue: $${report.totalRevenue}\nProducts Sold: ${report.totalProductsSold}`
        );
        doc.end();

        // Wait for the file to finish writing
        await new Promise((resolve, reject) => {
          writeStream.on("finish", resolve);
          writeStream.on("error", reject);
        });

        // Send the file and optionally clean up
        return res.download(pdfPath, "report.pdf", (err) => {
          if (!err) {
            // Cleanup (optional)
            unlinkAsync(pdfPath).catch((cleanupErr) =>
              console.error("Failed to delete PDF:", cleanupErr)
            );
          }
        });

      default:
        return res.json(report);
    }
  } catch (error) {
    console.error("Error in totalReport:", error);
    return res.status(500).json({
      error: "Failed to generate report",
      details: error.message || "Unknown error",
    });
  }
};
//Monthly trends endpoint (dynamic)
const trendReport = async (req, res) => {
  try {
    const { year, month, product } = req.query;

    // Validate year parameter
    if (!year || !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: "Valid year (YYYY) is required" });
    }

    // Month name to number mapping (case-insensitive)
    const monthMap = {
      january: 1,
      jan: 1,
      february: 2,
      feb: 2,
      march: 3,
      mar: 3,
      april: 4,
      apr: 4,
      may: 5,
      june: 6,
      jun: 6,
      july: 7,
      jul: 7,
      august: 8,
      aug: 8,
      september: 9,
      sep: 9,
      october: 10,
      oct: 10,
      november: 11,
      nov: 11,
      december: 12,
      dec: 12,
    };

    // Parse month parameter (optional)
    let monthNum;
    if (month) {
      // Check if month is a number
      if (/^\d+$/.test(month)) {
        monthNum = parseInt(month, 10);
        if (monthNum < 1 || monthNum > 12) {
          return res
            .status(400)
            .json({ error: "Month number must be between 1 and 12" });
        }
      } else {
        // Assume month is a name
        monthNum = monthMap[month.toLowerCase()];
        if (!monthNum) {
          return res
            .status(400)
            .json({ error: "Invalid month name (e.g., 'March' or 'Mar')" });
        }
      }
    }

    // Build date range
    let startDate, endDate;
    if (monthNum) {
      // Specific month
      startDate = new Date(
        `${year}-${String(monthNum).padStart(2, "0")}-01T00:00:00.000Z`
      );
      endDate = new Date(startDate);
      endDate.setUTCMonth(endDate.getUTCMonth() + 1); // Next month
      endDate.setUTCMilliseconds(-1); // Last millisecond of the month
    } else {
      // Full year
      startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    }

    // Build query
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: "completed",
    };

    // Seller-specific filtering
    if (req.userInfo.role === "seller") {
      const sellerProductIds = await Product.find({
        sellerId: req.userInfo._id,
      }).distinct("_id");
      if (sellerProductIds.length === 0) {
        return res.json({
          year,
          ...(monthNum && { month: monthNum }),
          monthlyTrends: {},
        });
      }
      query.items = { $elemMatch: { productId: { $in: sellerProductIds } } };
    }

    // Filter by product if provided
    if (product) {
      if (!mongoose.Types.ObjectId.isValid(product)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const productObjectId = new mongoose.Types.ObjectId(product);
      query.items = query.items
        ? {
            $elemMatch: {
              $and: [{ productId: productObjectId }, query.items.$elemMatch],
            },
          }
        : { $elemMatch: { productId: productObjectId } };
    }

    console.log("Trend Query:", JSON.stringify(query, null, 2));
    const orders = await Order.find(query).populate(
      "items.productId",
      "name price"
    );
    console.log("Orders found:", orders.length);

    const monthlyTrends = {};
    for (const order of orders) {
      const date = new Date(order.createdAt);
      const monthKey = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = { revenue: 0, products: {} };
      }

      for (const item of order.items) {
        if (
          req.userInfo.role === "seller" &&
          !(await Product.findById(item.productId))?.sellerId.equals(
            req.userInfo._id
          )
        ) {
          continue;
        }

        const productName = item.productId?.name || "Unknown Product";
        monthlyTrends[monthKey].revenue += item.price * item.quantity;
        monthlyTrends[monthKey].products[productName] =
          (monthlyTrends[monthKey].products[productName] || 0) + item.quantity;
      }
    }

    res.json({
      year,
      ...(monthNum && { month: monthNum }), // Always return month as a number
      monthlyTrends,
    });
  } catch (error) {
    console.error("Error in trendReport:", error);
    res.status(500).json({
      error: "Failed to generate trends",
      details: error.message || "Unknown error",
    });
  }
};
//Sales Growth Comparison (YoY and MoM)
const yearAndMonthGrowth = async (req, res) => {
  try {
    const { startDate, endDate, compareStartDate, compareEndDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate || !compareStartDate || !compareEndDate) {
      return res
        .status(400)
        .json({ error: "All date parameters are required" });
    }

    // Convert dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    const compareStart = new Date(compareStartDate);
    const compareEnd = new Date(compareEndDate);

    // Validate date values
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: "Invalid startDate" });
    }
    if (isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid endDate" });
    }
    if (isNaN(compareStart.getTime())) {
      return res.status(400).json({ error: "Invalid compareStartDate" });
    }
    if (isNaN(compareEnd.getTime())) {
      return res.status(400).json({ error: "Invalid compareEndDate" });
    }
    if (start >= end) {
      return res
        .status(400)
        .json({ error: "startDate must be before endDate" });
    }
    if (compareStart >= compareEnd) {
      return res
        .status(400)
        .json({ error: "compareStartDate must be before compareEndDate" });
    }

    // Calculate sales for the current date range
    const currentSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lt: end },
          status: "completed",
        },
      },
      { $group: { _id: null, totalSales: { $sum: "$total" } } },
    ]);

    // Calculate sales for the comparison date range
    const compareSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: compareStart, $lt: compareEnd },
          status: "completed",
        },
      },
      { $group: { _id: null, totalSales: { $sum: "$total" } } },
    ]);

    // Calculate growth percentage
    const currentTotal = currentSales[0]?.totalSales || 0;
    const compareTotal = compareSales[0]?.totalSales || 0;
    const growth = ((currentTotal - compareTotal) / (compareTotal || 1)) * 100;

    res.json({
      current: {
        startDate: startDate,
        endDate: endDate,
        totalSales: currentTotal,
      },
      compare: {
        startDate: compareStartDate,
        endDate: compareEndDate,
        totalSales: compareTotal,
      },
      growth: growth.toFixed(2) + "%",
    });
  } catch (error) {
    console.error("Error calculating sales growth:", error);
    res.status(500).json({ error: "Error calculating sales growth" });
  }
};
const profitabilityAnalysis = async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find({});

    // Calculate gross profit and profit margin for each product
    const productsWithProfitability = calculateProfitability(products);

    // Categorize products as high-margin or low-margin
    const categorizedProducts = categorizeProducts(productsWithProfitability);

    // Return the results
    res.json(categorizedProducts);
  } catch (error) {
    console.error("Error in profitability analysis:", error);
    res.status(500).json({ error: "Failed to perform profitability analysis" });
  }
};
const getProductSalesHistory = async (req, res) => {
  try {
    const { productId } = req.params;

    // Fetch orders that include the specified product
    const salesHistory = await Order.find({
      "items.productId": productId,
      status: "completed", // Only include completed orders
    }).populate("items.productId", "name price");

    if (salesHistory.length === 0) {
      return res
        .status(404)
        .json({ message: "No sales history found for this product" });
    }

    // Format the response
    const formattedSalesHistory = salesHistory.map((order) => ({
      orderId: order._id,
      date: order.createdAt,
      totalAmount: order.total,
      items: order.items.filter(
        (item) => item.productId._id.toString() === productId
      ),
    }));

    res.json(formattedSalesHistory);
  } catch (error) {
    console.error("Error fetching product sales history:", error);
    res.status(500).json({ error: "Failed to fetch product sales history" });
  }
};
const scheduleReport = async (req, res) => {
  const { userId, frequency, reportType, email } = req.body;

  try {
    // Validate input
    if (!userId || !frequency || !reportType || !email) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Calculate the next run date
    const now = new Date();
    let nextRunDate;
    switch (frequency) {
      case "daily":
        nextRunDate = new Date(now.setDate(now.getDate() + 1));
        break;
      case "weekly":
        nextRunDate = new Date(now.setDate(now.getDate() + 7));
        break;
      case "monthly":
        nextRunDate = new Date(now.setMonth(now.getMonth() + 1));
        break;
      default:
        return res.status(400).json({ message: "Invalid frequency." });
    }

    // Create the scheduled report
    const scheduledReport = new ScheduledReport({
      userId,
      frequency,
      reportType,
      email,
      nextRun: nextRunDate,
    });
    await scheduledReport.save();

    res.status(201).json({
      message: "Scheduled report created successfully.",
      report: scheduledReport,
    });
  } catch (error) {
    console.error("Error creating scheduled report:", error);
    res.status(500).json({ message: "Error creating scheduled report." });
  }
};
const customerAnalysis = async (req, res) => {
  const { userId } = req.query;

  try {
    // Validate input
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    // Analyze customer sales
    const customerSales = await analyzeCustomerSales(userId);
    const topSegments = await analyzeTopCustomerSegments(userId);

    res.json({
      customerSales,
      topSegments,
    });
  } catch (error) {
    console.error("Error in customer analysis:", error);
    res.status(500).json({ message: "Error generating customer analysis." });
  }
};
export {
  dailyReport,
  getProductSalesHistory,
  profitabilityAnalysis,
  scheduleReport,
  totalReport,
  trendReport,
  yearAndMonthGrowth,
  customerAnalysis,
};
