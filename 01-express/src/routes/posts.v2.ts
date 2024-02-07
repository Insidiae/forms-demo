import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

import { invariant } from "../utils/misc";

const prisma = new PrismaClient();

const router = express.Router();

const titleMaxLength = 100;
const contentMaxLength = 10000;
const tagMaxLength = 25;

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
    //? `express.urlencoded()` gives us the form data in `req.body`
    const formData = req.body;

    const title = formData.title;
    const content = formData.content;
    const intent = formData.intent;

    invariant(typeof title === "string", "Title must be a string");
    invariant(typeof content === "string", "Content must be a string");
    invariant(typeof intent === "string", "Intent must be a string");

    let tags: string[] = [];
    for (let [key, value] of Object.entries(formData)) {
      if (key.startsWith("tags[") && key.endsWith("]")) {
        //? Get the index number, e.g. tags[1] -> 1
        const index = +key.slice(5, -1);
        // You can also typecheck this with the `invariant()` utility:
        tags[index] = value as string;
      }
    }

    if (intent === "list-insert") {
      tags.push("");
      return res.render("new-post-v2", {
        status: "idle",
        submission: { title, tags, content },
        errors: null,
      });
    }

    if (intent.startsWith("list-remove")) {
      const idx = +intent.split("/")[1];
      tags.splice(idx, 1);
      return res.render("new-post-v2", {
        status: "idle",
        submission: { title, tags, content },
        errors: null,
      });
    }

    const result = PostEditorSchema.safeParse({
      title,
      tags,
      content,
    });
    if (!result.success) {
      return res.render("new-post-v2", {
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
  });

router.route("/new").get((req, res) => {
  res.render("new-post-v2", {
    status: "idle",
    submission: null,
    errors: null,
  });
});

export default router;
