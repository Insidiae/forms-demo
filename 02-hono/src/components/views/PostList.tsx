import type { Post } from "@prisma/client";

type PostListProps = {
  posts: Pick<Post, "title" | "tags" | "content">[];
};

export const PostList = ({ posts }: PostListProps) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/assets/dist/styles.css" />
        <title>Create New Post | Forms Demo</title>
      </head>
      <body>
        <div class="mx-auto flex max-w-lg flex-col gap-8 p-8">
          <h1 class="text-3xl font-bold">Posts</h1>
          <a
            href="/posts/new"
            class="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2 text-center text-white"
          >
            + New Post
          </a>
          <div class="flex flex-col gap-4">
            {posts.map(({ title, tags, content }) => (
              <article class="flex flex-col gap-2 rounded-md border border-black p-4">
                <h2 class="text-xl font-bold">{title}</h2>
                {tags ? (
                  <ul class="flex flex-wrap gap-2 mb-2">
                    {tags.split(",").map((tag) => (
                      <li class="bg-blue-600 px-2 py-1 text-white rounded-full text-xs">
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p>{content}</p>
              </article>
            ))}
          </div>
        </div>
      </body>
    </html>
  );
};
