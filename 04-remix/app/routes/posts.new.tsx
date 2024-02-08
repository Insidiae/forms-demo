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
          // eslint-disable-next-line jsx-a11y/no-autofocus
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
