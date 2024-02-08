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

import { invariant } from "../utils/misc";

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

    invariant(typeof title === "string", "Title must be a string");
    invariant(typeof content === "string", "Content must be a string");

    await prisma.post.create({
      data: { title, content },
    });

    return res.redirect("/posts");
  });

router.route("/new").get((req, res) => {
  res.render("new-post", {
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

By default, Express doesn't do anything to whatever values we include in our requests, such as our form submission values. Instead, we use middlewares that process these values and pass them along to our route handler functions via `req.body`. Fortunately, Express offers some built-in middlewares we can use, such as the `express.urlencoded()` middleware I've already set up in `src/index.ts`:

```ts
// src/index.ts
app.use(express.urlencoded({ extended: false }));
```

With that set up, we can get the `title` and `content` values from the `req.body` in our `router.post()` handler, and we can now submit the form from the example earlier and whatever `title` and `content` we submit will persist in the database and shown when you navigate back to the `/posts` route.

## Validating Inputs

Right now, we can submit anything through the form we built and it's going to be saved directly to the database. While there's nothing particularly _wrong_ about our simple example, more often than not most real-world requirements will have some kind of constraints on what kind of data can be accepted before saving to the database.

With that in mind, let's add some validation features into our handler! We'll add the following constraints to the `title` and `content` before we save it to our database:

- both `title` and `content` should be strings
- `title` should be required and must be 100 characters or less
- `content` should be required and must be 10000 characters or less

For invalid submissions, we'll need to display the form back along with some error messages that tell the user which parts of the submission were invalid. Since we're using TypeScript to build our example, it's also helpful to define a consistent error structure for the error data we'll be returning in the case of invalid submissions:

```ts
type ActionErrors = {
  formErrors: Array<string>;
  fieldErrors: {
    title: Array<string>;
    content: Array<string>;
  };
};
```

Now we can apply the constraints to the form sumbissions and send a some error data back when a user makes an invalid submission:

<details>
	<summary>src/routes/posts.ts</summary>

```ts
const titleMaxLength = 100;
const contentMaxLength = 10000;

router
  .route("/")
  // ...
  .post(async (req, res) => {
    // get title and content from req.body...

    const errors: ActionErrors = {
      formErrors: [],
      fieldErrors: {
        title: [],
        content: [],
      },
    };

    if (title === "") {
      errors.fieldErrors.title.push("Title is required");
    }
    if (title.length > titleMaxLength) {
      errors.fieldErrors.title.push("Title must be at most 100 characters");
    }

    if (content === "") {
      errors.fieldErrors.content.push("Content is required");
    }
    if (content.length > contentMaxLength) {
      errors.fieldErrors.content.push(
        "Content must be at most 10000 characters"
      );
    }

    const hasErrors =
      errors.formErrors.length ||
      Object.values(errors.fieldErrors).some(
        (fieldErrors) => fieldErrors.length
      );
    if (hasErrors) {
      return res.render("new-post", {
        status: "error",
        submission: null,
        errors,
      });
    }

    // call Prisma to save the post to our DB...
  });
```

</details>

<details>
	<summary>src/views/new-post.ejs</summary>
  
```diff
+ <%_ const formErrors = status === "error" ? errors.formErrors : null -%>
+ <%_ const fieldErrors = status === "error" ? errors.fieldErrors : null -%>
+ <%_ const formHasErrors = Boolean(formErrors?.length); -%>
+ <%_ const titleHasErrors = Boolean(fieldErrors?.title?.length); -%>
+ <%_ const contentHasErrors = Boolean(fieldErrors?.content?.length); -%>
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
-          <!-- If there are errors for the title, render an error list here! -->
+          <% if(fieldErrors?.title) { %>
+            <%- include("partials/error-list", { errors: fieldErrors.title, id: titleHasErrors ? "errors-title" : undefined }) %>
+          <% } %>
        </div>

        <label htmlFor="content" class="text-lg font-medium">Content</label>
        <textarea
          name="content"
          id="content"
          class="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
        ></textarea>
        <div class="min-h-[32px] px-4 pb-3 pt-1">

-          <!-- If there are errors for the content, render an error list here! -->
+          <% if(fieldErrors?.content) { %>
+            <%- include("partials/error-list", { errors: fieldErrors.content, id: contentHasErrors ? "errors-content" : undefined }) %>
+          <% } %>
        </div>

-        <!-- While we're at it, let's also render an error list here in case the form itself has errors -->
+        <% if(formErrors) { %>
+          <%- include("partials/error-list", { errors: formErrors, id: formHasErrors ? "errors-form" : undefined }) %>
+        <% } %>

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

````

</details>

It would also be helpful to the user if we can show their previous inputs back when we refresh the form after an invalid submission. To do this, we simply need to include a `submission` object to our `res.render()` containing whatever input they've previously submitted:

```diff
// src/routes/posts.ts
if (hasErrors) {
  return res.render("new-post", {
    status: "error",
-    submission: null,
+    submission: { title, content },
    errors,
  });
}
```

```diff
// src/views/new-post.ejs
<input
  type="text"
  id="title"
  name="title"
  class="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
+  value="<%=submission?.title %>"
  autofocus
/>
```

```diff
// src/views/new-post.ejs
<textarea
  name="content"
  id="content"
  class="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
-></textarea>
+><%=submission?.content %></textarea>
```

### Simplifying validation logic

Looking at our `router.post()` handler, it's clear that we're duplicating a bunch of logic across the different inputs we're checking. Unfortunately, this only gets worse as requirements become stricter and our contraints become more complex.

This is one of the times where it's reasonable to reach for an open-source library to handle these validation steps for us. In our example, let's use [Zod](https://zod.dev/) to simplify our validation logic:

<details>
	<summary>src/routes/posts.ts</summary>

```diff
+import { z } from "zod";

// ...

-type ActionErrors = {
-  formErrors: Array<string>;
-  fieldErrors: {
-    title: Array<string>;
-    content: Array<string>;
-  };
-};

const titleMaxLength = 100;
const contentMaxLength = 10000;

+const PostEditorSchema = z.object({
+  title: z.string().min(1).max(titleMaxLength),
+  content: z.string().min(1).max(contentMaxLength),
+});

router
  .route("/")
  // ...
  .post(async (req, res) => {
    // get title and content from req.body...

-    const errors: ActionErrors = {
-      formErrors: [],
-      fieldErrors: {
-        title: [],
-        content: [],
-      },
-    };
-
-    if (title === "") {
-      errors.fieldErrors.title.push("Title is required");
-    }
-    if (title.length > titleMaxLength) {
-      errors.fieldErrors.title.push("Title must be at most 100 characters");
-    }
-
-    if (content === "") {
-      errors.fieldErrors.content.push("Content is required");
-    }
-    if (content.length > contentMaxLength) {
-      errors.fieldErrors.content.push(
-        "Content must be at most 10000 characters"
-      );
-    }
-
-    const hasErrors =
-      errors.formErrors.length ||
-      Object.values(errors.fieldErrors).some(
-        (fieldErrors) => fieldErrors.length
-      );
+    const result = PostEditorSchema.safeParse({
+      title,
+      content,
+    });
-    if (hasErrors) {
+    if (!result.success) {
      return res.render("new-post", {
        status: "error",
        submission: { title, content },
-        errors,
+        errors: result.error.flatten(),
      });
    }

    // call Prisma to save the post to our DB...
  });
```

</details>

Even with our simple example, that's still a lot of duplicated code we just removed! This will become even more useful once we add a more complex input example later.

### Making the error displays accessible

We can use ARIA attributes to make our error messages more descriptive to users that use accessibility tools such as screen readers:

<details>
	<summary>src/views/new-post.ejs</summary>

```diff
<input
  type="text"
  id="title"
  name="title"
  value="<%=submission?.title %>"
  class="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
  autofocus
+  <%_ if (titleHasErrors) { -%>
+  aria-invalid="true"
+  aria-describedby="errors-title"
+  <%_ } -%>
/>
```

```diff
<textarea
  name="content"
  id="content"
  class="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
+  <%_ if (contentHasErrors) { -%>
+  aria-invalid="true"
+  aria-describedby="errors-content"
+  <%_ } -%>
>
```

</details>

> [!NOTE]
>
> It's often said that the first rule of ARIA is "don't use ARIA". That is, we should avoid putting unnecessary ARIA attributes to our elements whenever we can adequately describe them using HTML attributes alone. As such, we're wrapping the ARIA attributes inside `if` blocks so that we only apply them whenever the assiciated input is actually invalid.

## Adding a List of Inputs

Suppose there's a new feature we want to add to our posts example. Let's say we want to optionally add a list of `tags` to each post in addition to the `title` and `content` that we already have.

Let's keep using out Zod schema to define our new `tags` list:

```diff
+const tagMaxLength = 25;

const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
+  tags: z.array(z.string().min(1).max(tagMaxLength)).optional(),
  content: z.string().min(1).max(contentMaxLength),
});
```

Let's also update our EJS template to display our list of inputs. First, let's get the `tags` from the `submission`:

```ejs
<%_ const tagsList = submission?.tags ?? [] -%>
```

Then, add this between the `title` and `content` inputs:

```ejs
<!-- We'll handle accessibility for the tag input list later! -->
<label for="tags" class="text-lg font-medium">Tags</label>
<ul id="tags" class="flex flex-col gap-2">
  <%_tagsList.map((tag, idx) => { %>
  <li class="flex items-center gap-2">
    <input
      type="text"
      name="tags[<%=idx %>]"
      id="tags[<%=idx %>]"
      value="<%=tag %>"
      class="text-xs rounded-md border border-black p-2 disabled:bg-slate-200"
    />
    <button type="submit" name="intent" value="list-remove/<%=idx %>">
      ❌
    </button>
  </li>
  <%_ })%>
</ul>
<%_if (tagsList.length < 5) { %>
<button
  type="submit"
  name="intent"
  value="list-insert"
  class="self-start rounded-full bg-blue-600 px-4 py-2 text-xs text-center text-white disabled:bg-blue-400"
>
  + Add Tag
</button>
<%_ } %>
<div class="min-h-[32px] px-4 pb-3 pt-1">
  <% if(fieldErrors?.tags) { %>
    <%- include("partials/error-list", { errors: fieldErrors.tags, id: "errors-tags" }) %>
  <% } %>
</div>
```

### Using submission intents

With the addition of the `tags` input list, our `router.post()` handler will get a bit more complicated. In addition to handling our usual form submissions, we'll also want to handle two more cases where the user adds or removes an item from the `tags` list.

This is where submission intents could be useful. In a nutshell, we can attach a particular `name` and `value` to our submit buttons:

```html
<button
  type="submit"
  name="intent"
  value="list-insert"
  class="self-start rounded-full bg-blue-600 px-4 py-2 text-xs text-center text-white disabled:bg-blue-400"
>
  + Add Tag
</button>
```

```html
<button type="submit" name="intent" value="list-remove/<%=idx %>">❌</button>
```

By adding a `name` and a `value` to our submit buttons, we can add an additional field in our form data to represent our submission intent. This is how we can determine whether the user wants to add/remove an item to the `tags` list or submit the entire form.

There's a subtle bug you might experience after adding the `tags` input list this way. If you press `Enter` on a text input, you may notice that it adds or removes an item to the `tags` list instead. This is because pressing `Enter` on a text input the form will trigger a submission using the first (or topmost) submit button inside it. This also uses the `name` and `value` associated with that button, which in our case is one of the list add/remove buttons.

To fix this, we simply need to add a hidden submit button at the very top of our form:

```html
<button name="intent" value="submit" type="submit" class="hidden"></button>
```

### Handling the list of inputs

Now, let's actually handle the different submission intents in our `router.post()` handler:

<details>
	<summary>src/routes/posts.ts</summary>

```diff
router
  .route("/")
  // ...
  .post(async (req, res) => {
    const formData = req.body;

    const title = formData.title;
    const content = formData.content;
+    const intent = formData.intent;

    invariant(typeof title === "string", "Title must be a string");
    invariant(typeof content === "string", "Content must be a string");
+    invariant(typeof intent === "string", "Intent must be a string");

+    let tags: string[] = [];
+    for (let [key, value] of Object.entries(formData)) {
+      if (key.startsWith("tags[") && key.endsWith("]")) {
+        //? Get the index number, e.g. tags[1] -> 1
+        const index = +key.slice(5, -1);
+        // You can also typecheck this with the `invariant()` utility:
+        tags[index] = value as string;
+      }
+    }
+
+    if (intent === "list-insert") {
+      tags.push("");
+      return res.render("new-post", {
+        status: "idle",
+        submission: { title, tags, content },
+        errors: null,
+      });
+    }
+
+    if (intent.startsWith("list-remove")) {
+      const idx = +intent.split("/")[1];
+      tags.splice(idx, 1);
+      return res.render("new-post", {
+        status: "idle",
+        submission: { title, tags, content },
+        errors: null,
+      });
+    }

    const result = PostEditorSchema.safeParse({
      title,
+      tags,
      content,
    });
    if (!result.success) {
      return res.render("new-post", {
        status: "error",
-        submission: { title, content },
+        submission: { title, tags, content },
        errors: result.error.flatten(),
      });
    }

    await prisma.post.create({
=      data: { title, content },
+      data: {
+        title: result.data.title,
+        //? Can't store arrays in SQLite, so just turn em into a comma-separated string
+        tags: result.data.tags?.join(","),
+        content: result.data.content,
+      },
    });

    return res.redirect("/posts");
  })
```

</details>

You may have noticed that getting the `tags` array from the form submission data is a bit more complicated. This is because the real `FormData` API has a rather peculiar way of representing an array of inputs. It works similar to URL search params (hence you might see `x-www-form-urlencoded` as the default `content-type` when you check our `POST` requests in the Network tab), where you can assign multiple values into a single field name:

```html
<form>
  <input type="text" name="tags" value="tag-1" />
  <input type="text" name="tags" value="tag-2" />
  <input type="text" name="tags" value="tag-3" />
</form>
```

Which in turn will get represented as:

```js
const formData = new FormData(form);
formData.getAll("tags"); // ["tag-1", "tag-2", "tag-3"]
```

That works fine for a simple list of inputs, but consider another example where there's multiple inputs associated with each list item:

```html
<form>
  <input type="text" name="todo" value="Buy milk" />
  <input type="checkbox" name="completed" checked />
  <input type="text" name="todo" value="Buy eggs" />
  <input type="checkbox" name="completed" />
  <input type="text" name="todo" value="Wash dishes" />
  <input type="checkbox" name="completed" checked />
</form>
```

```js
const formData = new FormData(form);
formData.getAll("todo"); // ["Buy milk", "Buy eggs", "Wash dishes"]
formData.getAll("completed"); // ["on", "on"]
```

And here's where we see some problems with the basic approach. Some values in the `FormData` API, such as checkboxes, have visible values if they're filled in, but get skipped altogether if they're not filled in. This means we can't simply rely on the order of values to see chich of the nested fields have values or not. We'll have to do some extra work to provide more specific names for these nested fields so that we can track them more accurately:

```html
<form>
  <input type="text" name="todo[0].content" value="Buy milk" />
  <input type="checkbox" name="todo[0].complete" checked />
  <input type="text" name="todo[1].content" value="Buy eggs" />
  <input type="checkbox" name="todo[1].complete" />
  <input type="text" name="todo[2].content" value="Wash dishes" />
  <input type="checkbox" name="todo[2].complete" checked />
</form>
```

```js
const formData = new FormData(form);
formData.get("todo[0].content"); // "Buy milk"
formData.get("todo[0].complete"); // "on"
formData.get("todo[1].content"); // "Buy eggs"
formData.get("todo[1].complete"); // null
formData.get("todo[2].content"); // "Wash dishes"
formData.get("todo[2].complete"); // "on"
```

With the form data represented this way, we can use some custom JS to parse it into a more readable structure:

```js
{
  todos: [
    { content: "Buy milk", complete: true },
    { content: "Buy eggs", complete: false },
    { content: "Wash dishes", complete: true },
  ],
};
```

This approach is what we're using to represent our `tags` list. We simply iterate over the form entries to see `tags[number]` fields, then manually push each value into our own array.

```ts
let tags: string[] = [];
for (let [key, value] of Object.entries(formData)) {
  if (key.startsWith("tags[") && key.endsWith("]")) {
    //? Get the index number, e.g. tags[1] -> 1
    const index = +key.slice(5, -1);
    // You can also typecheck this with the `invariant()` utility:
    tags[index] = value as string;
  }
}
```

> [!IMPORTANT]
>
> Technically, Express already provides its own utilities so we don't have to iterate over all form entries like this. If you set `express.urlencoded({ extended: true })` in `src/index.ts`, the middleware will automatically transform the request body so that we can directly get an array in `formData.tags`. However, since it's a feature that's specific to Express (and other similar frameworks), I'm keeping the solution as it is to make it closer to how the real `FormData` API is used in the later examples.

## A New Standard: Web Fetch API

The [Web Fetch API](https://fetch.spec.whatwg.org) is a new standard that aims to unify fetching across the web platform and provide a unified architecture for fetching resources on the web so they are all consistent when it comes to various aspects of fetching.

If you've used JavaScript to build web apps, you've probably used `fetch()`:

```js
async function logMovies() {
  const response = await fetch("http://example.com/movies.json");
  const movies = await response.json();
  console.log(movies);
}
```

The Web Fetch API extends this process to make fetching data more consistent between the server and the client. The Web Fetch API gives us [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) and [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) objects containing the information we need to ...

In practice, using the Web Fetch API in our form example is relatively simple. Since we're already using native form submissions, we're already supplying the `Request` part whenever the user submits the form. All we need to do is handle that `Request` in our route handlers using the Web Fetch API.

This is what the `express.urlencoded()` middleware already does for us, except the parsed form data is converted into an object and put into Express' `req.body`. Let's look at another example using a different framework that allows us to play with the Web Fetch API ourselves. Moving into the `02-hono` example, we have the same app built using [Hono](https://hono.dev/):

<details>
	<summary>src/routes/posts.tsx</summary>

```tsx
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

import { NewPost } from "../components/views/NewPost";
import { PostList } from "../components/views/PostList";
import { invariant } from "../utils/misc";

export const posts = new Hono();
const prisma = new PrismaClient();

const titleMaxLength = 100;
const tagMaxLength = 25;
const contentMaxLength = 10000;

export const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
  tags: z.array(z.string().min(1).max(tagMaxLength)).optional(),
  content: z.string().min(1).max(contentMaxLength),
});

posts.get("/", async (c) => {
  const posts = await prisma.post.findMany({
    select: {
      title: true,
      tags: true,
      content: true,
    },
  });

  return c.html(<PostList posts={posts} />);
});

posts.post("/", async (c) => {
  const { req } = c;
  const formData = await req.formData();

  const title = formData.get("title");
  const content = formData.get("content");
  const intent = formData.get("intent");

  let tags: string[] = [];
  for (let [key, value] of formData.entries()) {
    if (key.startsWith("tags[") && key.endsWith("]")) {
      //? Get the index number, e.g. tags[1] -> 1
      const index = +key.slice(5, -1);
      tags[index] = value;
    }
  }

  invariant(typeof intent === "string", "intent must be a string");
  invariant(typeof title === "string", "Title must be a string");
  invariant(typeof content === "string", "Content must be a string");

  if (intent.startsWith("list-insert")) {
    tags.push("");
    return c.html(
      <NewPost status="idle" submission={{ title, tags, content }} />
    );
  }

  if (intent.startsWith("list-remove")) {
    const idx = +intent.split("/")[1];
    tags.splice(idx, 1);
    return c.html(
      <NewPost status="idle" submission={{ title, tags, content }} />
    );
  }

  if (intent === "submit") {
    const result = PostEditorSchema.safeParse({
      title,
      tags,
      content,
    });

    if (!result.success) {
      const submission = { title, tags, content };
      return c.html(
        <NewPost
          status="error"
          errors={result.error.flatten()}
          submission={submission}
        />
      );
    }

    await prisma.post.create({
      data: {
        title: result.data.title,
        //? Can't store arrays in SQLite, so just turn em into a comma-separated string
        tags: result.data.tags?.join(","),
        content: result.data.content,
      },
    });

    return c.redirect("/posts");
  }
});

posts.get("/new", (c) => {
  return c.html(<NewPost status="idle" />);
});
```

</details>

Pretty much the only difference between the Express and Hono examples comes down to how we get the form submission data, and even then they still look really similar:

```ts
// Express
const formData = req.body;

const title = formData.title;
const content = formData.content;
const intent = formData.intent;

let tags: string[] = [];
for (let [key, value] of Object.entries(formData)) {
  if (key.startsWith("tags[") && key.endsWith("]")) {
    //? Get the index number, e.g. tags[1] -> 1
    const index = +key.slice(5, -1);
    // You can also typecheck this with the `invariant()` utility:
    tags[index] = value as string;
  }
}
```

```ts
// Hono
const formData = await req.formData();

const title = formData.get("title");
const content = formData.get("content");
const intent = formData.get("intent");

let tags: string[] = [];
for (let [key, value] of formData.entries()) {
  if (key.startsWith("tags[") && key.endsWith("]")) {
    //? Get the index number, e.g. tags[1] -> 1
    const index = +key.slice(5, -1);
    tags[index] = value;
  }
}
```

Instead of getting the data from Express' `req.body` (which itself needs a middleware to parse data into), in Hono we can use the `formData()` method provided in the `Request` object. This method gives us a `FormData` object which we can use its built-in methods to get the form submission data that we need.

## What about React?

So far we've only done our example using pure server-side frameworks. What does it look like when we use a client-side framework?

Moving into the `03-mern` example, I've built the same form example using a setup similar to the MERN stack. This new setup still uses Hono for the server, but it returns JSON data this time instead of directly rendering HTML:

<details>
	<summary>server/src/routes/posts.tsx</summary>

```diff
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

-import { NewPost } from "../components/views/NewPost";
-import { PostList } from "../components/views/PostList";
import { invariant } from "../utils/misc";

export const posts = new Hono();
const prisma = new PrismaClient();

const titleMaxLength = 100;
const tagMaxLength = 25;
const contentMaxLength = 10000;

export const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
  tags: z.array(z.string().min(1).max(tagMaxLength)).optional(),
  content: z.string().min(1).max(contentMaxLength),
});

