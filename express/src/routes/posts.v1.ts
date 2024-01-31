import express from "express";

import { invariant } from "../utils/misc";

const router = express.Router();

type ActionErrors = {
  formErrors: Array<string>;
  fieldErrors: {
    title: Array<string>;
    content: Array<string>;
  };
};

const titleMaxLength = 100;
const contentMaxLength = 10000;

router
  .route("/")
  .get((req, res) => {
    res.render("posts-list");
  })
  .post((req, res) => {
    const formData = req.body;

    const title = formData.title;
    const content = formData.content;

    const errors: ActionErrors = {
      formErrors: [],
      fieldErrors: {
        title: [],
        content: [],
      },
    };

    invariant(typeof title === "string", "Title must be a string");
    invariant(typeof content === "string", "Content must be a string");

    if (title === "") {
      errors.fieldErrors.title.push("Title is required");
    }
    if (title.length > titleMaxLength) {
      errors.fieldErrors.title.push("Title must be at most 100 characters");
    }

    if (content === "") {
      errors.fieldErrors.content.push("Content is required");
    }
    if (content.length > contentMaxLength) {
      errors.fieldErrors.content.push(
        "Content must be at most 10000 characters"
      );
    }

    const hasErrors =
      errors.formErrors.length ||
      Object.values(errors.fieldErrors).some(
        (fieldErrors) => fieldErrors.length
      );
    if (hasErrors) {
      return res.render("new-post", {
        status: "error",
        submission: { title, content },
        errors,
      });
    }

    return res.redirect("/posts");
  });

router.route("/new").get((req, res) => {
  res.render("new-post", {
    status: "idle",
    submission: null,
    errors: null,
  });
});

export default router;
