import bcrypt from "bcrypt";
import {
  loginCredentialsValidationSchema,
  registerUserValidationSchema,
  resetPasswordValidationSchema,
  updateUserValidationSchema,
} from "../middlewares/user.validation.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { generateTokens } from "../utils/token.js";
import { RefreshToken } from "../models/refresh.token.model.js";
import { checkMongoIdValidation } from "../middlewares/mongoIdValidator.js";
import { Cart } from "../models/cart.model.js";
import { BlacklistedToken } from "../models/blacklist.token.model.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { text } from "express";
const createUser = async (req, res) => {
  const newUser = req.body;
  try {
    await registerUserValidationSchema.validateAsync(newUser);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
  const user = await User.findOne({ email: newUser.email });
  if (user) {
    return res
      .status(409)
      .send({ message: "User with this email already exists." });
  }
  const hashedPassword = await bcrypt.hash(newUser.password, 10);
  newUser.password = hashedPassword;

  const registerUser = await User.create(newUser);

  res
    .status(201)
    .send({ message: "User Registered Successfully", registerUser });
};
const loginUser = async (req, res) => {
  const loginCredentials = req.body;
  try {
    await loginCredentialsValidationSchema.validateAsync(loginCredentials);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
  const user = await User.findOne({ email: loginCredentials.email });
  if (!user) {
    return res.status(409).send({ message: "Invalid Credentials." });
  }
  const passwordMatch = await bcrypt.compare(
    //either return true or false
    loginCredentials.password, //plain
    user.password //hashed
  );
  if (!passwordMatch) {
    return res.status(404).send({ message: "Invalid Credentials." });
  }
  const { accessToken, refreshToken } = generateTokens(user);
  user.password = undefined;
  await RefreshToken.create({ token: refreshToken, userId: user._id });
  res.status(200).send({ user, refreshToken, accessToken });
};
const updateUserDetails = async (req, res) => {
  const updatedUserDetails = req.body;
  try {
    await updateUserValidationSchema.validateAsync(updatedUserDetails);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
  const userId = req.userInfo._id;
  const hashedPassword = await bcrypt.hash(updatedUserDetails.password, 10);
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        password: hashedPassword,
        gender: updatedUserDetails.gender,
        location: updatedUserDetails.location,
      },
    }
  );
  return res.status(200).send({ message: "Profile is updated successfully." });
};
const deleteUserAndData = async (req, res) => {
  const userId = req.params.id;
  const isValidMongoId = checkMongoIdValidation(userId);
  if (!isValidMongoId) {
    res.status(400).send({ message: "Invalid Mongodb Id." });
  }
  console.log(req.userInfo._id);

  // await Blog.find({_id:userId})
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User Does not exist." });
    } else {
      // if(req.userInfo._id==userId)
      const product = await Product.find({ sellerId: userId }).deleteMany();
      if (!product) {
        return res.status(404).send({ message: "Product does not exist " });
      }
      await Product.deleteMany({ sellerId: userId });

      await User.deleteOne({ _id: userId });
      return res.status(200).send({ message: "User Deleted Successfully." });
    }
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
  }
};
const getUsers = async (req, res) => {
  try {
    const user = await User.find();
    if (!user) {
      return res.status(404).send({ message: "User Does not exist." });
    }
    res.status(200).send({ user });
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
  }
};
const getSingleUser = async (req, res) => {
  const userId = req.params.id;

  //validate mongodb id
  const isValidMongoId = checkMongoIdValidation(userId);
  if (!isValidMongoId) {
    res.status(400).send({ message: "Invalid Mongodb Id." });
  }
  try {
    // const user = await User.find({ _id: userId });
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User Does not Exist." });
    }

    res.status(200).send({ user });
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
  }
};
const addToCart = async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.inStock < quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [{ productId, quantity }] });
    } else {
      // Check if product already exists in cart
      const existingItem = cart.items.find((item) =>
        item.productId.equals(productId)
      );
      if (existingItem) {
        existingItem.quantity += quantity; // Increase quantity
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();
    res.status(201).json({ message: "Product added to cart", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding to cart", error: error.message });
  }
};
const logoutUser = async (req, res) => {
  try {
    const authorization = req?.headers?.authorization;
    const splittedArray = authorization?.split(" ");
    const token = splittedArray?.length === 2 && splittedArray[1];
    if (!token) {
      return res.status(401).send({ message: "Unauthorized. Token missing." });
    }
    // Store token in DB (Optional) - Prevent Reuse
    await BlacklistedToken.create({ token });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .send({ message: "Please provide registered email." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).send({ message: "User does not exist,please register." });
    }
    const token = jwt.sign(
      { email },
      process.env.JWT_FORGOT_PASSWORD_SECRET_KEY,
      { expiresIn: "1h" }
    );
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    // Update user document with token and expiration
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;

    await user.save();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASS,
      },
    });
    const resetLink = `${process.env.CLIENT_URL}/user/reset-password/${token}`;
    const receiver = {
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `We have received a password reset request. Please use the link below to reset your password:\n\n${resetLink}\n\nThis reset link will be valid only for 10 minutes.`,
    };
    await transporter.sendMail(receiver);
    return res.status(200).send({
      message:
        "Password reset link send successfully on your registered email.",
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong." });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const isValidPassword = await resetPasswordValidationSchema.validateAsync(
      req.body
    );
    if (!isValidPassword) {
      return res.status(400).send({ message: "Please provide the password" });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_FORGOT_PASSWORD_SECRET_KEY
    );
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    // Check if the reset token is still valid
    if (
      !user.passwordResetToken ||
      !user.passwordResetExpires ||
      Date.now() > user.passwordResetExpires
    ) {
      return res.status(400).send({ message: "Invalid or expired token." });
    }
    const newHashPassword = await bcrypt.hash(password, 10);
    user.password = newHashPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();
    return res
      .status(200)
      .send({ message: "Password reset successfully.    " });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Something went wrong." });
  }
};
const uploadProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  const filePath = `../uploads${req.file.filename}`;
  res.send(`File uploaded successfully. Path: ${filePath}`);
};

export {
  createUser,
  loginUser,
  updateUserDetails,
  deleteUserAndData,
  getUsers,
  getSingleUser,
  addToCart,
  logoutUser,
  forgotPassword,
  resetPassword,
  uploadProfilePicture,
};
