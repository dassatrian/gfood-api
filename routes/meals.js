// installing required packages
const router = require("express").Router(); // requiring the express router to organise the different endpoints
const mongoose = require("mongoose"); // requiring mongoose so we can make queries to mongo
let Meal = require("../models/meal.model"); // get the meals model so that we can perform queries/write to Cosmos
let Ingredient = require("../models/ingredient.model");

// url for later to surface in responses
const meals_url = "https://gfood-api.azurewebsites.net/meals/";

// Meal Search
router.route("/").get((req, res) => {
  // simple get request to the meals/ endpoint
  if (req.query.name && req.query.hsr) {
    // case when user filter meals by name and by health star rating
    const name = new RegExp(escapeRegex(req.query.name), "gi"); // parse the name from the querystring so that searching is optimised
    const hsr = req.query.hsr; // parse the health star rating from the querystring
    meal_search = { name: name, hsr: { $lte: hsr } }; // construct the search, return health star ratings that are less than or equal to that specified
  } else if (req.query.hsr) {
    // simple request to meals/ endpoint where user is only searching for meals by the health star rating
    const hsr = req.query.hsr; // parse the health star rating from the querystrying
    meal_search = { hsr: { $lte: hsr } }; // construct the search return health star ratings that are less than or equal to that specified
  } else if (req.query.name) {
    // simple get request to meals/ endpoint where user is searching for meals by name
    const name = new RegExp(escapeRegex(req.query.name), "gi"); // parse the name from the querystrying so that searching is optimised
    meal_search = { name: name }; // construct the search
  } else {
    // case where user isn't using any filters to get meals/
    meal_search = {}; // construct the search
  }

  Meal.find(meal_search).exec((err, docs) => {
    // actually performing query to Cosmos DB, using the Meals model
    if (err) {
      // handle errors
      console.log(err);
      res.status(500).json({ error: err }); // return a 500 (internal server error) with an error object
    } else {
      // successful case (happy path)
      const response = {
        // construct the response
        count: docs.length, // give a count of all the meals that are returned for the search
        meals: docs.map((doc) => {
          // for the main search, want to cut down on the fields displayed so it is easier on the front end
          return {
            _id: doc._id, // the mongo ID of the particular meal
            name: doc.name, // the name of the meal
            description: doc.description, // the description of the meal
            energy: doc.energy, // the energy of the meal (in kJ)
            ghg: doc.ghg, // the total greenhouse gas emissions of the meal (in kgCO2/100g)
            hsr: doc.hsr, // the average health star rating of the meal(between 0.5 and 5)
            ingredients: doc.ingredients, // return an array of all the ingredients in the meal
            request: {
              // a suggestive request to get more information about the meal (full view, not cut down)
              type: "GET",
              url: meals_url + doc._id,
            },
          };
        }),
      };
      res.status(200).json(response); // also return a 200 response to signify success
    }
  });
});

// Adding meals
router.route("/add").post((req, res) => {
  // simple post request to the meals/add endpoint when a user wants to create a meal
  const newMeal = new Meal({
    // initialise the Meal model and get the JSON body request that has been passed by front-end/user
    _id: mongoose.Types.ObjectId(), // create a new Object ID --> so that we can return it back to the user (will be console logged later)
    name: req.body.name, // the name of the meal given by the user
    description: req.body.description, // the description of the meal given by the user
    ingredients: req.body.ingredients, // the ingredients array of the meal given by the user (with ingredients mongo ID and quantity)
    hsr: req.body.hsr, // the average health star rating of the meal given by the user/front-end (between 0.5 and 5)
    ghg: req.body.ghg, // the total greenhouse gas emissions of the meal given by the user/front-end (in kgCO2/100g)
    energy: req.body.energy, // the total energy of the meal (in kJ)
  });
  return newMeal
    .save() // write the result to Cosmos DB
    .then((result) => {
      // handle the happy path
      console.log(result);
      res.status(201).json({
        // return back a 201 response (ie. success)
        message: "Meal Added", // friendly message to front-end
        addedMeal: {
          // provide information about the meal that was just added as verification
          _id: result._id,
          name: result.name,
          description: result.description,
          ingredients: result.ingredients,
          hsr: result.hsr,
          ghg: result.ghg,
          energy: result.energy,
        },
        request: {
          // a suggestive URL to view full information about the meal
          type: "GET",
          url: meals_url + result._id,
        },
      });
    })
    .catch((err) => {
      // handle the error
      console.log(err);
      res.status(500).json({ error: err }); // return back a 500 response, with a JSON object of the error for trouble-shooting
    });
});

// Get an individual meal
router.route("/:id").get((req, res) => {
  // a get response, but using the mongo ID for a particular meal (meals/{{mongo ID goes here}})
  Meal.findById(req.params.id) // perform a search of the meals Cosmos DB using a given ID in the URL
    .populate("ingredients.ingredient") // get all the information about the ingredients within the particular meal (will get the full ingredient model for each ingredient)
    .then((doc) => {
      // return back the response
      console.log(doc);
      if (doc) {
        res.status(200).json(doc); // return a 200, and also the actual result
      } else {
        // handle error (if the specified ID doesn't exist)
        res
          .status(404) // return 404
          .json({ message: "No valid entry found for provided ID" }); // friendly message
      }
    })
    .catch((err) => {
      // handle errors
      console.log(err);
      res.status(500).json({ error: err }); // return 500 with the error in a JSON response
    });
});

// Delete an individual meal
router.route("/:id").delete((req, res) => {
  // a delete request for a particular meal (meals/{{mongo id goes here}}) to get rid of meals
  Meal.deleteOne({ _id: req.params.id }) // using the id specified in the URL, delete the entry in Cosmos DB
    .then((result) => {
      // handle the happy path
      res.status(200).json({
        // return a 200 if the meal was deleted
        message: "Meal deleted", // friendly message
      });
    })
    .catch((err) => {
      // handle error
      console.log(err);
      res.status(500).json({ error: err }); // return a 500 with the error in a JSON response
    });
});

// Update an individual meal
router.route("/update/:id").put((req, res) => {
  // making updates to existing meals (based on mongo id)
  const updateOps = {};
  for (const ops of req.body) {
    // in the request body, get the property name and the value the user wishes to change
    updateOps[ops.propName] = ops.value; // expected request body
  }

  Meal.update({ _id: req.params.id }, { $set: updateOps }) // perform an update using the mongo id provided in url, and set based on request given
    .then((docs) => {
      // handle the happy path
      console.log(docs);
      res.status(200).json({
        // provide feedback to user that the meal was updated
        message: "Meal updated",
        request: {
          // suggestive URL to take the user to the ingredient
          type: "GET",
          url: meals_url + req.params.id,
        },
      });
    })
    .catch((err) => {
      // handle errors
      console.log(err);
      res.status(500).json({
        // 500 response with JSON object containing error message
        error: err,
      });
    });
});

// Function to create a search query
// courtesy of https://github.com/nax3t/fuzzy-search/blob/master/routes/campgrounds.js
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// export this route
module.exports = router;
