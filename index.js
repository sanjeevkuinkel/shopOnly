import express from "express";
import { dbConnect } from "./config/database.js";
import "dotenv/config";
import userRoutes from "./routes/user.route.js";
const app = express();
dbConnect();
const port = process.env.PORT || 4000;
app.use(express.json()); //this should be before route definition because route take json data
app.use(userRoutes);
app.listen(port, () => {
  console.log(`Server is Listening on Port http://localhost:${port}`);
});