posts.get("/", async (c) => {
  const posts = await prisma.post.findMany({
    select: {
+      id: true,
      title: true,
      tags: true,
      content: true,
    },
  });

-  return c.html(<PostList posts={posts} />);
+  return c.json({ posts });
});

posts.post("/", async (c) => {
  const { req } = c;
  const formData = await req.formData();

  const title = formData.get("title");
  const content = formData.get("content");
  const intent = formData.get("intent");

  let tags: string[] = [];
  for (let [key, value] of formData.entries()) {
    if (key.startsWith("tags[") && key.endsWith("]")) {
      //? Get the index number, e.g. tags[1] -> 1
      const index = +key.slice(5, -1);
      tags[index] = value;
    }
  }

  invariant(typeof intent === "string", "intent must be a string");
  invariant(typeof title === "string", "Title must be a string");
  invariant(typeof content === "string", "Content must be a string");

  if (intent.startsWith("list-insert")) {
    tags.push("");
-    return c.html(
-      <NewPost status="idle" submission={{ title, tags, content }} />
-    );
+    return c.json({
+      status: "idle",
+      submission: { title, tags, content },
+    });
  }

  if (intent.startsWith("list-remove")) {
    const idx = +intent.split("/")[1];
    tags.splice(idx, 1);
-    return c.html(
-      <NewPost status="idle" submission={{ title, tags, content }} />
-    );
+    return c.json({
+      status: "idle",
+      submission: { title, tags, content },
+    });
  }

  if (intent === "submit") {
    const result = PostEditorSchema.safeParse({
      title,
      tags,
      content,
    });

    if (!result.success) {
      const submission = { title, tags, content };
-      return c.html(
-        <NewPost
-          status="error"
-          errors={result.error.flatten()}
-          submission={submission}
-        />
-      );
+      return c.json({
+        status: "error",
+        errors: result.error.flatten(),
+        submission: { title, tags, content },
+      });
    }

    await prisma.post.create({
      data: {
        title: result.data.title,
        //? Can't store arrays in SQLite, so just turn em into a comma-separated string
        tags: result.data.tags?.join(","),
        content: result.data.content,
      },
    });

-    return c.redirect("/posts");
+    return c.json({ status: "success" });
  }
});

