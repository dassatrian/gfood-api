// Importing packages
var mongoose = require("mongoose"); // Use mongoose for mongo schema
var env = require("dotenv").config(); // Use the .env file to load the variables
var express = require("express"); // Use express for routing
var cors = require("cors"); // Use for Cross Origni Resource Calls

// instantiate express app
const app = express();
const port = process.env.PORT || 5000; // Listen on port 5000

app.use(cors());
app.use(express.json()); // Get app to use express package

// Connection to mongoose
mongoose
  .connect(
    "mongodb://" +
      process.env.COSMOSDB_HOST +
      ":" +
      process.env.COSMOSDB_PORT +
      "/" +
      process.env.COSMOSDB_DBNAME +
      "?ssl=true&replicaSet=globaldb&retrywrites=false",
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      auth: {
        user: process.env.COSMODDB_USER,
        password: process.env.COSMOSDB_PASSWORD,
      },
    }
  )
  .then(() => console.log("Connection to CosmosDB successful"))
  .catch((err) => console.error(err));

// Route requests for /ingredients to /routes/ingredients in folder structure
const ingredientsRouter = require("./routes/ingredients");
const mealsRouter = require("./routes/meals");
const marketsRouter = require("./routes/markets");

// Handle incoming requests
app.use("/ingredients", ingredientsRouter);
app.use("/meals", mealsRouter);
app.use("/markets", marketsRouter);

// Start listening to requests
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
