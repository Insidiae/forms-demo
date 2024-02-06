import { z } from "zod";

import { ErrorList } from "../ErrorList";
import { type PostEditorSchema } from "../../routes/posts";

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

export const NewPost = (props: NewPostProps) => {
  const formErrors = props.status === "error" ? props.errors.formErrors : null;
  const fieldErrors =
    props.status === "error" ? props.errors.fieldErrors : null;
  const tagsList = props.submission?.tags ? props.submission.tags : [];

  const formHasErrors = Boolean(formErrors?.length);
  const titleHasErrors = Boolean(fieldErrors?.title?.length);
  const contentHasErrors = Boolean(fieldErrors?.content?.length);

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
          <a href="/posts">
            <h1 class="text-3xl font-bold">&larr; New Post</h1>
          </a>
          <form
            action="/posts"
            method="post"
            class="flex flex-col gap-2"
            aria-invalid={formHasErrors || undefined}
            aria-describedby={formHasErrors ? "errors-form" : undefined}
          >
            <button name="intent" value="submit" type="submit" class="hidden" />
            <label htmlFor="title" class="text-lg font-medium">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={props.submission?.title}
              class="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
              autofocus
              aria-invalid={titleHasErrors || undefined}
              aria-describedby={titleHasErrors ? "errors-title" : undefined}
            />
            <div class="min-h-[32px] px-4 pb-3 pt-1">
              <ErrorList
                id={titleHasErrors ? "errors-title" : undefined}
                errors={fieldErrors?.title}
              />
            </div>
            {/* We'll handle accessibility for the tag input list later! */}
            <label for="tags" class="text-lg font-medium">
              Tags
            </label>
            <ul id="tags" class="flex flex-col gap-2">
              {tagsList.map((tag, idx) => (
                <li class="flex items-center gap-2">
                  <input
                    type="text"
                    name={`tags[${idx}]`}
                    id={`tags[${idx}]`}
                    value={tag}
                    class="text-xs rounded-md border border-black p-2 disabled:bg-slate-200"
                  />
                  <button
                    type="submit"
                    name="intent"
                    value={`list-remove/${idx}`}
                  >
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
                class="self-start rounded-full bg-blue-600 px-4 py-2 text-xs text-center text-white disabled:bg-blue-400"
              >
                + Add Tag
              </button>
            ) : null}
            <div class="min-h-[32px] px-4 pb-3 pt-1">
              <ErrorList errors={fieldErrors?.tags} />
            </div>
            <label htmlFor="content" class="text-lg font-medium">
              Content
            </label>
            <textarea
              name="content"
              id="content"
              class="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
              aria-invalid={contentHasErrors || undefined}
              aria-describedby={contentHasErrors ? "errors-content" : undefined}
            >
              {props.submission?.content}
            </textarea>
            <div class="min-h-[32px] px-4 pb-3 pt-1">
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
              class="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2 text-center text-white disabled:bg-blue-400"
            >
              Submit
            </button>
          </form>
        </div>
      </body>
    </html>
  );
};
