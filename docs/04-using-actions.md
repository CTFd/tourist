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
which itself returns a promise. To accomplish this, use an IIFE statement to be able to await promises:

```js
(async () => {
  const buttons = await page.locator('button').all();
  for (button of buttons) {
    await button.click();
  }
})()
```

### Internals of the PlaywrightRunner

Actions are executed by `PlaywrightRunner` instances, created for each job. Let's quickly go over the livecycle of the
playwright runner:

1. A new browser and a playwright context are created.
2. Cookies are attached to the playwright context, page and context are created.
3. Actions are split into `preOpen` and `postOpen`. That's because some actions need to be executed before the page is
visited - like the `page.on` event handler.
4. A new VM is created, and the playwright page and context are frozen inside.
5. `preOpen` actions are executed before navigation.
6. Navigation happens, the runner waits for the page to load, and executes `postOpen` actions inside the vm. **It's
important to understand that the `VM.run()` method is synchronous, that's why wrapping async code with iife expressions
is necessary.** It may of course, return a Promise, which is still a synchronous operation, and the runner will await
that Promise in its own async context, or just move forward if a concrete value has been returned.
7. After the action is fully completed, the runner waits for the page to be in the load state again, and repeats the
process for all the actions.
8. Finally, the runner moves onto finish and teardown. It gathers requested files: recording / screenshot / pdf, and
closes the browser, the context and the page.

#### A word about .map, .forEach and .reduce

This is not an issue specific to Tourist, however it's important to understand how JS async function behave inside the
mentioned methods. It might be tempting to create an action like this:

```js
links.map(async link => {
  await link.click({ button: "middle" });
})
```

However, **this will not work**, because playwright will attempt to click all the links pretty much simultaneously.
As the async function returns a Promise when it's executed - it will not block further execution because there's nothing
awaiting it. This code will evaluate to an array of ready, but not fulfilled Promises. That's because Tourist will
await the full context - but not individual promises. Wrapping this code inside `Promise.all()` will only solve one of
the issues - the Promises will be fulfilled, however playwright will still fail to click all the links.

The correct way to approach this is to use a for loop inside an iife expression, as well as waiting for the page to load
by using the playwright context:

```js
(async () => {
  const links = await page.locator('a').all();
  for (const link of links) {
    const pagePromise = context.waitForEvent('page');
    await link.click({ button: 'middle' });
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    await newPage.close();
  }
})()
```

This approach will correctly await the `link.click()` call, as well as the new page, before moving onto the next link -
which is what we need to do to avoid race conditions.
