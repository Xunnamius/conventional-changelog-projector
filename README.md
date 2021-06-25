# conventional-changelog-unconventional

> For complete documentation, see the original
> [conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)
> package.

A fork of
[conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)
with the following features:

#### Updated to use modern JS/TypeScript

This rewrite uses a modern Babel-based build chain, is written in TypeScript, is
fully typed, and supports modern debugging practices.

> This will be true in the next version 😅

#### A few style tweaks for the generated CHANGELOG

Specifically:

- The scope and the first line of the subject of breaking changes are made bold
- Scope-less subjects are made sentence case
- Reverts are italicized
- Better grammar when using
  [conventional-recommended-bump](https://www.npmjs.com/package/conventional-recommended-bump)

#### No longer returns Promises

Calling
[conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)
emits a promise, making the result impossible to reference in synchronized code
(Babel plugins, semantic-release configuration files, etc). This fork, however,
does not have this problem and so can be consumed by both sync and async code
alike, i.e. the entire JS ecosystem.

#### Easier to customize

With
[conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits),
drilling down into the resulting
[config object](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#config)
and altering something like
[`writerOpts.transform`](https://github.com/conventional-changelog-archived-repos/conventional-changelog-writer#transform)
is difficult, especially if you only want to tweak rather than _completely
overwrite_ it. This fork makes deep customizations, including extending rather
than overwriting the default functionality, easier.

#### Simpler source organization

Simplified the source code by concentrating default configuration to a
[single file](./defaults.js).
