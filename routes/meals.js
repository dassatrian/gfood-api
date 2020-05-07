// installing required packages
const router = require("express").Router();
const mongoose = require("mongoose");
let Meal = require("../models/meal.model");
let Ingredient = require("../models/ingredient.model");

// url for later to surface in responses
const meals_url = "https://gfood-api.azurewebsites.net/meals/";

// Meal search
router.route("/").get((req, res) => {
  Meal.find()
    .populate("ingredients.ingredient", "_id name energy hsr ghg")
    .select("_id ingredients energy ghg hsr")
    .then((docs) => {
      console.log(docs);
      res.status(200).json({
        count: docs.length,
        meals: docs.map((doc) => {
          return {
            _id: doc._id,
            name: doc.name,
            description: doc.description,
            energy: doc.energy,
            ghg: doc.ghg,
            hsr: doc.hsr,
            ingredients: doc.ingredients,
            request: {
              type: "GET",
              url: meals_url + doc._id,
            },
          };
        }),
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Adding meals
router.route("/add").post((req, res) => {
  const newMeal = new Meal({
    _id: mongoose.Types.ObjectId(),
    name: req.body.name,
    description: req.body.description,
    ingredients: req.body.ingredients,
    hsr: req.body.hsr,
    ghg: req.body.ghg,
    energy: req.body.energy,
  });
  return newMeal
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Meal Added",
        addedMeal: {
          _id: result._id,
          name: result.name,
          description: result.description,
          ingredients: result.ingredients,
          hsr: req.body.hsr,
          ghg: req.body.ghg,
          energy: req.body.energy,
        },
        request: {
          type: "GET",
          url: meals_url + result._id,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Get an individual meal
router.route("/:id").get((req, res) => {
  Meal.findById(req.params.id)
    .populate("ingredients.ingredient")
    .then((doc) => {
      console.log(doc);
      if (doc) {
        res.status(200).json(doc);
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

// Delete an individual meal
router.route("/:id").delete((req, res) => {
  Meal.deleteOne({ _id: req.params.id })
    .then((result) => {
      res.status(200).json({
        message: "Meal deleted",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Update an individual meal
router.route("/update/:id").put((req, res) => {
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

  Meal.update({ _id: req.params.id }, { $set: updateOps })
    .then((docs) => {
      console.log(docs);
      res.status(200).json({
        message: "Meal updated",
        request: {
          type: "GET",
          url: meals_url + req.params.id,
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

// export this route
module.exports = router;
