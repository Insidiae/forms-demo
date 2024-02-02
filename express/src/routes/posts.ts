import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

import { invariant } from "../utils/misc";

const router = express.Router();
const prisma = new PrismaClient();

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
    //! Express doesn't have req.formData(), instead we use
    //! its built-in body parser to get submission values directly in req.body
    const formData = req.body;

    //? This means we also get values using formData.[fieldName] instead of formData.get(fieldName)
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

      await prisma.post.create({
        data: {
          title: result.data.title,
          //? Can't store arrays in SQLite, so just turn em into a comma-separated string
          tags: result.data.tags?.join(","),
          content: result.data.content,
        },
      });

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
