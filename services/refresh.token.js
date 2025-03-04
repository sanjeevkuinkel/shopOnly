import { RefreshToken } from "../models/refresh.token.model.js";
import jwt from "jsonwebtoken";
import { generateTokens } from "../utils/token.js";

export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY
    );
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const userData = {
      userId: decoded._id,
      email: decoded.email,
    };
    const { accessToken } = generateTokens(userData);

    return res.json({
      accessToken,
      message: "Access token refreshed successfully",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      await RefreshToken.findOneAndDelete({ token: refreshToken });
      return res.status(403).json({ message: "Refresh token has expired" });
    }
    return res
      .status(403)
      .json({ message: "Invalid refresh token", error: error.message });
  }
};