posts.get("/new", (c) => {
-  return c.html(<NewPost status="idle" />);
+  return c.json({
+    status: "idle",
+  });
});
```

</details>

For the client side, we're essentially just replacing the `views` folder from the previous examples with a full-fledged Single Page Application (SPA) using React:

<details>
	<summary>client/src/routes/posts.new.tsx</summary>

```tsx
import React from "react";
import { ErrorList } from "../components/ErrorList";
import { useNavigate } from "react-router-dom";

type PostSubmission = {
  title: string;
  content: string;
  tags?: string[];
};

type PostFormState =
  | {
      status: "idle";
      submission?: PostSubmission;
    }
  | {
      status: "error";
      errors: {
        formErrors: string[];
        fieldErrors: {
          title: string[];
          tags: string[];
          content: string[];
        };
      };
      submission: PostSubmission;
    };

function NewPostRoute() {
  const [formState, setFormState] = React.useState<PostFormState>({
    status: "idle",
  });
  const navigate = useNavigate();

  const formErrors =
    formState.status === "error" ? formState.errors.formErrors : null;
  const fieldErrors =
    formState.status === "error" ? formState.errors.fieldErrors : null;
  const tagsList = formState.submission?.tags
    ? formState.submission.tags.map((tag) => ({
        //? We need a unique key to tell React how to
        //? properly track changes in the list
        key: crypto.randomUUID(),
        value: tag,
      }))
    : [];

  const formHasErrors = Boolean(formErrors?.length);
  const titleHasErrors = Boolean(fieldErrors?.title?.length);
  const contentHasErrors = Boolean(fieldErrors?.content?.length);

  async function handleSubmit(
    event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitter = event.nativeEvent.submitter;
    const formData = new FormData(form, submitter);

    fetch(`${import.meta.env.VITE_BACKEND_URL}/posts`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          navigate("/posts");
        } else {
          setFormState(data);
        }
      });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <a href="/posts">
        <h1 className="text-3xl font-bold">&larr; New Post</h1>
      </a>
      <form
        method="post"
        className="flex flex-col gap-2"
        onSubmit={handleSubmit}
        aria-invalid={formHasErrors || undefined}
        aria-describedby={formHasErrors ? "errors-form" : undefined}
      >
        <button name="intent" value="submit" type="submit" className="hidden" />
        <label htmlFor="title" className="text-lg font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={formState?.submission?.title}
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          autoFocus
          aria-invalid={titleHasErrors || undefined}
          aria-describedby={titleHasErrors ? "errors-title" : undefined}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList
            id={titleHasErrors ? "errors-title" : undefined}
            errors={fieldErrors?.title}
          />
        </div>
        {/* We'll handle accessibility for the tag input list later! */}
        <label htmlFor="tags" className="text-lg font-medium">
          Tags
        </label>
        <ul id="tags" className="flex flex-col gap-2">
          {tagsList.map(({ key, value }, idx) => (
            <li key={key} className="flex items-center gap-2">
              <input
                type="text"
                name={`tags[${idx}]`}
                id={`tags[${idx}]`}
                defaultValue={value}
                className="text-xs rounded-md border border-black p-2 disabled:bg-slate-200"
              />
              <button type="submit" name="intent" value={`list-remove/${idx}`}>
                ❌
              </button>
            </li>
          ))}
        </ul>
        {tagsList.length < 5 ? (
          <button
            type="submit"
            name="intent"
            value="list-insert"
            className="self-start rounded-full bg-blue-600 px-4 py-2 text-xs text-center text-white disabled:bg-blue-400"
          >
            + Add Tag
          </button>
        ) : null}
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList errors={fieldErrors?.tags} />
        </div>
        <label htmlFor="content" className="text-lg font-medium">
          Content
        </label>
        <textarea
          name="content"
          id="content"
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          defaultValue={formState?.submission?.content}
          aria-invalid={contentHasErrors || undefined}
          aria-describedby={contentHasErrors ? "errors-content" : undefined}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList
            id={contentHasErrors ? "errors-content" : undefined}
            errors={fieldErrors?.content}
          />
        </div>
        <ErrorList
          id={formHasErrors ? "errors-form" : undefined}
          errors={formErrors}
        />
        <button
          name="intent"
          value="submit"
          type="submit"
          className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2 text-center text-white disabled:bg-blue-400"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default NewPostRoute;
