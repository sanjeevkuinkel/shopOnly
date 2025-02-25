import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";

const addToCart = async (req, res) => {
  const { userId, productId, quantity = 1 } = req.body;

  try {
    // Log incoming request
    console.log("Request body:", req.body);

    // Validate input
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid userId or productId." });
    }

    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      return res
        .status(400)
        .json({ message: "Quantity must be a valid number >= 1." });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Cast productId to ObjectId
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Check if this product is already in the user's cart
    let cartItem = await Cart.findOne({ userId, productId: productObjectId });

    if (cartItem) {
      // Update existing cart item
      cartItem.quantity += parsedQuantity;
      console.log("Incrementing quantity for existing item:", cartItem);
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = new Cart({
        userId,
        productId: productObjectId,
        quantity: parsedQuantity,
      });
      console.log("Creating new cart item:", cartItem);
      await cartItem.save();
    }

    // Fetch all cart items for the user (optional, for response)
    const userCart = await Cart.find({ userId }).lean();
    console.log("User cart after update:", userCart);

    res.status(200).json({
      message: "Product added to cart.",
      cart: userCart,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    res.status(500).json({
      message: "Error adding to cart.",
      error: error.message,
    });
  }
};
//delete cart
const removeCart = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    // Log incoming request
    console.log("Request body:", req.body);

    // Validate input
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid userId or productId." });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Cast productId to ObjectId
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Find and remove the cart item
    const cartItem = await Cart.findOneAndDelete({
      userId,
      productId: productObjectId,
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    console.log("Removed cart item:", cartItem);

    // Fetch updated cart for the user
    const updatedCart = await Cart.find({ userId }).lean();
    console.log("User cart after removal:", updatedCart);

    res.status(200).json({
      message: "Product removed from cart.",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error in removeFromCart:", error);
    res.status(500).json({
      message: "Error removing from cart.",
      error: error.message,
    });
  }
};
const getCart = async (req, res) => {
  const { userId } = req.query; // Using query parameter

  try {
    // Log incoming request
    console.log("Query params:", req.query);

    // Validate input
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing userId." });
    }

    // Check if user exists (optional, depending on your design)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Fetch user's cart items
    const cartItems = await Cart.find({ userId })
      .populate("productId", "name price") // Optional: populate product details
      .lean();

    console.log("Fetched cart items:", cartItems);

    // Return cart items (empty or not)
    res.status(200).json({
      message: cartItems.length
        ? "Cart retrieved successfully."
        : "Cart is empty.",
      cart: cartItems,
    });
  } catch (error) {
    console.error("Error in getCart:", error);
    res.status(500).json({
      message: "Error retrieving cart.",
      error: "Internal server error.", // Generic message for the client
    });
  }
};
//checkout
const checkout = async (req, res) => {
  const { userId } = req.body;

  try {
    console.log("Request body:", req.body);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Fetch cart items with product details
    const cartItems = await Cart.find({ userId })
      .populate("productId", "name price") // Ensure Product schema has 'price'
      .lean();

    console.log("Cart items before checkout:", cartItems);

    if (!cartItems.length) {
      return res
        .status(400)
        .json({ message: "Cart is empty. Nothing to checkout." });
    }

    // Prepare order items and calculate total
    const orderItems = cartItems.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.price, // Price at checkout
    }));

    const total = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    console.log("Order items:", orderItems);
    console.log("Total amount:", total);

    // Save the order
    const order = new Order({
      userId,
      items: orderItems,
      total,
      status: "completed", // Assume success for now
    });
    await order.save();
    console.log("Order saved:", order);

    // Clear the cart
    await Cart.deleteMany({ userId });
    console.log("Cart cleared for user:", userId);

    // Verify cart is empty
    const updatedCart = await Cart.find({ userId }).lean();
    if (updatedCart.length > 0) {
      throw new Error("Failed to clear cart after checkout.");
    }

    res.status(200).json({
      message: "Checkout successful. Order created and cart cleared.",
      order: {
        _id: order._id,
        userId: order.userId,
        items: order.items,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      },
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error in checkout:", error);
    res.status(500).json({
      message: "Error during checkout.",
      error: error.message,
    });
  }
};
export { addToCart, removeCart, getCart, checkout };
