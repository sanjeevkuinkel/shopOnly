import bcrypt from "bcrypt";
import {
  loginCredentialsValidationSchema,
  registerUserValidationSchema,
  updateUserValidationSchema,
} from "../middlewares/user.validation.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { generateTokens } from "../utils/token.js";
import { RefreshToken } from "../models/refresh.token.model.js";
import { checkMongoIdValidation } from "../middlewares/mongoIdValidator.js";
import { Cart } from "../models/cart.model.js";
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

export {
  createUser,
  loginUser,
  updateUserDetails,
  deleteUserAndData,
  getUsers,
  getSingleUser,
  addToCart,
};
