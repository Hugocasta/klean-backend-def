const mongoose = require("mongoose");

const newsCoordinatesSchema  = mongoose.Schema({
    longitude: Number,
    latitude: Number,
})

const newsSchema = mongoose.Schema({
    newTitle: String,
    newsStartingDate: Date,
    newsEndingDate: Date,
    newsDescription: String,
    newsImage: String,
    newsCoordinates: {newsCoordinatesSchema},
    newsLike: Number,
})

const newsModel = mongoose.model("news", newsSchema);
module.exports = newsModel;

