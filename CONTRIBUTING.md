# Contributing

Contributions are welcome!

Please use GitHub issues to submit both issues and feature requests, and feel free to submit pull requests!

When working with the codebase please adhere to the Prettier code style, you can format your code with `yarn format`.

When adding new functionality please make sure to cover it with unit tests as well!

### Note about tests

Running the tests concurrently, with `yarn test` can cause false negatives (due to the fact that there will be many
browsers spawned in parallel - which tends to be resource intensive and actions might time out).

The CI workflow uses the `yarn test:ci` command to run tests serially, which is less likely to causes false negatives.

For development - It is recommended to run individual tests selectively with `yarn ava -m "pattern"` - as described in
the [ava docs](https://github.com/avajs/ava/blob/main/docs/05-command-line.md#running-tests-with-matching-titles), and
only run the full suite with `yarn test:ci` before submitting the pull request.
