import { parse } from "@conform-to/zod";
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

export const posts = new Hono();
const prisma = new PrismaClient();

const titleMaxLength = 100;
const tagMaxLength = 25;
const contentMaxLength = 10000;

export const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
  tags: z.array(z.string().min(1).max(tagMaxLength)).optional(),
  content: z.string().min(1).max(contentMaxLength),
});

posts.get("/", async (c) => {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      tags: true,
      content: true,
    },
  });

  return c.json({ posts });
});

posts.post("/", async (c) => {
  const { req } = c;
  const formData = await req.formData();

  const submission = parse(formData, { schema: PostEditorSchema });

  if (submission.intent !== "submit") {
    return c.json({ status: "idle", submission } as const);
  }

  if (!submission.value) {
    return c.json({ status: "error", submission } as const);
  }

  const { title, tags, content } = submission.value;

  await prisma.post.create({
    data: {
      title,
      content,
      //? Can't store arrays in SQLite, so just turn em into a comma-separated string
      tags: tags?.join(","),
    },
  });

  return c.json({ status: "success" });
});

posts.get("/new", (c) => {
  return c.json({
    status: "idle",
  });
});
