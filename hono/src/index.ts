import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
// import { serveStatic } from "hono/cloudflare-workers";

import { posts } from "./routes/posts";

const app = new Hono();

app.use("/assets/*", serveStatic({ root: "./" }));
app.get("/", (c) => {
  return c.redirect("/posts");
});

app.route("/posts", posts);

// export default app;
const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
