import jwt from "jsonwebtoken";

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { email: user.email, _id: user._id },
    process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY_TIME }
  );
  const refreshToken = jwt.sign(
    { email: user.email, _id: user._id },
    process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY_TIME }
  );
  return { accessToken, refreshToken };
};
