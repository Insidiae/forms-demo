import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

import { NewPost } from "../components/views/NewPost";
import { PostList } from "../components/views/PostList";
import { invariant } from "../utils/misc";

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
      title: true,
      tags: true,
      content: true,
    },
  });

  return c.html(<PostList posts={posts} />);
});

posts.post("/", async (c) => {
  const { req } = c;
  const formData = await req.formData();

  const title = formData.get("title");
  const content = formData.get("content");
  const intent = formData.get("intent");

  let tags: string[] = [];
  for (let [key, value] of formData.entries()) {
    if (key.startsWith("tags[") && key.endsWith("]")) {
      //? Get the index number, e.g. tags[1] -> 1
      const index = +key.slice(5, -1);
      tags[index] = value;
    }
  }

  invariant(typeof intent === "string", "intent must be a string");
  invariant(typeof title === "string", "Title must be a string");
  invariant(typeof content === "string", "Content must be a string");

  if (intent.startsWith("list-insert")) {
    tags.push("");
    return c.html(
      <NewPost status="idle" submission={{ title, tags, content }} />
    );
  }

  if (intent.startsWith("list-remove")) {
    const idx = +intent.split("/")[1];
    tags.splice(idx, 1);
    return c.html(
      <NewPost status="idle" submission={{ title, tags, content }} />
    );
  }

  if (intent === "submit") {
    const result = PostEditorSchema.safeParse({
      title,
      tags,
      content,
    });

    if (!result.success) {
      const submission = { title, tags, content };
      return c.html(
        <NewPost
          status="error"
          errors={result.error.flatten()}
          submission={submission}
        />
      );
    }

    await prisma.post.create({
      data: {
        title: result.data.title,
        //? Can't store arrays in SQLite, so just turn em into a comma-separated string
        tags: result.data.tags?.join(","),
        content: result.data.content,
      },
    });

    return c.redirect("/posts");
  }
});

posts.get("/new", (c) => {
  return c.html(<NewPost status="idle" />);
});
