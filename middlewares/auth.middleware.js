import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { BlacklistedToken } from "../models/blacklist.token.model.js";
export const isSeller = async (req, res, next) => {
  try {
    const authorization = req?.headers?.authorization;
    const splittedArray = authorization?.split(" ");
    const token = splittedArray?.length === 2 && splittedArray[1];
    if (!token) {
      return res.status(401).send({ message: "Unauthorized. Token missing." });
    }
    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return res
        .status(403)
        .json({ message: "Token is no longer valid. Please log in again." });
    }
    let userData;
    try {
      userData = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);
    } catch (error) {
      return res.status(401).send({ message: "Invalid or expired token." });
    }
    const user = await User.findOne({ email: userData.email });
    if (!user) {
      return res.status(401).send({ message: "Unauthorized. User not found." });
    }

    // Check if user is a seller
    if (user.role !== "seller") {
      return res
        .status(403)
        .send({ message: "Forbidden. Seller access required." });
    }

    // Attach user info to request object
    req.userInfo = user;

    // Pass control to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in isSeller middleware:", error);
    return res.status(500).send({ message: "Internal server error." });
  }
};
export const isBuyer = async (req, res, next) => {
  try {
    const authorization = req?.headers?.authorization;
    const splittedArray = authorization?.split(" ");
    const token = splittedArray?.length === 2 && splittedArray[1];
    if (!token) {
      return res.status(401).send({ message: "Unauthorized. Token missing." });
    }
    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return res
        .status(403)
        .json({ message: "Token is no longer valid. Please log in again." });
    }
    let userData;
    try {
      userData = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);
    } catch (error) {
      return res.status(401).send({ message: "Invalid or expired token." });
    }
    const user = await User.findOne({ email: userData.email });
    if (!user) {
      return res.status(401).send({ message: "Unauthorized. User not found." });
    }

    // Check if user is a buyer
    if (user.role !== "buyer") {
      return res
        .status(403)
        .send({ message: "Forbidden. Buyer access required." });
    }

    // Attach user info to request object
    req.userInfo = user;

    // Pass control to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in isBuyer middleware:", error);
    return res.status(500).send({ message: "Internal server error." });
  }
};
export const isAdmin = async (req, res, next) => {
  try {
    const authorization = req?.headers?.authorization;
    const splittedArray = authorization?.split(" ");
    const token = splittedArray?.length === 2 && splittedArray[1];
    if (!token) {
      return res.status(401).send({ message: "Unauthorized. Token missing." });
    }
    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return res
        .status(403)
        .json({ message: "Token is no longer valid. Please log in again." });
    }
    let userData;
    try {
      userData = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);
    } catch (error) {
      return res.status(401).send({ message: "Invalid or expired token." });
    }
    const user = await User.findOne({ email: userData.email });
    if (!user) {
      return res.status(401).send({ message: "Unauthorized. User not found." });
    }

    // Check if user is a admin
    if (user.role !== "admin") {
      return res
        .status(403)
        .send({ message: "Forbidden. Admin access required." });
    }

    // Attach user info to request object
    req.userInfo = user;

    // Pass control to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    return res.status(500).send({ message: "Internal server error." });
  }
};
export const isUser = async (req, res, next) => {
  try {
    const authorization = req.headers?.authorization;
    if (!authorization) {
      return res.status(401).json({ message: "Unauthorized. Token missing." });
    }

    const splittedArray = authorization.split(" ");
    const token = splittedArray.length === 2 ? splittedArray[1] : null;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized. Token missing." });
    }

    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return res
        .status(403)
        .json({ message: "Token is no longer valid. Please log in again." });
    }

    // Verify JWT
    let userData;
    try {
      userData = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    // Find user in DB
    const user = await User.findOne({ email: userData.email });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    // Check if the user has a valid role
    const allowedRoles = ["seller", "admin", "buyer"];
    if (!allowedRoles.includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden. Access denied. Invalid role." });
    }
    req.userInfo = user;
    next();
  } catch (error) {
    console.error("Error in isUser middleware:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
export const isAdminOrSeller = async (req, res, next) => {
  try {
    const authorization = req.headers?.authorization;
    if (!authorization) {
      return res.status(401).json({ message: "Unauthorized. Token missing." });
    }

    const splittedArray = authorization.split(" ");
    const token = splittedArray.length === 2 ? splittedArray[1] : null;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized. Token missing." });
    }

    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return res
        .status(403)
        .json({ message: "Token is no longer valid. Please log in again." });
    }

    // Verify JWT
    let userData;
    try {
      userData = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    // Find user in DB
    const user = await User.findOne({ email: userData.email });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    // Check if the user has a valid role
    const allowedRoles = ["seller", "admin"];
    if (!allowedRoles.includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden. Access denied. Invalid role." });
    }
    req.userInfo = user;
    next();
  } catch (error) {
    console.error("Error in isUser middleware:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
