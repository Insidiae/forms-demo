import React from "react";
import { Link } from "react-router-dom";

type PostData = { title: string; tags: string; content: string };

function PostsRoute() {
  const [posts, setPosts] = React.useState<PostData[]>([]);

  React.useEffect(() => {
    const abortController = new AbortController();

    fetch(`${import.meta.env.VITE_BACKEND_URL}/posts`, {
      signal: abortController.signal,
    })
      .then((res) => res.json())
      .then((data) => setPosts(data.posts));

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <h1 className="text-3xl font-bold">Posts</h1>
      <Link
        to="/posts/new"
        className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2 text-center text-white"
      >
        + New Post
      </Link>
      <div className="flex flex-col gap-4">
        {posts
          ? posts.map(({ title, tags, content }) => (
              <article className="flex flex-col gap-2 rounded-md border border-black p-4">
                <h2 className="text-xl font-bold">{title}</h2>
                {tags ? (
                  <ul className="flex flex-wrap gap-2 mb-2">
                    {tags.split(",").map((tag) => (
                      <li className="bg-blue-600 px-2 py-1 text-white rounded-full text-xs">
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p>{content}</p>
              </article>
            ))
          : null}
      </div>
    </div>
  );
}

export default PostsRoute;
