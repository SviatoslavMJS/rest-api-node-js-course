const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

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
