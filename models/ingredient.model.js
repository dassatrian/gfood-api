// importing required packages
const mongoose = require("mongoose");

// instantiating schema
const Schema = mongoose.Schema;

// creating schema
const ingredientSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    name: { type: String, required: true },
    ingredient_type: { type: String },
    description: { type: String },
    energy: { type: Number, required: true },
    hsr: { type: Number },
    hsr_id: { type: String },
    ghg: { type: Number },
    emission_id: { type: String },
    protein: { type: Number, required: true },
    sodium: { type: Number, required: true },
    sugar: { type: Number, required: true },
    saturated_fat: { type: Number, required: true },
    fibre: { type: Number, required: true },
    fat: { type: Number },
    carbohydrate: { type: Number },
  },
  {
    timestamps: true,
  }
);

// saving the ingredient model
const Ingredient = mongoose.model("Ingredient", ingredientSchema);

// exporting the model
module.exports = Ingredient;
