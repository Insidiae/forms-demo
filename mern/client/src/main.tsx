import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";

import PostsRoute, { loader as postsLoader } from "./routes/posts.tsx";
import NewPostRoute, { action as newPostAction } from "./routes/posts.new.tsx";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    loader: () => {
      return redirect("/posts");
    },
  },
  {
    path: "/posts",
    loader: postsLoader,
    element: <PostsRoute />,
  },
  {
    path: "/posts/new",
    action: newPostAction,
    element: <NewPostRoute />,
  },
]);

<RouterProvider router={router} />;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
