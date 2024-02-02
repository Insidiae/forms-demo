import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";

import { prisma } from "~/utils/db.server";

export async function loader() {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      tags: true,
      content: true,
    },
  });

  return json({ posts });
}

function PostsIndexRoute() {
  const data = useLoaderData<typeof loader>();

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
        {data?.posts
          ? data.posts.map(({ id, title, tags, content }) => (
              <article
                key={id}
                className="flex flex-col gap-2 rounded-md border border-black p-4"
              >
                <h2 className="text-xl font-bold">{title}</h2>
                {tags ? (
                  <ul className="flex flex-wrap gap-2 mb-2">
                    {tags.split(",").map((tag, idx) => (
                      <li
                        key={idx}
                        className="bg-blue-600 px-2 py-1 text-white rounded-full text-xs"
                      >
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

export default PostsIndexRoute;
