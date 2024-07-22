const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");

const itemsPerPage = 2;

const clearImage = (imageUrl) => {
  fs.unlink(path.join(__dirname, "..", imageUrl), (err) =>
    console.log(
      err
        ? "FS_CLEAR_IMAGE_FAILED"
        : "FS_IMAGE_SUCCESSFULY_REMOVED - " + imageUrl
    )
  );
};

exports.getPosts = (req, res, next) => {
  const page = req.query.page || 1;
  let totalItems = 0;

  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    })
    .then((posts) => {
      if (!posts) {
        const error = new Error("No posts found.");
        error.statusCode = 404;
        throw error;
      }
      res
        .status(200)
        .json({ message: "Success", posts: posts ?? [], totalItems });
    })
    .catch((err) => {
      console.log("GET_POSTS_ERR", err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const file = req.file;
  const errors = validationResult(req);

  if (!errors.isEmpty() || !file) {
    const error = new Error(
      !file ? "Image is required field." : "Validation error."
    );
    error.statusCode = 422;
    throw error;
  }

  const { title, content, imageUrl } = req.body;
  let creator;
  const post = new Post({
    title,
    content,
    imageUrl: file.path,
    creator: req.userId,
  });

  return post
    .save()
    .then((newPost) => {
      console.log("POST_CREATED", newPost);
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((savedUser) => {
      return res.status(201).json({
        post,
        message: "Post created successfully!",
        creator: {
          _id: creator._id,
          name: creator.name,
        },
      });
    })
    .catch((err) => {
      console.log("CREATE_POST_ERR", err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Cant find a post.");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Success", post });
    })
    .catch((err) => {
      console.log("GET_POST_ERR", err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const { postId } = req.params;
  const file = req.file;
  const errors = validationResult(req);
  const isNewImage = !!file?.path;

  if (!errors.isEmpty()) {
    const error = new Error("Validation error.");
    error.statusCode = 422;
    throw error;
  }

  const { title, content } = req.body;
  const payload = {
    title,
    content,
    imageUrl: isNewImage ? file.path : undefined,
  };
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        throw new Error("Post not found.");
      }
      if (post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("Not alowed to update.");
        error.statusCode = 403;
        throw error;
      }

      return Post.findByIdAndUpdate(postId, payload, {
        returnDocument: "after",
      }).then((newPost) => {
        console.log("POST_UPDATED", newPost);
        res.status(201).json({
          message: "Post updated successfully!",
          post: newPost,
        });
        if (isNewImage) {
          clearImage(post.imageUrl);
        }
        return newPost;
      });
    })
    .catch((err) => {
      console.log("UPDATE_POST_ERR", err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        throw new Error("Post not found.");
      }

      if (post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("Not allowed to delete.");
        error.statusCode = 403;
        throw error;
      }

      clearImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((deletedPost) => User.findById(req.userId))
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then((user) => res.status(200).json({ message: "Successfully deleted." }))
    .catch((err) => {
      console.log("DELETE_POST_ERR", err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
