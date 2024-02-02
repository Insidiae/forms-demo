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
  const [state, setState] = React.useState<PostFormState>({ status: "idle" });
  const navigate = useNavigate();

  const formErrors = state.status === "error" ? state.errors.formErrors : null;
  const fieldErrors =
    state.status === "error" ? state.errors.fieldErrors : null;
  const tagsList = state.submission?.tags ? state.submission.tags : [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    // @ts-expect-error TODO: figure out submitter typing
    const submitter = event.nativeEvent.submitter;
    const formData = new FormData(form, submitter);

    fetch(`${import.meta.env.VITE_BACKEND_URL}/posts`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data.status);
        if (data.status === "success") {
          navigate("/posts");
        } else {
          setState(data);
        }
      });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <a href="/posts">
        <h1 className="text-3xl font-bold">&larr; New Post</h1>
      </a>
      <form
        action="/posts"
        method="post"
        className="flex flex-col gap-2"
        onSubmit={handleSubmit}
      >
        <button name="intent" value="submit" type="submit" className="hidden" />
        <label htmlFor="title" className="text-lg font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={state.submission?.title}
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          autoFocus
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList errors={fieldErrors?.title} />
        </div>
        <label htmlFor="tags" className="text-lg font-medium">
          Tags
        </label>
        <ul id="tags" className="flex flex-col gap-2">
          {tagsList.map((tag, idx) => (
            <li className="flex items-center gap-2">
              <input
                type="text"
                name={`tags[${idx}]`}
                id={`tags[${idx}]`}
                defaultValue={tag}
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
        >
          {state.submission?.content}
        </textarea>
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList errors={fieldErrors?.content} />
        </div>
        <ErrorList errors={formErrors} />
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
