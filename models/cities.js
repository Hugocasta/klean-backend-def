const mongoose = require("mongoose");

const cityCoordinatesSchema = mongoose.Schema({
  longitude: Number,
  latitude: Number,
});

const citySchema = mongoose.Schema({
  cityName: String,
  cityCoordinates: cityCoordinatesSchema,
  population: Number,
  cityCode: String,
});



const cityModel = mongoose.model("cities", citySchema);
module.exports = cityModel;

