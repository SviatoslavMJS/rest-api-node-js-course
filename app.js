const path = require("path");
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const bodyParser = require("body-parser");
require("@dotenvx/dotenvx").config();

const feedRoutes = require("./routes/feed");

const connectionUrl = process.env.NODE_MONGO_CONNECTION_URL;

const fileStorage = multer.diskStorage({
  destination: "images",
  filename: function (req, { filename, originalname }, cb) {
    cb(null, `${uuidv4()}-${originalname ?? ""}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cd(null, false);
  }
};

const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const { statusCode, message } = error;
  return res.status(statusCode ?? 500).json({ message });
});

mongoose
  .connect(connectionUrl)
  .then(() => {
    console.log("MONGODB_CONNECTED");
    app.listen(8080);
  })
  .catch((err) => console.log("CONNECTION_ERR", err));
