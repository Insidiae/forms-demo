import {
  conform,
  useForm,
  useFieldList,
  list,
  type Submission,
} from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
  redirect,
  useActionData,
  Form,
  type ActionFunctionArgs,
} from "react-router-dom";
import { z } from "zod";

import { ErrorList } from "../components/ErrorList";

const titleMaxLength = 100;
const tagMaxLength = 25;
const contentMaxLength = 10000;

const PostEditorSchema = z.object({
  title: z.string().min(1).max(titleMaxLength),
  tags: z.array(z.string().min(1).max(tagMaxLength)).optional(),
  content: z.string().min(1).max(contentMaxLength),
});

type PostFormState =
  | {
      status: "idle";
      submission: Submission<z.infer<typeof PostEditorSchema>>;
    }
  | {
      status: "error";
      submission: Submission<z.infer<typeof PostEditorSchema>>;
    };

// eslint-disable-next-line react-refresh/only-export-components
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const state = await fetch(`${import.meta.env.VITE_BACKEND_URL}/posts`, {
    method: "POST",
    body: formData,
  }).then((res) => res.json());

  if (state.status === "success") {
    return redirect("/posts");
  }

  return state;
}

function NewPostRoute() {
  const formState = useActionData() as PostFormState;

  const [form, fields] = useForm({
    id: "note-editor",
    constraint: getFieldsetConstraint(PostEditorSchema),
    lastSubmission: formState?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: PostEditorSchema });
    },
  });

  const tagsList = useFieldList(form.ref, fields.tags);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <a href="/posts">
        <h1 className="text-3xl font-bold">&larr; New Post</h1>
      </a>
      <Form method="post" className="flex flex-col gap-2" {...form.props}>
        <button name="intent" value="submit" type="submit" className="hidden" />
        <label htmlFor="title" className="text-lg font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          autoFocus
          {...conform.input(fields.title)}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList id={fields.title.errorId} errors={fields.title.errors} />
        </div>
        <label htmlFor="tags" className="text-lg font-medium">
          Tags
        </label>
        <ul id="tags" className="flex flex-col gap-2">
          {tagsList.map((tag, idx) => (
            <li key={tag.key} className="flex items-center gap-2">
              <input
                type="text"
                className="text-xs rounded-md border border-black p-2 disabled:bg-slate-200"
                {...conform.input(tag)}
              />
              <button
                type="submit"
                {...list.remove(fields.tags.name, { index: idx })}
              >
                ❌
              </button>
              <ErrorList id={tag.errorId} errors={tag.errors} />
            </li>
          ))}
        </ul>
        {tagsList.length < 5 ? (
          <button
            type="submit"
            className="self-start rounded-full bg-blue-600 px-4 py-2 text-xs text-center text-white disabled:bg-blue-400"
            {...list.insert(fields.tags.name, { defaultValue: "" })}
          >
            + Add Tag
          </button>
        ) : null}
        <label htmlFor="content" className="text-lg font-medium">
          Content
        </label>
        <textarea
          className="mb-2 rounded-md border border-black p-2 disabled:bg-slate-200"
          {...conform.textarea(fields.content)}
        />
        <div className="min-h-[32px] px-4 pb-3 pt-1">
          <ErrorList
            id={fields.content.errorId}
            errors={fields.content.errors}
          />
        </div>
        <ErrorList id={form.errorId} errors={form.errors} />
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
