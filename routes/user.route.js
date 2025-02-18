import express from "express";
import {
  addToCart,
  createCart,
  createUser,
  deleteUserAndData,
  forgotPassword,
  getSingleUser,
  getUsers,
  loginUser,
  logoutUser,
  removeProduct,
  resetPassword,
  updateUserDetails,
  uploadProfilePicture,
  viewCart,
} from "../services/user.service.js";
import { refreshAccessToken } from "../services/refresh.token.js";
import { isAdmin, isBuyer, isUser } from "../middlewares/auth.middleware.js";
import upload from "../config/upload.js";

const router = express.Router();

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully.
 */
router.post("/user/register", createUser);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully.
 */
router.post("/user/login", loginUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully.
 */
router.get("/users", isAdmin, getUsers);

/**
 * @swagger
 * /user/update:
 *   put:
 *     summary: Update user details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User details updated successfully.
 */
router.put("/user/update", isUser, updateUserDetails);

/**
 * @swagger
 * /refreshToken:
 *   post:
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated.
 */
router.post("/refreshToken", refreshAccessToken);

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: Logout a user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully.
 */
router.post("/user/logout", isUser, logoutUser);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get a single user
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
 *         description: User details retrieved successfully.
 */
router.get("/user/:id", isAdmin, getSingleUser);

/**
 * @swagger
 * /user/delete/{id}:
 *   delete:
 *     summary: Delete a user
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
 *         description: User deleted successfully.
 */
router.delete("/user/delete/:id", isAdmin, deleteUserAndData);

/**
 * @swagger
 * /user/forgot-password:
 *   post:
 *     summary: Forgot password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset link sent.
 */
router.post("/user/forgot-password", forgotPassword);

/**
 * @swagger
 * /user/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     parameters:
 *       - in: path
 *         name: token
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully.
 */
router.post("/user/reset-password/:token", resetPassword);

/**
 * @swagger
 * /upload-profile-picture:
 *   post:
 *     summary: Upload profile picture
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully.
 */
router.post(
  "/upload-profile-picture",
  upload.single("profilePicture"),
  uploadProfilePicture
);

/**
 * @swagger
 * /cart/create:
 *   post:
 *     summary: Create a cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Cart created successfully.
 */
router.post("/cart/create", createCart);

/**
 * @swagger
 * /cart/{userId}/add:
 *   post:
 *     summary: Add product to cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product added to cart successfully.
 */
router.post("/cart/:userId/add", addToCart);

/**
 * @swagger
 * /cart/{userId}:
 *   get:
 *     summary: View cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart retrieved successfully.
 */
router.get("/cart/:userId", viewCart);

/**
 * @swagger
 * /cart/{userId}/remove:
 *   post:
 *     summary: Remove product from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product removed from cart successfully.
 */
router.post("/cart/:userId/remove", removeProduct);

export default router;