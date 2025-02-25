import express from "express";
import { isBuyer } from "../middlewares/auth.middleware.js";
import {
  addToCart,
  checkout,
  getCart,
  removeCart,
} from "../services/cart.service.js";

const router = express.Router();
router.post("/cart/add", isBuyer, addToCart);
router.post("/cart/remove", isBuyer, removeCart);
router.get("/cart", isBuyer, getCart);
router.post("/checkout", isBuyer, checkout);
export default router;