```

</details>

> [!NOTE]
>
> Unlike the previous examples, this example does not work if you disable JavaScript in your browser. This is because we've essentially split the app into two parts, and the client side SPA only communicates with the server using manual `fetch()` requests that requires JavaScript instead of default form submissions. Also, the dev server that's hosting the React SPA isn't the same as the Hono server, so even if we use default form submissions our client still doesn't have a way to handle the form data we'll be sending.

### Improve Data Fetching with React Router 6.4

As it currently stands, our React code seems to be a bit more complicated than our previous examples. This is mostly because we're manually re-implementing the default form submission behavior just to tell react to communicate with our Hono server. Fortunately, there are some modern tools that can streamline this process for us!

Starting in version 6.4, [React Router](https://reactrouter.com/en/main) added a lot of features to streamline data fetching in React applications. Using special `loader()` and `action()` functions, we can take advantage of the Web Fetch API standards to communicate with our server more consistently:

<details>
	<summary>client/src/routes/posts.new.tsx</summary>

```diff
-import React from "react";
import { ErrorList } from "../components/ErrorList";
-import { useNavigate } from "react-router-dom";
+import {
+  redirect,
+  useActionData,
+  Form,
+  type ActionFunctionArgs,
+} from "react-router-dom";

type PostSubmission = {
  title: string;
  content: string;
  tags?: string[];
};

