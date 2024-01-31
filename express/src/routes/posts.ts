import express from "express";
import { z } from "zod";

import { invariant } from "../utils/misc";

const router = express.Router();

const titleMaxLength = 100;
const tagMaxLength = 25;
const contentMaxLength = 10000;

const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
  tags: z.array(z.string().min(1).max(tagMaxLength)).optional(),
  content: z.string().min(1).max(contentMaxLength),
});

router
  .route("/")
  .get((req, res) => {
    return res.render("posts-list");
  })
  .post((req, res) => {
    const formData = req.body;

    const title = formData.title;
    const content = formData.content;
    const intent = formData.intent;
    const tags = formData.tags ?? [];

    invariant(typeof intent === "string", "intent must be a string");

    if (intent === "list-insert") {
      tags.push("");
      return res.render("new-post", {
        status: "idle",
        submission: { title, tags, content },
        errors: null,
      });
    }

    if (intent.startsWith("list-remove")) {
      const idx = +intent.split("/")[1];
      tags.splice(idx, 1);
      return res.render("new-post", {
        status: "idle",
        submission: { title, tags, content },
        errors: null,
      });
    }

    if (intent === "submit") {
      const result = PostEditorSchema.safeParse({
        title,
        tags,
        content,
      });

      if (!result.success) {
        return res.render("new-post", {
          status: "error",
          submission: { title, tags, content },
          errors: result.error.flatten(),
        });
      }

      return res.redirect("/posts");
    }
  });

router.route("/new").get((req, res) => {
  return res.render("new-post", {
    status: "idle",
    //? EJS freaks out if I don't explicitly set these to null
    submission: null,
    errors: null,
  });
});

export default router;
