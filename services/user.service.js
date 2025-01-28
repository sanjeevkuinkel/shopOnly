import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { userValidationSchema } from "../middlewares/user.validation.js";
import { loginCredentialsValidationSchema } from "../middlewares/loginCredentials.validation.js";
import jwt from "jsonwebtoken";
const createUser = async (req, res) => {
  const newUser = req.body;
  try {
    await userValidationSchema.validateAsync(newUser);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
  const user = await User.findOne({ email: newUser.email });
  if (user) {
    return res
      .status(409)
      .send({ message: "User with this email already exists." });
  }
  const hashedPassword = await bcrypt.hash(newUser.password, 10);
  newUser.password = hashedPassword;

  const registerUser = await User.create(newUser);

  res
    .status(201)
    .send({ message: "User Registered Successfully", registerUser });
};
const loginUser = async (req, res) => {
  const loginCredentials = req.body;
  try {
    await loginCredentialsValidationSchema.validateAsync(loginCredentials);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
  const user = await User.findOne({ email: loginCredentials.email });
  if (!user) {
    return res.status(409).send({ message: "Invalid Credentials." });
  }
  const passwordMatch = await bcrypt.compare(
    //either return true or false
    loginCredentials.password, //plain
    user.password //hashed
  );
  if (!passwordMatch) {
    return res.status(404).send({ message: "Invalid Credentials." });
  }
  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_ACCESS_TOKEN_SECRET_KEY
  );
  user.password = undefined;
  res.status(200).send({ user, token });
};
export { createUser, loginUser };
