import mongoose from "mongoose";
import { config } from "dotenv";

config()

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/food-db";

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("🍃 Connected to MongoDB");
}).catch(err => {
    console.error("💩 Error connecting to MongoDB:", err.message);
})