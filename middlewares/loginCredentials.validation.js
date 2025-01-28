import Joi from "joi";

const loginCredentialsValidationSchema = Joi.object({
  email: Joi.string().email(    ).required().trim().lowercase(),
  password: Joi.string().required().trim(),
});
export { loginCredentialsValidationSchema };
