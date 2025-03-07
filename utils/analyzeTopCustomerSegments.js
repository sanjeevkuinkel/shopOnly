import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

export const analyzeTopCustomerSegments = async (userId) => {
  // Fetch all completed orders for the user
  const orders = await Order.find({ userId, status: "completed" }).populate(
    "userId",
    "location"
  );

  const segmentRevenue = {};

  // Calculate revenue by customer segment (e.g., location)
  for (const order of orders) {
    const location = order.userId.location;
    const revenue = order.total;

    if (!segmentRevenue[location]) {
      segmentRevenue[location] = 0;
    }
    segmentRevenue[location] += revenue;
  }

  return segmentRevenue;
};
