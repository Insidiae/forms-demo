import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { posts } from "./routes/posts";

const app = new Hono();
app.use("*", cors());

app.get("/", (c) => {
  return c.redirect("/posts");
});

app.route("/posts", posts);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
