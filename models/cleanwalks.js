const mongoose = require("mongoose");

const cleanwalkCoordinatesSchema = mongoose.Schema({
  longitude: Number,
  latitude: Number,
});

const messageSchema = mongoose.Schema({
  user: String,
  message: String,
  date: Date,
});

const cleanwalkSchema = mongoose.Schema({
  cleanwalkTitle: String,
  cleanwalkDescription: String,
  cleanwalkCity: { type: mongoose.Schema.Types.ObjectId, ref: "cities" },
  cleanwalkCoordinates: cleanwalkCoordinatesSchema,
  startingDate: Date,
  endingDate: Date,
  toolBadge: [String],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  participantsList: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  messages: [messageSchema],
});



const cleanwalkModel = mongoose.model("cleanwalks", cleanwalkSchema);
module.exports = cleanwalkModel;
