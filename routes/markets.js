// installing required packages
const router = require("express").Router(); // router to handle the different endpoints of markets/
const mongoose = require("mongoose"); // mongoose to handle Mongo queries
let Market = require("../models/market.model"); // get the market model we made earlier

// url for later to surface in responses
const markets_url = "https://gfood-api.azurewebsites.net/markets/";

// Adding markets --> FOR DATA LOADING ONLY!
router.route("/add").post((req, res) => {
  // markets/add endpoint for loading in new markets
  const newMarket = new Market({
    // create a new Mongo object based on the response body provided
    _id: new mongoose.Types.ObjectId(), // give the new entry a unique object ID --> will be returned later
    name: req.body.name, // name of the market given
    address: req.body.address, // address of the market given
    suburb: req.body.suburb, // suburb of the market given
    postcode: req.body.postcode, // postcode of the market given
    state: req.body.state, // state of the market given
    business_category: req.body.business_category, // business_category of the market given
    lga: req.body.lga, // local area of the market given
    region: req.body.region, // region of the market given
    lon: req.body.lon, // longitude of the market given
    lat: req.body.lat, // latitude of the market given
  });

  newMarket
    .save() // save the new Market entry to Cosmos DB
    .then((result) => {
      // handle the happy path
      console.log(result);
      res.status(201).json({
        // return a 201 to indicate successfully added a new market
        message: "Market Added", // some friendly text to user
        addedMarket: {
          // return some cut-down data of the market added as validation to the user
          name: result.name,
          _id: result._id,
          request: {
            // suggestive URL to see the full data model of the object
            type: "GET",
            url: markets_url + result._id,
          },
        },
      });
    })
    .catch((err) => {
      // handle errors
      console.log(err);
      res.status(500).json({ error: err }); // return a 500 (internal server error) and a JSON object with the error message
    });
});

// Delete an individual market
router.route("/:id").delete((req, res) => {
  // simple delete endpoint to remove a market by its mongo id
  Market.findByIdAndDelete(req.params.id) // take the id provided in the url, find the entry and delete it
    .then((result) => {
      // handle happy path
      res.status(200).json({
        message: "Market deleted", // friendly message for user + 200 response
      });
    })
    .catch((err) => {
      // handle errors
      console.log(err);
      res.status(500).json({ error: err }); // return 500 response (internal server error) and a JSON object with the error message
    });
});

// Market search
// courtesy of https://github.com/nax3t/fuzzy-search/blob/master/routes/campgrounds.js
router.route("/").get((req, res) => {
  // First, check if there are any query parameters
  if (req.query.name) {
    // regex parse on all of the query terms
    const name = new RegExp(escapeRegex(req.query.name), "gi");
    // perform search
    Market.find({ name: name }, (err, docs) => {
      if (err) {
        // handle error
        console.log(err);
        res.status(500).json({ error: err }); // return 500 response (internal server error) with a JSON object containing the error message
      } else {
        // handle happy path
        const response = {
          // construct a response
          count: docs.length, // provide a count of the number of results fetched
          markets: docs.map((doc) => {
            // cut down the information so it is easier on the front-end
            return {
              _id: doc._id, // mongo id of the market
              name: doc.name, // name of the market
              suburb: doc.suburb, // suburb of the market
              business_category: doc.business_category, // business category of the market
              lon: doc.lon, // longitude of the market
              lat: doc.lat, // latitude of the market
              request: {
                // suggestive URL to access the full data model of the market
                type: "GET",
                url: markets_url + doc._id,
              },
            };
          }),
        };
        res.status(200).json(response);
      }
    });
  } else {
    // if no query on name
    Market.find((err, docs) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: err });
      } else {
        const response = {
          count: docs.length,
          markets: docs.map((doc) => {
            return {
              _id: doc._id,
              name: doc.name,
              suburb: doc.suburb,
              business_category: doc.business_category,
              lon: doc.lon,
              lat: doc.lat,
              request: {
                type: "GET",
                url: markets_url + doc._id,
              },
            };
          }),
        };
        res.status(200).json(response);
      }
    });
  }
});

// Get an individual market
router.route("/:id").get((req, res) => {
  // simple get request using a mongo id of the market
  Market.findById(req.params.id) // using the mongo id specified in the url, find the entry in Cosmos DB
    .then((docs) => {
      // display the results on the front-end
      console.log(docs);
      if (docs) {
        // if there is a match (ie. the market exists)
        res.status(200).json(docs); // return a 200 (success) and return the result
      } else {
        // handle missing value
        res
          .status(404) // return 404 (ie. not found)
          .json({ message: "No valid entry found for provided ID" }); // friendly message to user
      }
    })
    .catch((err) => {
      // handle errors
      console.log(err);
      res.status(500).json({ error: err }); // 500 response with JSON object containing the error
    });
});

// Function to create a search query
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// export this route
module.exports = router;
