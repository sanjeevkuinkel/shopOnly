import { addProductValidationSchema } from "../middlewares/product.validation.js";
import { Product } from "../models/product.model.js";
import { convertDollarToCents } from "../utils/utils.js";

const createProduct = async (req, res) => {
  const newProduct = req.body;
  try {
    await addProductValidationSchema.validateAsync(newProduct);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
  //add seller id
  newProduct.sellerId = req?.userInfo?._id;
  //convert price to lowest unit
  const priceInPaisa = convertDollarToCents(newProduct.price);
  newProduct.price = priceInPaisa;
  const product = await Product.create(newProduct);
  return res.status(201).send({ message: "New Product is Added Successfully" });
};

export { createProduct };