type PostFormState =
  | {
      status: "idle";
      submission?: PostSubmission;
    }
  | {
      status: "error";
      errors: {
        formErrors: string[];
        fieldErrors: {
          title: string[];
          tags: string[];
          content: string[];
        };
      };
      submission: PostSubmission;
    };

+// eslint-disable-next-line react-refresh/only-export-components
+export async function action({ request }: ActionFunctionArgs) {
+  const formData = await request.formData();
+
+  const state = await fetch(`${import.meta.env.VITE_BACKEND_URL}/posts`, {
+    method: "POST",
+    body: formData,
+  }).then((res) => res.json());
+
+  if (state.status === "success") {
+    return redirect("/posts");
+  }
+
+  return state;
+}
+
function NewPostRoute() {
-  const [formState, setFormState] = React.useState<PostFormState>({
-    status: "idle",
-  });
-  const navigate = useNavigate();
+  const formState = useActionData() as PostFormState;

  const formErrors =
    formState?.status === "error" ? formState.errors.formErrors : null;
  const fieldErrors =
    formState?.status === "error" ? formState.errors.fieldErrors : null;
  const tagsList = formState.submission?.tags
    ? formState?.submission.tags.map((tag) => ({
        //? We need a unique key to tell React how to
        //? properly track changes in the list
        key: crypto.randomUUID(),
        value: tag,
      }))
    : [];

  const formHasErrors = Boolean(formErrors?.length);
  const titleHasErrors = Boolean(fieldErrors?.title?.length);
  const contentHasErrors = Boolean(fieldErrors?.content?.length);

-  async function handleSubmit(
-    event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>
-  ) {
-    event.preventDefault();
-    const form = event.currentTarget;
-    const submitter = event.nativeEvent.submitter;
-    const formData = new FormData(form, submitter);
-
-    fetch(`${import.meta.env.VITE_BACKEND_URL}/posts`, {
-      method: "POST",
-      body: formData,
-    })
-      .then((res) => res.json())
-      .then((data) => {
-        if (data.status === "success") {
-          navigate("/posts");
-        } else {
-          setFormState(data);
-        }
-      });
-  }
-
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <a href="/posts">
        <h1 className="text-3xl font-bold">&larr; New Post</h1>
      </a>
-      <form
+      <Form
        method="post"
        className="flex flex-col gap-2"
-        onSubmit={handleSubmit}
        aria-invalid={formHasErrors || undefined}
        aria-describedby={formHasErrors ? "errors-form" : undefined}
      >
        <button name="intent" value="submit" type="submit" className="hidden" />
        <label htmlFor="title" className="text-lg font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={formState?.submission?.title}
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          autoFocus
          aria-invalid={titleHasErrors || undefined}
          aria-describedby={titleHasErrors ? "errors-title" : undefined}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList
            id={titleHasErrors ? "errors-title" : undefined}
            errors={fieldErrors?.title}
          />
        </div>
        {/* We'll handle accessibility for the tag input list later! */}
        <label htmlFor="tags" className="text-lg font-medium">
          Tags
        </label>
        <ul id="tags" className="flex flex-col gap-2">
          {tagsList.map(({ key, value }, idx) => (
            <li key={key} className="flex items-center gap-2">
              <input
                type="text"
                name={`tags[${idx}]`}
                id={`tags[${idx}]`}
                defaultValue={value}
                className="text-xs rounded-md border border-black p-2 disabled:bg-slate-200"
              />
              <button type="submit" name="intent" value={`list-remove/${idx}`}>
                ❌
              </button>
            </li>
          ))}
        </ul>
        {tagsList.length < 5 ? (
          <button
            type="submit"
            name="intent"
            value="list-insert"
            className="self-start rounded-full bg-blue-600 px-4 py-2 text-xs text-center text-white disabled:bg-blue-400"
          >
            + Add Tag
          </button>
        ) : null}
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList errors={fieldErrors?.tags} />
        </div>
        <label htmlFor="content" className="text-lg font-medium">
          Content
        </label>
        <textarea
          name="content"
          id="content"
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          defaultValue={formState?.submission?.content}
          aria-invalid={contentHasErrors || undefined}
          aria-describedby={contentHasErrors ? "errors-content" : undefined}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList
            id={contentHasErrors ? "errors-content" : undefined}
            errors={fieldErrors?.content}
          />
        </div>
        <ErrorList
          id={formHasErrors ? "errors-form" : undefined}
          errors={formErrors}
        />
        <button
          name="intent"
          value="submit"
          type="submit"
          className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2 text-center text-white disabled:bg-blue-400"
        >
          Submit
        </button>
-      </form>
+      </Form>
    </div>
  );
}

