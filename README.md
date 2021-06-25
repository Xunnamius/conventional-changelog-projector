# conventional-changelog-unconventional

> For usage examples and related documentation, see the original
> [conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)
> package.

This is a fork of and drop-in replacement for
[conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits).
Along with various bug fixes, what follows are the major differences:

### Updated to use modern JS/TypeScript

This rewrite uses a modern Babel-based build chain, is written in TypeScript, is
fully typed, and supports modern debugging practices.

> This will be true in the next version 😅

### A few style tweaks

Specifically:

- The scope and the first line of the subject of breaking changes are made bold
- Scope-less subjects are made sentence case
- Reverts are italicized
- Better grammar from
  [conventional-recommended-bump](https://www.npmjs.com/package/conventional-recommended-bump)

### `feature` no longer an alias of `feat`

`feature` is no longer documented as a valid alias for the `feat` commit type.
Looking over the source, it doesn't seem like it actually works as described
anyway (i.e. `feat` and `feature` commits aren't grouped under the same header).

> Might re-enable this after studying the source a bit more and/or confirmation
> it actually works.

### No longer returns Promises

Calling
[conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)
emits a promise, making the result impossible to reference in synchronized code
(babel plugins, semantic-release configuration files, etc). This fork can be
consumed by both sync and async code alike.

> This also means `configOverrides` cannot be a Promise.

### Easier to customize

With
[conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits),
drilling down into the resulting
[config object](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#config)
and altering something like
[`writerOpts.transform`](https://github.com/conventional-changelog-archived-repos/conventional-changelog-writer#transform)
is difficult, especially if you only want to tweak rather than _completely
overwrite_ it. This fork makes deep customizations, including extending rather
than overwriting the default functionality, easier. Just pass in your
[config object](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#config)
which will be used to [tweak the default configuration](./index.js).

The standard configuration objects, i.e. of the kind passed to
[conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits),
are supported as well, making this plugin a drop-in replacement for the
aforesaid.

### Simpler source organization

Simplified the source code by concentrating default configuration to a
[single file](./defaults.js) with the all the configuration knobs easily
accessible among the topmatter.
