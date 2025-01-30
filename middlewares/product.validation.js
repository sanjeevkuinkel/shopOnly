import Joi from "joi";

export const addProductValidationSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(55),
  company: Joi.string().required().trim().min(2).max(55),
  price: Joi.number().required().min(0),
  image: Joi.string().trim(),
  description: Joi.string().required().trim().min(200).max(1000),
  category: Joi.string()
    .required()
    .trim()
    .valid(
      "grocery",
      "kitchen",
      "clothing",
      "electronics",
      "furniture",
      "bakery",
      "liquor",
      "sports"
    ),
  freeShipping: Joi.boolean(),
  quantity: Joi.number().required().min(1).integer(),
  color: Joi.array().items(Joi.string().lowercase()),
});

export const paginationDetailValidationSchema = Joi.object({
  page: Joi.number().integer().required().min(1),
  limit: Joi.number().integer().required().min(1),
  searchText: Joi.string().trim().allow(""),
});

export const buyerProductListValidationSchema = Joi.object({
  page: Joi.number().integer().required().min(1),
  limit: Joi.number().integer().required().min(1),
  searchText: Joi.string().trim().allow(""),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  category: Joi.array()
    .allow(null)
    .items(
      Joi.string()
        .required()
        .trim()
        .valid(
          "grocery",
          "kitchen",
          "clothing",
          "electronics",
          "furniture",
          "bakery",
          "liquor",
          "sports"
        )
    ),
});
