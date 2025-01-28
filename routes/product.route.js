import express from "express";
const router = express.Router();
router.post("/product/create", createProduct);
router.get("/product/:id", getSingleProduct);
router.get("/products", getProducts);
router.put("/product/:id", editProduct);
router.patch("/product/:id", editProductPart);
router.delete("/product/delete", deleteProduct);
export { router };