export default NewPostRoute;
```

</details>

<details>
	<summary>client/src/main.tsx</summary>

```diff
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";

-import PostsRoute from "./routes/posts.tsx";
+import PostsRoute, { loader as postsLoader } from "./routes/posts.tsx";
-import NewPostRoute from "./routes/posts.new.tsx";
+import NewPostRoute, { action as newPostAction } from "./routes/posts.new.tsx";

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
+    loader: postsLoader,
    element: <PostsRoute />,
  },
  {
    path: "/posts/new",
+    action: newPostAction,
    element: <NewPostRoute />,
  },
]);

<RouterProvider router={router} />;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

</details>

## Full Stack Progressive Enhancement

Having an SPA frontend has its own advantages, but it really does suck that it requires client-side JavaScript to make our simple example work. The main problem lies in the fact that our server and client essentially became two separate apps using the "MERN" approach. Wouldn't it be nice if we can have the nice modern features of React but have it live in the same place as our server?

This is where full stack React (meta-)frameworks ([Next.js](https://nextjs.org/), [Remix](https://remix.run/), etc.) come in. In a nutshell, these React frameworks combine server features and use React to [_progressively enhance_](https://www.epicweb.dev/the-webs-next-transition) the user experience on the client side. More importantly for us, these frameworks allow us to fall back to making full document requests if JavaScript is disabled on the browser, and serve everything in one place so our form submissions can get processed by the correct route handler.

Moving on to the `04-remix` example, we have the form example rebuilt using Remix:

<details>
	<summary>app/routes/posts.new.tsx</summary>

```tsx
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData, Form } from "@remix-run/react";
import { z } from "zod";

import { prisma } from "~/utils/db.server";

import { ErrorList } from "~/components/ErrorList";
import { invariant } from "~/utils/misc";

const titleMaxLength = 100;
const tagMaxLength = 25;
const contentMaxLength = 10000;

export const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
  tags: z.array(z.string().min(1).max(tagMaxLength)).optional(),
  content: z.string().min(1).max(contentMaxLength),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const title = formData.get("title");
  const content = formData.get("content");
  const intent = formData.get("intent");

  const tags: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("tags[") && key.endsWith("]")) {
      //? Get the index number, e.g. tags[1] -> 1
      const index = +key.slice(5, -1);
      tags[index] = value as string;
    }
  }

  invariant(typeof intent === "string", "intent must be a string");
  invariant(typeof title === "string", "Title must be a string");
  invariant(typeof content === "string", "Content must be a string");

  if (intent.startsWith("list-insert")) {
    tags.push("");
    return json({
      status: "idle",
      submission: { title, tags, content },
    } as const);
  }

  if (intent.startsWith("list-remove")) {
    const idx = +intent.split("/")[1];
    tags.splice(idx, 1);
    return json({
      status: "idle",
      submission: { title, tags, content },
    } as const);
  }

  if (intent === "submit") {
    const result = PostEditorSchema.safeParse({
      title,
      tags,
      content,
    });

    if (!result.success) {
      return json({
        status: "error",
        errors: result.error.flatten(),
        submission: { title, tags, content },
      } as const);
    }

    await prisma.post.create({
      data: {
        title: result.data.title,
        //? Can't store arrays in SQLite, so just turn em into a comma-separated string
        tags: result.data.tags?.join(","),
        content: result.data.content,
      },
    });

    return redirect("/posts");
  }
}

function NewPostRoute() {
  const formState = useActionData<typeof action>();

  const formErrors =
    formState?.status === "error" ? formState?.errors.formErrors : null;
  const fieldErrors =
    formState?.status === "error" ? formState?.errors.fieldErrors : null;
  const tagsList = formState?.submission?.tags
    ? formState.submission.tags.map((tag) => ({
        //? We need a unique key to tell React how to
        //? properly track changes in the list
        key: crypto.randomUUID(),
        value: tag,
      }))
    : [];

  const formHasErrors = Boolean(formErrors?.length);
  const titleHasErrors = Boolean(fieldErrors?.title?.length);
  const contentHasErrors = Boolean(fieldErrors?.content?.length);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <a href="/posts">
        <h1 className="text-3xl font-bold">&larr; New Post</h1>
      </a>
      <Form
        method="post"
        className="flex flex-col gap-2"
        aria-invalid={formHasErrors || undefined}
        aria-describedby={formHasErrors ? "errors-form" : undefined}
      >
        <button name="intent" value="submit" type="submit" className="hidden" />
        <label htmlFor="title" className="text-lg font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={formState?.submission.title}
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          autoFocus
          aria-invalid={titleHasErrors || undefined}
          aria-describedby={titleHasErrors ? "errors-title" : undefined}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList
            id={titleHasErrors ? "errors-title" : undefined}
            errors={fieldErrors?.title}
          />
        </div>
        {/* We'll handle accessibility for the tag input list later! */}
        <label htmlFor="tags" className="text-lg font-medium">
          Tags
        </label>
        <ul id="tags" className="flex flex-col gap-2">
          {tagsList.map(({ key, value }, idx) => (
            <li key={key} className="flex items-center gap-2">
              <input
                type="text"
                name={`tags[${idx}]`}
                id={`tags[${idx}]`}
                defaultValue={value}
                className="text-xs rounded-md border border-black p-2 disabled:bg-slate-200"
              />
              <button type="submit" name="intent" value={`list-remove/${idx}`}>
                ❌
              </button>
            </li>
          ))}
        </ul>
        {tagsList.length < 5 ? (
          <button
            type="submit"
            name="intent"
            value="list-insert"
            className="self-start rounded-full bg-blue-600 px-4 py-2 text-xs text-center text-white disabled:bg-blue-400"
          >
            + Add Tag
          </button>
        ) : null}
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList errors={fieldErrors?.tags} />
        </div>
        <label htmlFor="content" className="text-lg font-medium">
          Content
        </label>
        <textarea
          name="content"
          id="content"
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          defaultValue={formState?.submission.content}
          aria-invalid={contentHasErrors || undefined}
          aria-describedby={contentHasErrors ? "errors-content" : undefined}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList
            id={contentHasErrors ? "errors-content" : undefined}
            errors={fieldErrors?.content}
          />
        </div>
        <ErrorList
          id={formHasErrors ? "errors-form" : undefined}
          errors={formErrors}
        />
        <button
          name="intent"
          value="submit"
          type="submit"
          className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2 text-center text-white disabled:bg-blue-400"
        >
          Submit
        </button>
      </Form>
    </div>
  );
}

export default NewPostRoute;
```

</details>

Notice something cool?

In the Remix example, the `action()` function looks almost identical to the `router.post()` handler from the Express and Hono examples, while the React component lives in the same file!

Even better, the form actually works again even when JavaScript is disabled in the browser. It simply uses the default form submission before JavaScript loads, and then switches to doing `fetch()` requests once JavaScript is fully loaded. In both cases, the `action()` handler knows exactly what to do to send the correct data back to us!

### Simplify Form Input Management with Conform

We've gone a really long way from the first example with only two simple text input fields! There's one more improvement we can do for our form before we wrap up.

If you're thinking that there seems to be a lot of repetition when we add the proper HTML and ARIA attributes to our inputs and labels, you're not alone! Wouldn't it be nice to make our Zod schema the single source of truth and have some nice utilities that automatically generate the correct attributes for our form fields based on the shape of our schema? Luckily for us, there are open-source form libraries that can help us with that!

For this example, we're going to use [Conform](https://conform.guide/) with its adapter for Zod schemas to streamline the logic for our form:

<details>
	<summary>app/routes/posts.new.tsx</summary>

```diff
+import { conform, useForm, useFieldList, list } from "@conform-to/react";
+import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData, Form } from "@remix-run/react";
import { z } from "zod";

import { prisma } from "~/utils/db.server";

import { ErrorList } from "~/components/ErrorList";
-import { invariant } from "~/utils/misc";

const titleMaxLength = 100;
const tagMaxLength = 25;
const contentMaxLength = 10000;

export const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
  tags: z.array(z.string().min(1).max(tagMaxLength)).optional(),
  content: z.string().min(1).max(contentMaxLength),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

-  const title = formData.get("title");
-  const content = formData.get("content");
-  const intent = formData.get("intent");
-
-  const tags: string[] = [];
-  for (const [key, value] of formData.entries()) {
-    if (key.startsWith("tags[") && key.endsWith("]")) {
-      //? Get the index number, e.g. tags[1] -> 1
-      const index = +key.slice(5, -1);
-      tags[index] = value as string;
-    }
-  }
-
-  invariant(typeof intent === "string", "intent must be a string");
-  invariant(typeof title === "string", "Title must be a string");
-  invariant(typeof content === "string", "Content must be a string");
-
-  if (intent.startsWith("list-insert")) {
-    tags.push("");
-    return json({
-      status: "idle",
-      submission: { title, tags, content },
-    } as const);
-  }
-
-  if (intent.startsWith("list-remove")) {
-    const idx = +intent.split("/")[1];
-    tags.splice(idx, 1);
-    return json({
-      status: "idle",
-      submission: { title, tags, content },
-    } as const);
-  }
-
-  if (intent === "submit") {
-    const result = PostEditorSchema.safeParse({
-      title,
-      tags,
-      content,
-    });
-    if (!result.success) {
-      return json({
-        status: "error",
-        errors: result.error.flatten(),
-        submission: { title, tags, content },
-      } as const);
-    }
+  const submission = parse(formData, { schema: PostEditorSchema });
+
+  if (submission.intent !== "submit") {
+    return json({ status: "idle", submission } as const);
+  }
+  if (!submission.value) {
+    return json({ status: "error", submission } as const);
+  }
+
+  const { title, tags, content } = submission.value;
  await prisma.post.create({
    data: {
-      title: result.data.title,
+      title,
-      //? Can't store arrays in SQLite, so just turn em into a comma-separated string
-      tags: result.data.tags?.join(","),
+      tags: tags?.join(","),
-      content: result.data.content,
+      content,
    },
  });

  return redirect("/posts");
-  }
}

function NewPostRoute() {
  const formState = useActionData<typeof action>();

-  const formErrors =
-    formState?.status === "error" ? formState?.errors.formErrors : null;
-  const fieldErrors =
-    formState?.status === "error" ? formState?.errors.fieldErrors : null;
-  const tagsList = formState?.submission?.tags
-    ? formState.submission.tags.map((tag) => ({
-        //? We need a unique key to tell React how to
-        //? properly track changes in the list
-        key: crypto.randomUUID(),
-        value: tag,
-      }))
-    : [];
-
-  const formHasErrors = Boolean(formErrors?.length);
-  const titleHasErrors = Boolean(fieldErrors?.title?.length);
-  const contentHasErrors = Boolean(fieldErrors?.content?.length);
+  const [form, fields] = useForm({
+    id: "post-editor",
+    constraint: getFieldsetConstraint(PostEditorSchema),
+    lastSubmission: formState?.submission,
+    onValidate({ formData }) {
+      return parse(formData, { schema: PostEditorSchema });
+    },
+  });
+
+  const tagsList = useFieldList(form.ref, fields.tags);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <a href="/posts">
        <h1 className="text-3xl font-bold">&larr; New Post</h1>
      </a>
-      <Form
-        method="post"
-        className="flex flex-col gap-2"
-        aria-invalid={formHasErrors || undefined}
-        aria-describedby={formHasErrors ? "errors-form" : undefined}
-      >
+      <Form method="post" className="flex flex-col gap-2" {...form.props}>
        <button name="intent" value="submit" type="submit" className="hidden" />
        <label htmlFor="title" className="text-lg font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
-          name="title"
-          defaultValue={formState?.submission.title}
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          autoFocus
-          aria-invalid={titleHasErrors || undefined}
-          aria-describedby={titleHasErrors ? "errors-title" : undefined}
+          {...conform.input(fields.title)}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
-          <ErrorList
-            id={titleHasErrors ? "errors-title" : undefined}
-            errors={fieldErrors?.title}
-          />
+          <ErrorList id={fields.title.errorId} errors={fields.title.errors} />
        </div>
-        {/* We'll handle accessibility for the tag input list later! */}
        <label htmlFor="tags" className="text-lg font-medium">
          Tags
        </label>
        <ul id="tags" className="flex flex-col gap-2">
-          {tagsList.map(({ key, value }, idx) => (
+          {tagsList.map((tag, idx) => (
-            <li key={key} className="flex items-center gap-2">
+            <li key={tag.key} className="flex items-center gap-2">
              <input
                type="text"
-                name={`tags[${idx}]`}
-                id={`tags[${idx}]`}
-                defaultValue={value}
                className="text-xs rounded-md border border-black p-2 disabled:bg-slate-200"
+                {...conform.input(tag)}
              />
-              <button type="submit" name="intent" value={`list-remove/${idx}`}>
+              <button
+                type="submit"
+                {...list.remove(fields.tags.name, { index: idx })}
+              >
                ❌
              </button>
+              <ErrorList id={tag.errorId} errors={tag.errors} />
            </li>
          ))}
        </ul>
        {tagsList.length < 5 ? (
          <button
            type="submit"
-            name="intent"
-            value="list-insert"
            className="self-start rounded-full bg-blue-600 px-4 py-2 text-xs text-center text-white disabled:bg-blue-400"
+            {...list.insert(fields.tags.name, { defaultValue: "" })}
          >
            + Add Tag
          </button>
        ) : null}
-        <div className="min-h-[32px] px-4 pb-3 pt-1">
-          <ErrorList errors={fieldErrors?.tags} />
-        </div>
        <label htmlFor="content" className="text-lg font-medium">
          Content
        </label>
        <textarea
-          name="content"
-          id="content"
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
-          defaultValue={formState?.submission.content}
-          aria-invalid={contentHasErrors || undefined}
-          aria-describedby={contentHasErrors ? "errors-content" : undefined}
+          {...conform.textarea(fields.content)}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList
-            id={contentHasErrors ? "errors-content" : undefined}
+            id={fields.content.errorId}
-            errors={fieldErrors?.content}
+            errors={fields.content.errors}
          />
        </div>
-        <ErrorList
-          id={formHasErrors ? "errors-form" : undefined}
-          errors={formErrors}
-        />
+        <ErrorList id={form.errorId} errors={form.errors} />
        <button
          name="intent"
          value="submit"
          type="submit"
          className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2 text-center text-white disabled:bg-blue-400"
        >
          Submit
        </button>
      </Form>
    </div>
  );
}

export default NewPostRoute;
```

</details>

Phew, that's a lot of code we just trimmed down! What's more, Conform has actually added other important attributes we may have missed earlier, and they're all consistent for all of the inputs and labels inside our form!

<!-- NOTE: This might be a good place to put another screenshot -->

> [!TIP]
>
> Conform is actually built to support both React Router and Remix! If you're interested to see how it works for the `03-mern` example, feel free to check out the `v3-conform` folder in the `client` as well as the `posts.v2.tsx` file in the `server`.

<!-- OPTIONAL: Demo note editor with image upload example from EpicWeb -->

Building web forms looks simple at first glance, but it can get surprisingly complex with all of the little things we need to look out for! By learning the common web standards, we can use our knowledge to architect a consistent API across servers and clients, making our lives easier as we continue to add more complex features in our web applications.
