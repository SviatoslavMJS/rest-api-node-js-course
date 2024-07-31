const expect = require("chai").expect;
const sinon = require("sinon");
const mongoose = require("mongoose");
require("@dotenvx/dotenvx").config();

const User = require("../models/user");
const AuthController = require("../controllers/auth");

const userId = "66a15c1c3660c7bbb99bb2fb";
const connectionUrl = process.env.NODE_MONGO_TEST_CONNECTION_URL;

describe("Auth-Controller", function () {
  before(function (done) {
    mongoose
      .connect(connectionUrl)
      .then((result) => {
        const user = new User({
          posts: [],
          _id: userId,
          name: "Test User",
          password: "qwerty",
          email: "test@example.com",
        });
        return user.save();
      })
      .then(() => done())
      .catch((err) => console.log("CONNECTION_ERR", err));
  });

  after(function (done) {
    User.deleteOne({ _id: userId }).then(() =>
      mongoose.disconnect().then(() => done())
    );
  });

  it("Should throw an error if accessing User database fails.", function (done) {
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const req = {
      body: {
        email: "email@example.com",
        password: "qwerty",
      },
    };

    AuthController.login(req, {}, () => {}).then((result) => {
      expect(result).to.be.an("error");
      expect(result).to.have.property("statusCode", 500);
      done();
    });

    User.findOne.restore();
  });

  it("Should send response with a valid user status for an existing user.", function (done) {
    const req = { userId };
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.userStatus = data.status;
      },
    };

    AuthController.getStatus(req, res, () => {}).then(() => {
      expect(res.statusCode).to.be.equal(200);
      expect(res.userStatus).to.be.equal("Active");
      done();
    });
  });
});
