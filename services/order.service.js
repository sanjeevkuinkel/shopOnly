import { User } from "../models/user.model";

const addToCArt = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    const user = await User.findById(userId);

    const existingItem = user.cart.find(
      (item) => item.productId.toString() === productId
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ productId, quantity });
    }

    await user.save();
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
//delete cart
const removeCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const user = await User.findById(userId);

    user.cart = user.cart.filter(
      (item) => item.productId.toString() !== productId
    );
    await user.save();
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "cart.productId"
    );
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
//checkout
const checkout = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId).populate("cart.productId");

    const order = new Order({
      userId,
      products: user.cart,
      total: user.cart.reduce(
        (sum, item) => sum + item.productId.price * item.quantity,
        0
      ),
    });

    await order.save();
    user.cart = []; // Clear cart after checkout
    await user.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export { addToCArt, removeCart, getCart, checkout };
