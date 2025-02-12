import express from "express";
import {
  addToCart,
  createUser,
  deleteUserAndData,
  forgotPassword,
  getSingleUser,
  getUsers,
  loginUser,
  logoutUser,
  resetPassword,
  updateUserDetails,
  uploadProfilePicture,
} from "../services/user.service.js";
import { refreshAccessToken } from "../services/refresh.token.js";
import { isAdmin, isBuyer, isUser } from "../middlewares/auth.middleware.js";
import upload from "../config/upload.js";
const router = express.Router();
router.post("/user/register", createUser);
router.post("/user/login", loginUser);
router.get("/users", isAdmin, getUsers);
// router.patch("/user", editUser);
router.put("/user/update", isUser, updateUserDetails);
router.post("/refreshToken", refreshAccessToken);
router.post("/user/logout", isUser, logoutUser);
// router.post("/:userId/add", isBuyer, addToCart);
router.get("/user/:id", isAdmin, getSingleUser);
router.delete("/user/delete/:id", isAdmin, deleteUserAndData);

router.post("/user/forgot-password", forgotPassword);
router.post("/user/reset-password/:token", resetPassword);
router.post(
  "/upload-profile-picture",
  upload.single("profilePicture"),
  uploadProfilePicture
);

export default router;
