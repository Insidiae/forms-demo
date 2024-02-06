// src/index.js
import express, { type Express } from "express";
import dotenv from "dotenv";
import path from "path";

import postsRoutes from "./routes/posts.starter";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "dist")));
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  return res.redirect("/posts");
});

app.use("/posts", postsRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
