// installing required packages
const router = require("express").Router();
const mongoose = require("mongoose");
let Meal = require("../models/meal.model");
let Ingredient = require("../models/ingredient.model");

// url for later to surface in responses
const meals_url = "https://gfood-api.azurewebsites.net/meals/";

// Meal search
// courtesy of https://github.com/nax3t/fuzzy-search/blob/master/routes/campgrounds.js
router.route("/").get((req, res) => {
  // First, check if there are any query parameters
  if (req.query.name) {
    // regex parse on all of the query terms
    const name = new RegExp(escapeRegex(req.query.name), "gi");
    // perform search
    Meal.find({ name: name }, (err, docs) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: err });
      } else {
        const response = {
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
        };
        res.status(200).json(response);
      }
    });
  } else {
    // if no query on name
    Meal.find((err, docs) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: err });
      } else {
        const response = {
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
        };
        res.status(200).json(response);
      }
    });
  }
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
          hsr: result.hsr,
          ghg: result.ghg,
          energy: result.energy,
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

// Function to create a search query
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// export this route
module.exports = router;
