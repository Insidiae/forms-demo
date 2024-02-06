import { Hono } from "hono";
import type { FC } from "hono/jsx";

import { Layout } from "../components/Layout";
import { invariant } from "../utils/misc";

export const posts = new Hono();

type ActionErrors = {
  formErrors: Array<string>;
  fieldErrors: {
    title: Array<string>;
    content: Array<string>;
  };
};

const titleMaxLength = 100;
const contentMaxLength = 10000;

posts.get("/", (c) => {
  return c.html(<PostList />);
});

posts.post("/", async (c) => {
  const { req } = c;
  const formData = await req.formData();

  const title = formData.get("title");
  const content = formData.get("content");

  const errors: ActionErrors = {
    formErrors: [],
    fieldErrors: {
      title: [],
      content: [],
    },
  };

  invariant(typeof title === "string", "Title must be a string");
  invariant(typeof content === "string", "Content must be a string");

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
    errors.fieldErrors.content.push("Content must be at most 10000 characters");
  }

  const hasErrors =
    errors.formErrors.length ||
    Object.values(errors.fieldErrors).some((fieldErrors) => fieldErrors.length);

  if (hasErrors) {
    const submission = { title, content };
    return c.html(
      <NewPost status="error" errors={errors} submission={submission} />
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
    </Layout>
  );
};

type NewPostProps =
  | {
      status: "idle";
    }
  | {
      status: "error";
      errors: ActionErrors;
      submission: {
        title: string;
        content: string;
      };
    };

const NewPost = (props: NewPostProps) => {
  const fieldErrors =
    props.status === "error" ? props.errors.fieldErrors : null;

  const formErrors = props.status === "error" ? props.errors.formErrors : null;

  const submission = props.status === "error" ? props.submission : null;

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
            value={submission ? submission.title : undefined}
            autofocus
          />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList errors={fieldErrors?.title} />
          </div>
        </div>
        <div>
          <label htmlFor="content">Content</label>
          <textarea name="content" id="content">
            {submission ? submission.content : undefined}
          </textarea>
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList errors={fieldErrors?.content} />
          </div>
        </div>
      </form>
    </Layout>
  );
};

const ErrorList = ({
  id,
  errors,
}: {
  id?: string;
  errors?: Array<string> | null;
}) => {
  return errors?.length ? (
    <ul id={id} className="flex flex-col gap-1">
      {errors.map((error, i) => (
        <li key={i} className="text-[10px] text-foreground-destructive">
          {error}
        </li>
      ))}
    </ul>
  ) : (
    <></>
  );
};
