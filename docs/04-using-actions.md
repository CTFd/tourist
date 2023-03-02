# Using Actions

Tourist can perform a wide array of interactions with the target websites. Most of the operations you can perform with
playwright - you can likely perform with Tourist too.

### Basic usage

Actions were designed to be as simple as possible for simple statements. A simple action to click a selector would look
like this:

```js
page.click('#my-button')
```

Tourist will await the promise returned by playwright and the action will perform successfully. However, the `.click()`
method is depreciated by playwright. Instead, now it's recommended to use `Locator` based methods:

```js
page.locator('#my-button').click();
```

It gets a little more complicated when trying to click all links, as we need to use the `.all()` method on the locator -
which itself returns a promise. We have two approaches to tackle that:

1. Use an IIFE statement to be able to await promises:

    ```js
    (async () => {
      const buttons = await page.locator('button').all();
      for (button of buttons) {
        await button.click();
      }
    })()
    ```

2. By using action context - described in the section below:

### Utilizing the action context

Outside the `page` variable - there's one more object available in the sandbox - `context`. The context is an array of
action outputs. After each step's finish - the returned value is assigned to that array, at the same index as the action
that created it. With that in mind we can execute the `locator().all()` chain in the first action, and use the returned
value in the next, image an array of actions like this:

```js
[
  "page.locator('button').all()",
  // the locators are now available under context[0]
  `context[0].reduce(
    (previous, link) => previous.then(
      () => link.click().then(null)
    ),
    Promise.resolve(null)
  );`
]
```

While this might not look useful with a simple action like that, we believe that it will be for more complex workloads -
and we want to make Tourist as flexible as possible.

#### Context is frozen inside the sandbox

Keep in mind that it's not possible to attach values to the context on your own on arbitrary indexes:

```js
context[100] = "test"
```

Action like this will have a different result than you might expect. The context itself is frozen and can't be modified
inside the sandbox - however the assignment operation returns the assigned value - so the value `"test"` will be
available on whatever index the action had.

This is by design - we don't want to prevent from assigning arbitrary values you might consider useful to the context,
we just want to ensure that they are placed on appropriate indexes and don't override each-other.

Security is provided by disallowing code generation inside the sandbox:

```js
new Function('return (1+2)')()
```

Defining such action will raise an exception, and prevent further execution.

### Internals of the PlaywrightRunner

Actions are executed by `PlaywrightRunner` instances, created for each job. Let's quickly go over the livecycle of the
playwright runner:

1. A new browser and a playwright context are created.
2. Cookies are attached to the playwright context, page is created.
3. Actions are split into `preOpen` and `postOpen`. That's because some actions need to be executed before the page is
visited - like the `page.on` event handler.
4. A new VM is created, and the playwright page as well as the action context are frozen inside.
5. `preOpen` actions are executed before navigation.
6. Navigation happens, the runner waits for the page to load, and executes `postOpen` actions inside the vm. **It's
important to understand that the `VM.run()` method is synchronous, that's why wrapping async code with iife expressions
is necessary.** It may of course, return a Promise, which is still a synchronous operation, and the runner will await
that Promise in its own async context, or just move forward if a concrete value has been returned.
7. Once the Promise is fulfilled, its value is assigned to the action context, at the index of the action that returned
it.
8. After the action is fully completed, the runner waits for the page to be in the load state again, and repeats the
process for all the actions.
9. Finally, the runner moves onto finish and teardown. It gathers requested files: recording / screenshot / pdf, and
closes the browser, the context and the page.

#### A word about .map, .forEach and .reduce

This is not an issue specific to Tourist, however it's important to understand how JS async function behave inside the
mentioned methods. It might be tempting to create an action like this:

```js
context[0].map(async link => {
  await link.click({ button: "middle" });
})
```

However, **this will not work**, because playwright will attempt to click all the links pretty much simultaneously.
As the async function returns a Promise when it's executed - it will not block further execution because there's nothing
awaiting it. This code will evaluate to an array of ready, but not fulfilled Promises. That's because Tourist will
await the full context - but not individual promises. Wrapping this code inside `Promise.all()` will only solve one of
the issues - the Promises will not be fulfilled, however playwright will still fail to click all the links.

The correct way to approach this is to use a for loop inside an iife expression:

```js
(async () => {
  for (const link of context[0]) {
    await link.click({ button: "middle" });
  }
})()
```

or a slightly confusing reduce, awaiting the last promise with each execution:

```js
context[0].reduce(
  (previous, link) => previous.then(
    () => link.click({ button: "middle" }).then(null)
  ),
  Promise.resolve(null)
);
```

Both of these approaches will correctly await the `link.click()` call, before moving onto the next one - which is what
playwright wants to see.
