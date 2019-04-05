//load bcrypt
var bCrypt = require("bcrypt-nodejs");
var jwt = require("jsonwebtoken");
//var env = require("dotenv").config({ path: __dirname + "../../../.env" });

module.exports = function(passport, user) {
  var User = user;

  var LocalStrategy = require("passport-local").Strategy;

  const JWTstrategy = require("passport-jwt").Strategy;
  //We use this to extract the JWT sent by the user
  const ExtractJWT = require("passport-jwt").ExtractJwt;

  //This verifies that the token sent by the user is valid
  passport.use(
    "jwt-strategy",
    new JWTstrategy(
      {
        //secret we used to sign our JWT
        secretOrKey: "secret_token",
        //we expect the user to send the token as a query paramater with the name 'secret_token'
        jwtFromRequest: ExtractJWT.fromBodyField("secret_token")
      },

      async (token, done) => {
        try {
          //Pass the user details to the next middleware

          return done(null, token);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  //LOCAL SIGNIN
  passport.use(
    "local-signin",
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email

        usernameField: "email",

        passwordField: "password",

        passReqToCallback: true // allows us to pass back the entire request to the callback
      },

      function(req, email, password, done) {
        var User = user;

        var isValidPassword = function(userpass, password) {
          return bCrypt.compareSync(password, userpass);
        };

        User.findOne({
          where: {
            email: email
          }
        })
          .then(function(user) {
            if (!user) {
              return done(null, false, {
                message: "Email does not exist"
              });
            }

            if (!isValidPassword(user.password, password)) {
              return done(null, false, {
                message: "Incorrect password."
              });
            }

            var userinfo = user.get();
            // // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
            // var payload = { email: req.body.email, user: userinfo };
            // var token = jwt.sign(payload, "my secret key");
            // // { status: "ok", token: token }
            return done(null, userinfo);
          })
          .catch(function(err) {
            console.log("Error:", err);

            return done(null, false, {
              message: "Something went wrong with your Signin"
            });
          });
      }
    )
  );

  //LOCAL SIGNUP

  passport.use(
    "local-signup",
    new LocalStrategy(
      {
        usernameField: "email",

        passwordField: "password",

        passReqToCallback: true // allows us to pass back the entire request to the callback
      },

      function(req, email, password, done) {
        var generateHash = function(password) {
          return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
        };

        User.findOne({
          where: {
            email: email
          }
        }).then(function(user) {
          if (user) {
            return done(null, false, {
              message: "That email is already taken"
            });
          } else {
            var userPassword = generateHash(password);

            var data = {
              email: email,

              password: userPassword,

              firstname: req.body.firstname,

              lastname: req.body.lastname
            };

            User.create(data).then(function(newUser, created) {
              if (!newUser) {
                return done(null, false);
              }

              if (newUser) {
                //sign the jwt
                //  const token = signToken(newUser);
                return done(null, { newUser });
              }
            });
          }
        });
      }
    )
  );

  //serialize
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // deserialize user
  passport.deserializeUser(function(id, done) {
    User.findOne({
      where: {
        id: id
      }
    }).then(function(user) {
      if (user) {
        done(null, user.get());
      } else {
        done(user.errors, null);
      }
    });
  });
};
