// importing required packages
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

// instantiating schema
const Schema = mongoose.Schema;

// creating schema
const marketSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    name: { type: String, unique: true },
    address: { type: String },
    suburb: { type: String },
    postcode: { type: Number },
    state: { type: String },
    business_category: { type: String },
    lga: { type: String },
    region: { type: String },
    lon: { type: Number },
    lat: { type: Number },
  },
  {
    timestamps: true,
  }
);

// performing validation
marketSchema.plugin(uniqueValidator);

// saving the market model
const Market = mongoose.model("Market", marketSchema);

// exporting the model
module.exports = Market;
