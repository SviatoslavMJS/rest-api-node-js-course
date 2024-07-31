const expect = require("chai").expect;
const jwt = require("jsonwebtoken");
const sinon = require("sinon");

const isAuth = require("../middleware/is-auth");

describe("Auth-Middleware", function () {
  it("Should throw an error if no auth header is present.", function () {
    const req = {
      get: () => null,
    };
    expect(isAuth.bind(this, req, {}, () => {})).to.throw("Not authenticated.");
  });

  it("Should throw an error if auth header is string without ' '.", function () {
    const req = {
      get: () => "authorization",
    };
    expect(isAuth.bind(this, req, {}, () => {})).to.throw();
  });

  it("Should set userId to request with valid token.", function () {
    const req = {
      get: () => "Bearer authorization",
    };
    // stub method
    sinon.stub(jwt, "verify");
    // set return result
    jwt.verify.returns({ userId: "123" });

    isAuth(req, {}, () => {});
    expect(req).to.have.property("userId", "123");

    // check the method was called
    expect(jwt.verify.called).to.be.true;
    
    // restore method
    jwt.verify.restore();
  });
});
