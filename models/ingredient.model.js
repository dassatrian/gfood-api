// importing required packages
const mongoose = require("mongoose");

// instantiating schema
const Schema = mongoose.Schema;

// creating schema
const ingredientSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    name: { type: String },
    ingredient_type: { type: String },
    description: { type: String },
    energy: { type: Number },
    hsr: { type: Number },
    hsr_id: { type: String },
    ghg: { type: Number },
    emission_id: { type: String },
    protein: { type: Number },
    sodium: { type: Number },
    sugar: { type: Number },
    saturated_fat: { type: Number },
    fibre: { type: Number },
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
