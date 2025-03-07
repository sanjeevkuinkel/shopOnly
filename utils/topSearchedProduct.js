import Search from "../models/search.model.js";

export const getTopSearchedProducts = async (
  startDate,
  endDate,
  role = null
) => {
  const matchQuery = {
    timestamp: { $gte: startDate, $lte: endDate },
  };

  // Optional: Filter by role (buyer, seller, or guest)
  if (role) {
    matchQuery.role = role;
  }

  //   console.log("Aggregation Match Query:", JSON.stringify(matchQuery, null, 2));

  const topSearched = await Search.aggregate([
    { $match: matchQuery }, // Filter by date range and role
    { $group: { _id: "$term", count: { $sum: 1 } } }, // Group by search term and count
    { $sort: { count: -1 } }, // Sort by count in descending order
    { $limit: 10 }, // Limit to top 10 results
  ]);

  //   console.log("Top Searched Products:", JSON.stringify(topSearched, null, 2));

  return topSearched;
};
