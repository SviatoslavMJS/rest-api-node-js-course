const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
require("@dotenvx/dotenvx").config();

const jwtSecretKey = process.env.JSON_WEB_TOKEN_SECRET_KEY;

const User = require("../models/user");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation error.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { email, name, password } = req.body;

  bcrypt
    .hash(password, 12)
    .then((cryptedPwd) => {
      const user = new User({ email, name, password: cryptedPwd });
      return user.save();
    })
    .then((user) =>
      res.status(201).json({ message: "Successfully created", user })
    )
    .catch((err) => {
      console.log("CREATE_USER_ERR", err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  let loadedUser;
  const { email, password } = req.body;

  User.findOne({ email: email })
    .then((user) => {
      {
        if (!user) {
          const error = new Error("Can't find user with this email.");
          error.statusCode = 401;
          throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
      }
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong user or password");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        jwtSecretKey,
        { expiresIn: "1h" }
      );

      return res.status(200).json({ token, userId: loadedUser._id.toString() });
    })
    .catch((err) => {
      console.log("CLOGIN_ERR", err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("Can't find user.");
        error.statusCode = 404;
        throw error;
      }
      return res.status(200).json({ message: "Success.", status: user.status });
    })
    .catch((err) => {
      console.log("GET_STATUS_ERR", err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateStatus = (req, res, next) => {
  const { status } = req.body;
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("Can't find user.");
        error.statusCode = 404;
        throw error;
      }
      user.status = status;
      return user.save();
    })
    .then((updatedUser) => {
      console.log("STATUS_UPDATED - " + updatedUser.status);
      res.status(200).json({ message: "Success.", status: updatedUser.status });
    })
    .catch((err) => {
      console.log("UPDATE_STATUS_ERR", err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
