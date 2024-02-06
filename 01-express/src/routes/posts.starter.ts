import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();

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

    await prisma.post.create({
      data: { title, content },
    });

    return res.redirect("/posts");
  });

router.route("/new").get((req, res) => {
  res.render("new-post-starter", {
    status: "idle",
    submission: null,
    errors: null,
  });
});

export default router;
