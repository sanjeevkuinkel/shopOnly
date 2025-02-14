import express from "express";
import { dbConnect } from "./config/database.js";
import "dotenv/config";
import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/product.route.js";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";
const app = express();
dbConnect();
const port = process.env.PORT || 4000;
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
app.listen(port, () => {
  console.log(`Server is Listening on Port http://localhost:${port}`);
});
