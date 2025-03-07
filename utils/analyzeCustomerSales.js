import { Order } from "../models/order.model.js";

export const analyzeCustomerSales = async (userId) => {
  // Fetch all completed orders for the user
  const orders = await Order.find({ userId, status: "completed" });

  let newCustomerRevenue = 0;
  let repeatCustomerRevenue = 0;

  // Calculate revenue for new and repeat customers
  for (const order of orders) {
    if (order.customerType === "new") {
      newCustomerRevenue += order.total;
    } else if (order.customerType === "repeat") {
      repeatCustomerRevenue += order.total;
    }
  }

  return {
    newCustomerRevenue,
    repeatCustomerRevenue,
    totalRevenue: newCustomerRevenue + repeatCustomerRevenue,
  };
};
