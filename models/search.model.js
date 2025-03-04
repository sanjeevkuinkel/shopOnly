import mongoose from "mongoose";

const searchSchema = new mongoose.Schema({
  term: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Search = mongoose.model("Search", searchSchema);
export default Search;
