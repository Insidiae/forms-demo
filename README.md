# The FormData API: Craft Better Web Forms Using Web Standards

TODO: Intro

## Example: A Simple Form

[WIP: Express starter example]

Let's start with a simple example. Consider the following demo application where a user can submit a post with a `title` and some `content`:

![A form with a text input labelled "Title" and a textarea input labelled "Content".](./assets/images/a-simple-form.png)

The initial HTML for this form looks relatively simple:

<details>
	<summary>View Example HTML</summary>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- We'll use Tailwind CSS to generate this stylesheet -->
    <link rel="stylesheet" href="/styles.css" />
    <title>Create New Post | Forms Demo</title>
  </head>
  <body>
    <div class="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <a href="/posts">
        <h1 class="text-3xl font-bold">&larr; New Post</h1>
      </a>
      <form action="/posts" method="post" class="flex flex-col gap-2">
        <label htmlFor="title" class="text-lg font-medium">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          class="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          autofocus
        />
        <div class="min-h-[32px] px-4 pb-3 pt-1">
          <!-- If there are errors for the title, render an error list here! -->
        </div>

        <label htmlFor="content" class="text-lg font-medium">Content</label>
        <textarea
          name="content"
          id="content"
          class="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
        ></textarea>
        <div class="min-h-[32px] px-4 pb-3 pt-1">
          <!-- If there are errors for the content, render an error list here! -->
        </div>

        <!-- While we're at it, let's also render an error list here in case the form itself has errors -->

        <button
          name="intent"
          value="submit"
          type="submit"
          class="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2 text-center text-white disabled:bg-blue-400"
        >
          Submit
        </button>
      </label>
    </div>
  </body>
</html>
```

</details>

The `<form>`'s `method` and `action` attributes tell it to make an HTTP `POST` to the `/posts` route whenever the user submits the form.

Of course, that's just HTML. We can try to submit that form however many times we like, but it won't work unless we have a way to handle whatever values we submit. That means we'll still need _a server_ to process these values, validate the submitted data as needed, and save the post data somewhere so we can view them later in another page.

To keep things simple, let's use Node.js and Express to quickly set up a server that listens for our submitted form values.

### Want to follow along?

For the purposes of this demo, I've set up a basic Express server in [`01-express`](./01-express/) containing everything we'll need for this example. Here's a quick overview of what we're using:

- Basic Express + TypeScript app
- EJS for templating
- Tailwind CSS for styling
- SQLite for data storage
- Prisma for type-safe database queries

If you want to follow along, navigate to the [`01-express`](./01-express/) folder and follow the following steps:

1. Install the dependencies of each app:
   ```sh
    npm install
   ```
2. Initialize the database:
   ```sh
    npx prisma db push
   ```
3. Run the app!
   ```sh
    npm run dev
   ```

Let's take a look at the starter code:

<details>
	<summary>src/routes/posts.starter.ts</summary>

```ts
import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();

router
  .route("/")
  .get(async (req, res) => {
    const posts = await prisma.post.findMany({
      select: {
        title: true,
        tags: true,
        content: true,
      },
    });

    return res.render("posts-list", { posts });
  })
  .post(async (req, res) => {
    const formData = req.body;

    const title = formData.title;
    const content = formData.content;

    await prisma.post.create({
      data: { title, content },
    });

    return res.redirect("/posts");
  });

router.route("/new").get((req, res) => {
  res.render("new-post-starter", {
    status: "idle",
    submission: null,
    errors: null,
  });
});

export default router;
```

</details>

Our server listens to three different kinds of HTTP requests:

- `/posts` (`"GET"` method) - Displays a list of posts from the SQlite database
- `/posts/new` (`"GET"` method) - Displays a list of posts from the SQlite database
- `/posts` (`"POST"` method) - Accepts the form submissions and saves the data into the SQLite database

With this basic set up, we can now submit the form from the example earlier and whatever `title` and `content` we submit will persist in the database and shown when you navigate back to the `/posts` route.

## Validating Inputs

TODO: Express v1 + v2 example

## A New Standard: Web Fetch API

TODO: Hono example

## What about ReactJS?

TODO: MERN v1 example

### Improve Data Fetching with React Router 6.4

TODO: MERN v2 example

## Full Stack Progressive Enhancement

TODO: Remix v1 example

### [TODO: sub-section name for Conform JS]

TODO: Remix v2 + MERN v3 example

OPTIONAL: Demo note editor with image upload example from EpicWeb
