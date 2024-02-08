import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";

import PostsRoute from "./routes/posts.tsx";
import NewPostRoute from "./routes/posts.new.tsx";

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
    element: <PostsRoute />,
  },
  {
    path: "/posts/new",
    element: <NewPostRoute />,
  },
]);

<RouterProvider router={router} />;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
