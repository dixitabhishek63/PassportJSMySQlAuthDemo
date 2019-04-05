var express = require("express");
var app = express();
var cors = require("cors");
var passport = require("passport");

var bodyParser = require("body-parser");
var env = require("dotenv").config({ path: __dirname + "/.env" });
var exphbs = require("express-handlebars");
var logger = require("morgan");
//For BodyParser
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(cors());

app.use(passport.initialize());

//For Handlebars views
app.set("views", "./app/views");
app.engine(
  "hbs",
  exphbs({
    extname: ".hbs"
  })
);
app.set("view engine", ".hbs");

//Models
var models = require("./app/models");

//Routes
app.get("/", function(req, res) {
  res.send("Welcome to Shertech app");
});

var authRoute = require("./app/routes/auth.js")(app, passport);

//load passport strategies
require("./app/config/passport/passport.js")(passport, models.user);

//Sync Database
models.sequelize
  .sync()
  .then(function() {
    console.log("Nice! Database looks fine");
  })
  .catch(function(err) {
    console.log(err, "Something went wrong with the Database Update!");
  });

app.listen(5000, function(err) {
  if (!err) console.log("Site is live");
  else console.log(err);
});
