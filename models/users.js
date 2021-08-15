const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  city: { type: mongoose.Schema.Types.ObjectId, ref: "cities" },
  avatarUrl: String,
  token: String
});



const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
