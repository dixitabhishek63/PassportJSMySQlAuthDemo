var authController = require("../controllers/authcontroller.js");
var jwt = require("jsonwebtoken");
//sign the jwt
var signToken = user => {
  return jwt.sign(
    {
      iss: "shertech",
      sub: user.email,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1)
    },
    "secret_token"
  );
};
module.exports = function(app, passport) {
  app.get("/signup", authController.signup);

  app.get("/signin", authController.signin);

  app.get(
    "/dashboard",
    passport.authenticate("jwt-strategy", { session: false }),
    async (req, res, next) => {
      res.json({
        message: "Auth successful",
        user: req.user
      });
    }
  );

  app.get("/logout", authController.logout);

  app.post("/signup", async (req, res, next) => {
    passport.authenticate(
      "local-signup",
      { session: false },
      async (err, user, info) => {
        try {
          console.log(user);
          console.log(info);
          if (err || !user) {
            const error = new Error("An Error occured");
            return next(error);
          }
          req.login(user, { session: false }, async error => {
            if (error) return next(error);

            //Sign the JWT token and populate the payload with the user email and id
            const token = signToken(user);
            //Send back the token to the user
            return res.json({ username: user.email, token: token });
          });
        } catch (error) {
          return next(error);
        }
      }
    )(req, res, next);

    // passport.authenticate("local-signup", {
    //   successRedirect: "/dashboard",
    //   failureRedirect: "/signup"
    // } )
  });

  app.post("/signin", async (req, res, next) => {
    passport.authenticate(
      "local-signin",
      { session: false },
      async (err, user, info) => {
        try {
          console.log(user);

          console.log(info);
          if (err || !user) {
            const error = new Error("An Error occured");
            return next(error.message);
          }
          req.login(user, { session: false }, async error => {
            if (error) return next(error.message);

            //Sign the JWT token and populate the payload with the user email and id
            const token = signToken(user);
            //Send back the token to the user
            return res.json({ token });
          });
        } catch (error) {
          return next(error.message);
        }
      }
    )(req, res, next);
  });

  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/signin");
  }
};
