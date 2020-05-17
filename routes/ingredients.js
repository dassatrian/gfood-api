// installing required packages
const router = require("express").Router(); // router to handle the endpoints in /ingredients
const mongoose = require("mongoose"); // mongoose to handle Mongo
let Ingredient = require("../models/ingredient.model"); // require ingredient model that we created earlier

// url for later to surface in responses
const ingredients_url = "https://gfood-api.azurewebsites.net/ingredients/";

// Ingredient Search
router.route("/").get((req, res) => {
  // simple get request to return all the ingredients
  if (req.query.name && req.query.hsr) {
    // check the request to see if user is querying based on name and health star rating
    const name = new RegExp(escapeRegex(req.query.name), "gi"); // parse the name from the query
    const hsr = req.query.hsr; // parse the health star rating from the query
    ingredient_search = { name: name, hsr: { $lte: hsr } }; // construct the mongo search query, return health star ratings that are less than or equal to that specified
  } else if (req.query.hsr) {
    // if the user is only searching using health star rating
    const hsr = req.query.hsr; // parse the health star rating from the query string
    ingredient_search = { hsr: { $lte: hsr } }; // construct the search, return health star ratings that are less than or equal to that specified
  } else if (req.query.name) {
    // if the user is only searching for ingredients by their name
    const name = new RegExp(escapeRegex(req.query.name), "gi"); // parse the name from the query
    ingredient_search = { name: name }; // construct the search, by name
  } else {
    // if user hasn't specified any search filters/queries
    ingredient_search = {}; // construct the search, get all results
  }

  Ingredient.find(ingredient_search)
    .sort({ hsr: -1, ghg: 1 }) // sort health star rating in descending order and greenhouse gasses in ascending order to prioritise healthier foods
    .exec((err, docs) => {
      // perform the search, based on queries constructed prior
      if (err) {
        // handle errors
        console.log(err);
        res.status(500).json({ error: err }); // 500 response (internal error) with a JSON object containing the error code
      } else {
        // handle happy path
        const response = {
          // construct a response based on the matches of the search
          count: docs.length, // give a count of all the ingredients that match the search
          ingredients: docs.map((doc) => {
            // return back a cut-down version of the ingredient model so it is easier on the front-end
            return {
              name: doc.name, // name of the ingredient
              ingredient_type: doc.ingredient_type, // type of ingredient
              hsr: doc.hsr, // health star rating of the ingredient (between 0.5 and 5)
              ghg: doc.ghg, // greenhouse gas emissions of the ingredient (in kgCO2/100g)
              energy: doc.energy, // energy of the ingredient (in kJ)
              _id: doc._id, // mongo id of the ingredient
              request: {
                // friendly url to access the full model of the ingredient
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
  // an endpoint for the user to add an ingredient
  const newIngredient = new Ingredient({
    // instantiate a new ingredient based on the model we specified earlier
    _id: new mongoose.Types.ObjectId(), // assign a new unique mongo ID to this ingredient (we will be returning this later)
    name: req.body.name, // the name of the ingredient from the response body
    ingredient_type: req.body.ingredient_type, // the ingredient type from the response body
    description: req.body.description, // a description of the ingredient from the response body
    energy: req.body.energy, // the energy content (in kJ) of the ingredient from the response bdy
    hsr: req.body.hsr, // the health star rating (between 0.5 and 5) from the response bdy
    hsr_id: req.body.hsr_id, // the health star rating ID, which was used to calculate the health star rating from the response body
    ghg: req.body.ghg, // the greenhouse gas emissions (in kgCO2/100g) of the ingredient, from the response body
    emission_id: req.body.emission_id, // the emission ID, which was used to classify the ingredient and get the greenhouse gas emissions of the ingredient
    protein: req.body.protein, // the protein content of the ingredient (in g) from the response body
    sodium: req.body.sodium, // the sodium content of the ingredient (in mg) from the response body
    sugar: req.body.sugar, // the sugar content of the ingredient (in g) from the response body
    saturated_fat: req.body.saturated_fat, // the saturated fat content of the ingredient (in g) from the response body
    fibre: req.body.fibre, // the fibre content of the ingredient (in g) from the response body
    fat: req.body.fat, // the fat content of the ingredient (in g) from the response body
    carbohydrate: req.body.carbohydrate, // the carbohydrate content of the ingredient (in g) from the response body
  });

  newIngredient
    .save() // save the new ingredient created to Cosmos DB
    .then((result) => {
      console.log(result);
      res.status(201).json({
        // return a 201 to indicate the ingredient has been added
        message: "Ingredient Added", // friendly message to confirm
        addedIngredient: {
          // return a JSON object for some user validation of the ingredient they just entered
          name: result.name,
          ingredient_type: result.ingredient_type,
          _id: result._id,
          request: {
            // a friendly URL to access the full data model of the ingredient
            type: "GET",
            url: ingredients_url + result._id,
          },
        },
      });
    })
    .catch((err) => {
      // handle errors
      console.log(err);
      res.status(500).json({ error: err }); // return a 500 response (internal server error) and return a JSON object which contains the error message
    });
});

// Get an individual ingredient
router.route("/:id").get((req, res) => {
  // getting an individual ingredient by its mongo id
  Ingredient.findById(req.params.id) // get the mongo id for the ingredient from the URL and perform a search of Cosmos DB
    .then((docs) => {
      // return back the matching result
      console.log(docs);
      if (docs) {
        // happy path (ie. result found)
        res.status(200).json(docs); // return back a 200 and the actual ingredient (full model)
      } else {
        // ingredient not found
        res
          .status(404) // return back a 404 (ie. ingredient not found)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch((err) => {
      // error handling
      console.log(err);
      res.status(500).json({ error: err }); // return back a 500 response (internal server error) and a JSON object containing the error message
    });
});

// Delete an individual ingredient
router.route("/:id").delete((req, res) => {
  // deleting an individual ingredient from the database, by its mongo id
  Ingredient.findByIdAndDelete(req.params.id) // find the ingredient by its mongo ID specified in the url ingredients/{{mongo id goes here}} and delete it from Cosmos
    .then((result) => {
      // happy path: ingredient found and deleted
      res.status(200).json({
        message: "Ingredient deleted",
      });
    })
    .catch((err) => {
      // handle errors
      console.log(err);
      res.status(500).json({ error: err }); // return a 500 response (internal server error) and return a JSON object containing the error message
    });
});

// Update an individaul ingredient
router.route("/update/:id").put((req, res) => {
  // make changes to the data of an individual ingredient, based on mongo id specified
  const updateOps = {};
  for (const ops of req.body) {
    // user needs to specifiy the property name they wish to change and the value that they want to change (can do multiple at a time)
    updateOps[ops.propName] = ops.value;
  }

  Ingredient.update({ _id: req.params.id }, { $set: updateOps }) // using the request ID from the URL and the parameter and value they want to change, make the update
    .then((docs) => {
      // happy path: the ingredient was found and updated
      console.log(docs);
      res.status(200).json({
        message: "Ingredient updated",
        request: {
          // a suggestive URL to access the full ingredient model (could be used to validate the changes made)
          type: "GET",
          url: ingredients_url + req.params.id,
        },
      });
    })
    .catch((err) => {
      // error handling
      console.log(err);
      res.status(500).json({
        // return a 500 response (internal server error) and a JSON object containing the error message
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
