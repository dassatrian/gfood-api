// installing required packages
const router = require("express").Router();
const mongoose = require("mongoose");
let Ingredient = require("../models/ingredient.model");

// url for later to surface in responses
const ingredients_url = "https://gfood-api.azurewebsites.net/ingredients/";

// Ingredient Search
router.route("/").get((req, res) => {
  if (req.query.name && req.query.hsr) {
    const name = new RegExp(escapeRegex(req.query.name), "gi");
    const hsr = req.query.hsr;
    ingredient_search = { name: name, hsr: { $lte: hsr } };
  } else if (req.query.hsr) {
    const hsr = req.query.hsr;
    ingredient_search = { hsr: { $lte: hsr } };
  } else if (req.query.name) {
    const name = new RegExp(escapeRegex(req.query.name), "gi");
    ingredient_search = { name: name };
  } else {
    ingredient_search = {};
  }

  Ingredient.find(ingredient_search, (err, docs) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: err });
    } else {
      const response = {
        count: docs.length,
        ingredients: docs.map((doc) => {
          return {
            name: doc.name,
            ingredient_type: doc.ingredient_type,
            hsr: doc.hsr,
            ghg: doc.ghg,
            energy: doc.energy,
            _id: doc._id,
            request: {
              type: "GET",
              url: ingredients_url + doc._id,
            },
          };
        }),
      };
      res.status(200).json(response);
    }
  });
});

// Adding ingredients
router.route("/add").post((req, res) => {
  const newIngredient = new Ingredient({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    ingredient_type: req.body.ingredient_type,
    description: req.body.description,
    energy: req.body.energy,
    hsr: req.body.hsr,
    hsr_id: req.body.hsr_id,
    ghg: req.body.ghg,
    emission_id: req.body.emission_id,
    protein: req.body.protein,
    sodium: req.body.sodium,
    sugar: req.body.sugar,
    saturated_fat: req.body.saturated_fat,
    fibre: req.body.fibre,
    fat: req.body.fat,
    carbohydrate: req.body.carbohydrate,
  });

  newIngredient
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Ingredient Added",
        addedIngredient: {
          name: result.name,
          ingredient_type: result.ingredient_type,
          _id: result._id,
          request: {
            type: "GET",
            url: ingredients_url + result._id,
          },
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Get an individual ingredient
router.route("/:id").get((req, res) => {
  Ingredient.findById(req.params.id)
    .then((docs) => {
      console.log(docs);
      if (docs) {
        res.status(200).json(docs);
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Delete an individual ingredient
router.route("/:id").delete((req, res) => {
  Ingredient.findByIdAndDelete(req.params.id)
    .then((result) => {
      res.status(200).json({
        message: "Ingredient deleted",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Update an individaul ingredient
router.route("/update/:id").put((req, res) => {
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

  Ingredient.update({ _id: req.params.id }, { $set: updateOps })
    .then((docs) => {
      console.log(docs);
      res.status(200).json({
        message: "Ingredient updated",
        request: {
          type: "GET",
          url: ingredients_url + req.params.id,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

// Function to create a search query
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// export this route
module.exports = router;
