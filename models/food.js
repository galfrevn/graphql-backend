import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, minlength: 3 },
  type: { type: String, required: true, minlength: 3 },
  price: { type: Number, required: true, min: 2 },
  description: { type: String, required: false, minlength: 5 },
  slug: { type: String, required: true },
  stimatedTime: { type: Number, required: true, min: 1 },
  image: { type: String, required: false },
  stars: { type: Number, required: false, min: 0, max: 5 },

});

export default mongoose.model("Food", schema);
