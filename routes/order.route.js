import express from "express";
const router = express.Router();
router.post("/order/create", createOrder);
router.get("/order/:id", getSingleOrder);
router.get("/orders", getOrders);
router.put("/order/:id", editOrder);
router.patch("/order/:id", editOrderPart);
router.delete("/order/delete", deleteOrder);
export { router };
