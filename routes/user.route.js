import express from "express";
import {
    addToCart,
  createUser,
  deleteUserAndData,
  getSingleUser,
  getUsers,
  loginUser,
  updateUserDetails,
} from "../services/user.service.js";
import { refreshAccessToken } from "../services/refresh.token.js";
import { isAdmin, isBuyer, isUser } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.post("/user/register", createUser);
router.post("/user/login", loginUser);
router.get("/user/:id", isAdmin, getSingleUser);
router.get("/users", isAdmin, getUsers);
// router.patch("/user", editUser);
router.put("/user/update", isUser, updateUserDetails);
router.delete("/user/delete/:id", isAdmin, deleteUserAndData);
router.post("/refreshToken", refreshAccessToken);
// Add product to cart
router.post("//:userId/add", isBuyer, addToCart);
export default router;
