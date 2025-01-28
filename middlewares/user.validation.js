import Joi from "joi";
import passwordComplexity from "joi-password-complexity";
const userValidationSchema = Joi.object({
  username: Joi.string().required().trim().min(5).max(20),
  email: Joi.string().email().required().trim().min(5).max(55).lowercase(),
  password: passwordComplexity({
    min: 8, // Minimum length
    max: 20, // Maximum length
    lowerCase: 1, // At least one lowercase letter
    upperCase: 1, // At least one uppercase letter
    numeric: 1, // At least one number
    symbol: 1, // At least one special character
    requirementCount: 4, // Total number of requirements to be met
  }).required(),
  firstName: Joi.string().required().trim().min(2).max(55),
  lastName: Joi.string().required().trim().min(2).max(55),
  gender: Joi.string()
    .required()
    .trim()
    .valid("male", "female", "preferNoyToSay"),
  location: Joi.string().required().trim().min(2).max(55),
  role: Joi.string().required().trim().valid("buyer", "seller", "admin"),
});
export { userValidationSchema };
