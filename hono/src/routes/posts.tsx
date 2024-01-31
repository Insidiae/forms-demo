import { Hono } from "hono";
import type { FC } from "hono/jsx";
import { z } from "zod";

import { Layout } from "../components/Layout";
import { ErrorList } from "../components/ErrorList";
import { invariant } from "../utils/misc";

export const posts = new Hono();

const titleMaxLength = 100;
const contentMaxLength = 10000;

const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
  content: z.string().min(1).max(contentMaxLength),
});

posts.get("/", (c) => {
  return c.html(<PostList />);
});

posts.post("/", async (c) => {
  const { req } = c;
  const formData = await req.formData();

  const title = formData.get("title");
  const content = formData.get("content");

  console.log({ intent: formData.get("intent") });

  invariant(typeof title === "string", "Title must be a string");
  invariant(typeof content === "string", "Content must be a string");

  const result = PostEditorSchema.safeParse({
    title,
    content,
  });

  if (!result.success) {
    const submission = { title, content };
    return c.html(
      <NewPost
        status="error"
        errors={result.error.flatten()}
        submission={submission}
      />
    );
  }

  return c.redirect("/posts");
});

posts.get("/new", (c) => {
  return c.html(<NewPost status="idle" />);
});

const PostList: FC = (props) => {
  return (
    <Layout>
      <h1>Posts</h1>
      <a href="/posts/new">+ New Post</a>
    </Layout>
  );
};

type NewPostProps =
  | {
      status: "idle";
      submission?: z.infer<typeof PostEditorSchema>;
    }
  | {
      status: "error";
      errors: z.typeToFlattenedError<z.infer<typeof PostEditorSchema>>;
      submission: z.infer<typeof PostEditorSchema>;
    };

const emptySubmission: z.infer<typeof PostEditorSchema> = {
  title: "",
  content: "",
};

const NewPost = (props: NewPostProps) => {
  const fieldErrors =
    props.status === "error" ? props.errors.fieldErrors : null;
  const formErrors = props.status === "error" ? props.errors.formErrors : null;

  const submission = props.submission ?? emptySubmission;

  return (
    <Layout>
      <h1>Create New Post</h1>
      <form method="POST" action="/posts">
        <div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={submission.title}
            autofocus
          />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList errors={fieldErrors?.title} />
          </div>
        </div>
        <div>
          <label htmlFor="content">Content</label>
          <textarea name="content" id="content">
            {submission.content}
          </textarea>
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList errors={fieldErrors?.content} />
          </div>
        </div>
        <ErrorList errors={formErrors} />
        <button name="intent" value="submit" type="submit">
          Submit
        </button>
      </form>
    </Layout>
  );
};
