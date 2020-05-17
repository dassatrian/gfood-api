// importing required packages
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

// instantiating schema
const Schema = mongoose.Schema;

// creating schema
const mealSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    name: { type: String, unique: true },
    description: { type: String },
    energy: { type: Number },
    ghg: { type: Number },
    hsr: { type: Number },
    ingredients: [
      {
        ingredient: {
          type: Schema.Types.ObjectId,
          ref: "Ingredient",
        },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// performing validation
mealSchema.plugin(uniqueValidator);

// saving the ingredient model
const Meal = mongoose.model("Meal", mealSchema);

// exporting the model
module.exports = Meal;
