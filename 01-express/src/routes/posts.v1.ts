import express from "express";
import { PrismaClient } from "@prisma/client";

import { invariant } from "../utils/misc";
const prisma = new PrismaClient();

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
  .get(async (req, res) => {
    const posts = await prisma.post.findMany({
      select: {
        title: true,
        tags: true,
        content: true,
      },
    });

    return res.render("posts-list", { posts });
  })
  .post(async (req, res) => {
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
      return res.render("new-post-v1", {
        status: "error",
        submission: { title, content },
        errors,
      });
    }

    await prisma.post.create({
      data: { title, content },
    });

    return res.redirect("/posts");
  });

router.route("/new").get((req, res) => {
  res.render("new-post-v1", {
    status: "idle",
    submission: null,
    errors: null,
  });
});

export default router;
