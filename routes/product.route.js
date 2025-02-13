import express from "express";
import { isBuyer, isSeller, isUser } from "../middlewares/auth.middleware.js";
import {
  createProduct,
  deleteProduct,
  editProductDetails,
  getBuyerProduct,
  getLatestProduct,
  getSellerProduct,
  getSingleProduct,
} from "../services/product.service.js";
const router = express.Router();
router.post("/product/create", isSeller, createProduct);
router.get("/product/detail/:id", isUser, getSingleProduct);
router.post("/product/seller/all", isSeller, getSellerProduct);
router.post("/product/buyer/all", isBuyer, getBuyerProduct);
router.put("/product/edit/:id", isSeller, editProductDetails);
router.get("/product/latest", isUser, getLatestProduct);
router.delete("/product/delete/:id", isSeller, deleteProduct);
export default router;
