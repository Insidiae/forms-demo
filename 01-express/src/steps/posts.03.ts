import express from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { invariant } from "../utils/misc";

const prisma = new PrismaClient();

const router = express.Router();

const titleMaxLength = 100;
const contentMaxLength = 10000;

const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
  content: z.string().min(1).max(contentMaxLength),
});

router
  .route("/")
  .get(async (req, res) => {
    const posts = await prisma.post.findMany({
      select: {
        title: true,
        content: true,
      },
    });

    return res.render("posts-list", { posts });
  })
  .post(async (req, res) => {
    const formData = req.body;

    const title = formData.title;
    const content = formData.content;

    invariant(typeof title === "string", "Title must be a string");
    invariant(typeof content === "string", "Content must be a string");

    const result = PostEditorSchema.safeParse({
      title,
      content,
    });

    if (!result.success) {
      return res.render("new-post", {
        status: "error",
        submission: { title, content },
        errors: result.error.flatten(),
      });
    }

    await prisma.post.create({
      data: {
        title: result.data.title,
        content: result.data.content,
      },
    });

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
