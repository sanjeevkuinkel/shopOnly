import express from "express";
import { dbConnect } from "./config/database.js";
import "dotenv/config";
import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/cart.route.js";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";
import { initializePassport, ensureAuthenticated } from "./auth2.0.js"; // Import from auth.js
import session from "express-session";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";
import rateLimit from "express-rate-limit";

const app = express();
dbConnect();
const port = process.env.PORT || 4000;
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // Limit each IP to 60 requests per minute
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable old-style headers
});
app.use(globalLimiter);
// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(assignId);
morgan.token("id", function getId(req) {
  return req.id;
});

app.use(
  morgan(
    ":id :method :url :response-time :date[] :http-version :remote-user :status "
  )
);
function assignId(req, res, next) {
  req.id = uuidv4();
  next();
}
app.use(express.json()); //this should be before route definition because route take json data
app.use(userRoutes);
app.use(productRoutes);
app.use(orderRoutes);
app.listen(port, () => {
  console.log(`Server is Listening on Port http://localhost:${port}`);
});
