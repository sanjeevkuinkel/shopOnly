import mongoose from "mongoose";

export const checkMongoIdValidation = (id) =>
  mongoose.Types.ObjectId.isValid(id);
