import { Hono } from "hono";

import { posts } from "./routes/posts";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/posts", posts);

export default app;
