import { checkMongoIdValidation } from "../middlewares/mongoIdValidator.js";
import {
  addProductValidationSchema,
  buyerProductListValidationSchema,
  paginationDetailValidationSchema,
} from "../middlewares/product.validation.js";
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
// get product details
const getSingleProduct = async (req, res) => {
  // extract id from params
  const productId = req.params.id;

  // check for mongo id validity
  const isValidMongoId = checkMongoIdValidation(productId);

  // if not valid, terminate
  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // find product
  const product = await Product.findOne({ _id: productId });

  // if not product, terminate
  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // return product
  return res.status(200).send(product);
};
// seller point of view
const getSellerProduct = async (req, res) => {
  // extract pagination details from req.body
  const paginationDetails = req.body;

  //validate pagination details
  try {
    await paginationDetailValidationSchema.validateAsync(paginationDetails);
  } catch (error) {
    // if not valid, terminate
    return res.status(400).send({ message: error.message });
  }

  // calculate skip
  const skip = (paginationDetails.page - 1) * paginationDetails.limit;

  // extract searchText
  const searchText = paginationDetails?.searchText;

  let match = {};

  match.sellerId = req.userInfo._id;
  if (searchText) {
    match.$or = [
      { name: { $regex: searchText, $options: "i" } },
      { description: { $regex: searchText, $options: "i" } },
      { company: { $regex: searchText, $options: "i" } },
    ];
  }

  // start find query
  const products = await Product.aggregate([
    {
      $match: match,
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: paginationDetails.limit,
    },
    {
      $project: {
        name: 1,
        price: 1,
        company: 1,
        description: 1,
        category: 1,
        image: 1,
      },
    },
  ]);

  // total products
  const totalMatchingProduct = await Product.find({
    sellerId: req.userInfo._id,
  }).countDocuments();

  // page calculation
  const totalPage = Math.ceil(totalMatchingProduct / paginationDetails.limit);

  return res.status(200).send({ products, totalPage });
};
// buyer point of view
const getBuyerProduct = async (req, res) => {
  try {
    // Extract pagination details from req.body
    const input = req.body;

    // Validate input
    try {
      await buyerProductListValidationSchema.validateAsync(input);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }

    // Calculate skip
    const skip = (input.page - 1) * input.limit;

    // Extract search parameters
    let { searchText, minPrice, maxPrice, category } = input;

    let match = {};

    // Search in both name and description
    if (searchText) {
      match.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { description: { $regex: searchText, $options: "i" } },
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      match.price = {};
      if (minPrice) match.price.$gte = minPrice;
      if (maxPrice) match.price.$lte = maxPrice;
    }

    // Case-insensitive category filter
    if (category?.length > 0) {
      match.category = { $in: category.map((c) => new RegExp(`^${c}$`, "i")) };
    }

    // Query products using aggregation pipeline
    const products = await Product.aggregate([
      { $match: match },
      { $skip: skip },
      { $limit: input.limit },
      {
        $project: {
          name: 1,
          price: 1,
          company: 1,
          description: 1,
          image: 1,
        },
      },
    ]);

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(match);
    const totalPage = Math.ceil(totalProducts / input.limit);

    // Log when no products are found
    if (products.length === 0) {
      console.log("⚠️ No products found for:", match);
    }

    return res.status(200).send({ products, totalPage });
  } catch (error) {
    console.error("❌ Error in getBuyerProduct:", error);
    return res.status(500).send({ message: "Internal server error." });
  }
};
// edit product
const editProductDetails = async (req, res) => {
  const productId = req.params.id;
  const newValues = req.body;

  // validate id for mongo id validity
  const isValidMongoId = checkMongoIdValidation(productId);

  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // validate newValues from req.body

  try {
    await addProductValidationSchema.validateAsync(newValues);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  // check for product existence using productId
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // check if logged in user is owner of product
  const isOwnerOfProduct = product.sellerId.equals(req.userInfo._id);

  if (!isOwnerOfProduct) {
    return res
      .status(403)
      .send({ message: "You are not owner of this product." });
  }

  // update product
  await Product.updateOne({ _id: productId }, newValues);

  return res.status(200).send({ message: "Product updated successfully." });
};
const deleteProduct = async (req, res) => {
  // extract id from params
  const productId = req.params.id;

  // validate id for mongo id validity
  const isValidMongoId = checkMongoIdValidation(productId);

  // if not valid mongo id, terminate
  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // find product
  const product = await Product.findOne({ _id: productId });

  // if, not product, terminate

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // check for product ownership
  // loggedInUser id must match with product's sellerId
  const isOwnerOfProduct = product.sellerId.equals(req.userInfo._id);

  // if no match, not allowed to delete
  if (!isOwnerOfProduct) {
    return res
      .status(403)
      .send({ message: "You are not owner of this product." });
  }

  // delete product
  await Product.deleteOne({ _id: productId });

  // send response
  return res.status(200).send({ message: "Product deleted successfully." });
};
// get latest 6 products
const getLatestProduct = async (req, res) => {
  const products = await Product.aggregate([
    { $match: {} },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 6,
    },
    {
      $project: {
        name: 1,
        description: 1,
        company: 1,
        price: 1,
        image: 1,
      },
    },
  ]);

  return res.status(200).send(products);
};
export {
  createProduct,
  deleteProduct,
  getSingleProduct,
  getSellerProduct,
  getBuyerProduct,
  editProductDetails,
  getLatestProduct,
};
