import { Product } from "../models/product.model.js";
import Search from "../models/search.model.js";

// Function to log a search
const logSearch = async (term, userId = null, role = "guest") => {
  try {
    const search = new Search({ term, userId, role });
    await search.save();
    console.log("Search logged:", term);
  } catch (error) {
    console.error("Error logging search:", error);
  }
};

export const searchProduct = async (req, res) => {
  const { query } = req.query; // The search term
  const userId = req.userInfo?._id; // Optional: User ID if authenticated
  const role = req.userInfo?.role || "guest";
  // Log the search
  await logSearch(query, userId, role);

  // Perform the search logic (e.g., find products matching the query)
  const results = await Product.find({
    name: { $regex: query, $options: "i" },
  });

  res.json(results);
};
