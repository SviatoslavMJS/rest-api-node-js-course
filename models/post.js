const { model, Schema } = require("mongoose");

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    creator: {
      type: Object,
      required: true,
      body: {
        name: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = model("Post", postSchema);
