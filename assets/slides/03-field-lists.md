# What's with the array-like names?

The real `FormData` API has a rather peculiar way of representing an array of inputs.

- It works similar to URL search params
  - Which is why you see `x-www-form-urlencoded` as the default `content-type` when you check our `POST` requests in the Network tab
  - You can assign multiple values into a single field name:

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




---

For a simple list of inputs, this works fine!

But let's consider a more complex example of multiple inputs:

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




---

We see an obvious problem:

  - Some inputs (like checkboxes or radio inputs) get omitted altogether when not filled in
  - Difficult to keep track of related fields

A simple solution: Use more specific names for each input!

  - We can use a naming convention that makes it easier to group related inputs

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



Now if we want, we can use some custom JS to parse it into a more readable structure:

```js
{
  todos: [
    { content: "Buy milk", complete: true },
    { content: "Buy eggs", complete: false },
    { content: "Wash dishes", complete: true },
  ],
};
```



---

This approach is what we're using to represent our `tags` list:

1. Iterate over the form entries to see `tags[number]` fields
2. Manually push each value into a separate array

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

Fun fact: I stole the idea for this code from the Conform library 😂

https://github.com/edmundhung/conform/blob/main/packages/conform-dom/formdata.ts#L26-L58
