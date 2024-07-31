const expect = require("chai").expect;
const sinon = require("sinon");
const mongoose = require("mongoose");
require("@dotenvx/dotenvx").config();

const io = require("../socket");
const User = require("../models/user");
const Post = require("../models/post");
const FeedController = require("../controllers/feed");

const userId = "66a15c1c3660c7bbb99bb2fb";
const connectionUrl = process.env.NODE_MONGO_TEST_CONNECTION_URL;

describe("Feed-Controller", function () {
  sinon.stub(io, "getIO");
  io.getIO.returns({ emit: () => {} });

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
      .then(() => done());
  });

  after(function (done) {
    io.getIO.restore();

    User.deleteOne({ _id: userId }).then(() =>
      Post.deleteMany({}).then(() => mongoose.disconnect().then(() => done()))
    );
  });

  it("Should add created post into creator posts.", function (done) {
    const req = {
      userId,
      file: {
        memoType: "image/jpg",
        path: "images/test.jpg",
      },
      body: {
        title: "Test post",
        content: "Some description",
      },
    };
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

    FeedController.createPost(req, res, () => {}).then(({ user, post }) => {
      expect(res.statusCode).to.be.equal(201);
      expect(user).to.have.property("posts");
      console.log(user);
      const filtered = user?.posts?.filter((id) => id.toString() === post._id.toString());
      expect(filtered).to.have.lengthOf(1);
      done();
    });
  });
});
