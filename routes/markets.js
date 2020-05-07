// installing required packages
const router = require("express").Router();
const mongoose = require("mongoose");
let Market = require("../models/market.model");

// url for later to surface in responses
const markets_url = "https://gfood-api.azurewebsites.net/markets/";

// Adding markets --> FOR TEST ONLY!
router.route("/add").post((req, res) => {
  const newMarket = new Market({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    address: req.body.address,
    suburb: req.body.suburb,
    postcode: req.body.postcode,
    state: req.body.state,
    business_category: req.body.business_category,
    lga: req.body.lga,
    region: req.body.region,
    lon: req.body.lon,
    lat: req.body.lat,
  });

  newMarket
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Market Added",
        addedMarket: {
          name: result.name,
          _id: result._id,
          request: {
            type: "GET",
            url: markets_url + result._id,
          },
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Delete an individual market
router.route("/:id").delete((req, res) => {
  Market.findByIdAndDelete(req.params.id)
    .then((result) => {
      res.status(200).json({
        message: "Market deleted",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
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
  Market.findById(req.params.id)
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

// Find 5 closest markets --> NOT READY YET
router.route("/near_me").get((req, res) => {
  Market.find()
    .select("name hsr ghg energy")
    .then((docs) => {
      const response = {
        count: docs.length,
        ingredients: docs.map((doc) => {
          return {
            name: doc.name,
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
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Function to create a search query
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// export this route
module.exports = router;
