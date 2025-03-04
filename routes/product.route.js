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
  searchProduct,
} from "../services/product.service.js";
const router = express.Router();

/**
 * @swagger
 * /product/create:
 *   post:
 *     summary: Create a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully.
 */
router.post("/product/create", isSeller, createProduct);

/**
 * @swagger
 * /product/detail/{id}:
 *   get:
 *     summary: Get a single product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details retrieved successfully.
 */
router.get("/product/detail/:id", isUser, getSingleProduct);

/**
 * @swagger
 * /product/seller/all:
 *   post:
 *     summary: Get all products for a seller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products retrieved successfully.
 */
router.post("/product/seller/all", isSeller, getSellerProduct);

/**
 * @swagger
 * /product/buyer/all:
 *   post:
 *     summary: Get all products for a buyer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products retrieved successfully.
 */
router.post("/product/buyer/all", isBuyer, getBuyerProduct);

/**
 * @swagger
 * /product/edit/{id}:
 *   put:
 *     summary: Edit product details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product details updated successfully.
 */
router.put("/product/edit/:id", isSeller, editProductDetails);

/**
 * @swagger
 * /product/latest:
 *   get:
 *     summary: Get latest products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest products retrieved successfully.
 */
router.get("/product/latest", isUser, getLatestProduct);

/**
 * @swagger
 * /product/delete/{id}:
 *   delete:
 *     summary: Delete a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully.
 */
router.delete("/product/delete/:id", isSeller, deleteProduct);

export default router;
