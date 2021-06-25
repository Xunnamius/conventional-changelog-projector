<!-- prettier-ignore-start -->

<!-- badges-start -->

[![Black Lives Matter!][badge-blm]][link-blm]
[![Maintenance status][badge-maintenance]][link-repo]
[![Last commit timestamp][badge-last-commit]][link-repo]
[![Open issues][badge-issues]][link-issues]
[![Pull requests][badge-pulls]][link-pulls]
[![Codecov][badge-codecov]][link-codecov]
[![Source license][badge-license]][link-license]
[![Tree shaking support][badge-tree-shaking]][link-bundlephobia]
[![Compressed package size][badge-size]][link-bundlephobia]
[![NPM version][badge-npm]][link-npm]
[![Uses Semantic Release!][badge-semantic-release]][link-semantic-release]

<!-- badges-end -->

<!-- prettier-ignore-end -->

# conventional-changelog-unconventional

This is a fork of and drop-in replacement for
[conventional-changelog-conventionalcommits](https://www.npmjs.com/package/conventional-changelog-conventionalcommits).
Along with various bug fixes (regex string mangling, sorting problems, etc),
what follows are the major differences:

### Updated to use modern JS/TypeScript

This rewrite uses a modern Babel-based build chain, is written in TypeScript, is
fully typed, and supports modern debugging practices.

> This will be true in the next version 😅

### A few style tweaks

Specifically:

- The scope and the first line of the subject of breaking changes are made bold
- Scope-less subjects are made sentence case
- Reverts are italicized; malformed reverts are normalized
- Better grammar from
  [conventional-recommended-bump](https://www.npmjs.com/package/conventional-recommended-bump)

### Removed `release-as` footer line support

Since this configuration is used primarily in
[`semantic-release`](https://www.npmjs.com/package/semantic-release)-based
flows, there is no reason to store release information in commit footers.

### No longer returns Promises

Requiring and calling
[conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)
emits a Promise, making the result impossible to reference in synchronized code
(babel plugins, semantic-release config files, conventional-X-cli config). This
fork avoids the pain, allowing one shared configuration to be consumed by
[`conventional-changelog-core`](https://www.npmjs.com/package/conventional-changelog-core),
[`conventional-changelog-cli`](https://www.npmjs.com/package/conventional-changelog-cli) via command line, [`semantic-release`](https://www.npmjs.com/package/semantic-release) via release
configuration, [`projector`](https://www.npmjs.com/package/@xunnamius/projector) and
[`projector-pipeline`](https://www.npmjs.com/package/@xunnamius/projector-pipeline) at
various points in the CI/CD pipeline, and other sync and async tooling.

> This also means `configOverrides` cannot be a Promise.

### Easier to customize

With
[conventional-changelog-conventionalcommits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits),
drilling down into the resultant
[config object](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#config)
and altering something like
[`writerOpts.transform`](https://github.com/conventional-changelog-archived-repos/conventional-changelog-writer#transform)
is difficult, especially if you only want to tweak rather than _completely
overwrite_ it. This fork makes deep customizations, including extending rather
than overwriting the default functionality, easier. Just pass your
[config](https://github.com/conventional-changelog/conventional-changelog-config-spec)
[overrides](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#config),
which will be used to _tweak_ the default configuration (see
[the exported function itself](https://github.com/Xunnamius/conventional-changelog-unconventional/blob/main/index.js#L8)
for details).

### Simpler source organization

Simplified the source code by concentrating default configuration to a
[single file](./defaults.js) with the all the configuration knobs easily
accessible among the topmatter.

> For usage examples and related documentation, see the original
> [conventional-changelog-conventionalcommits](https://www.npmjs.com/package/conventional-changelog-conventionalcommits)
> package.

[badge-blm]: https://api.ergodark.com/badges/blm 'Join the movement!'
[link-blm]: https://secure.actblue.com/donate/ms_blm_homepage_2019
[badge-maintenance]:
  https://img.shields.io/maintenance/active/2021
  'Is this package maintained?'
[link-repo]: https://github.com/xunnamius/conventional-changelog-unconventional
[badge-last-commit]:
  https://img.shields.io/github/last-commit/xunnamius/conventional-changelog-unconventional
  'Latest commit timestamp'
[badge-issues]:
  https://isitmaintained.com/badge/open/Xunnamius/conventional-changelog-unconventional.svg
  'Open issues as a percentage of total issues'
[link-issues]:
  https://github.com/Xunnamius/conventional-changelog-unconventional/issues?q=
[badge-pulls]:
  https://img.shields.io/github/issues-pr/xunnamius/conventional-changelog-unconventional
  'Open pull requests'
[link-pulls]:
  https://github.com/xunnamius/conventional-changelog-unconventional/pulls
[badge-codecov]:
  https://codecov.io/gh/Xunnamius/conventional-changelog-unconventional/branch/main/graph/badge.svg?token=HWRIOBAAPW
  'Is this package well-tested?'
[link-codecov]:
  https://codecov.io/gh/Xunnamius/conventional-changelog-unconventional
[badge-license]:
  https://img.shields.io/npm/l/conventional-changelog-unconventional
  "This package's source license"
[link-license]:
  https://github.com/Xunnamius/conventional-changelog-unconventional/blob/main/LICENSE
[badge-npm]:
  https://api.ergodark.com/badges/npm-pkg-version/conventional-changelog-unconventional
  'Install this package using npm or yarn!'
[link-npm]: https://www.npmjs.com/package/conventional-changelog-unconventional
[badge-semantic-release]:
  https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
  'This repo practices continuous integration and deployment!'
[link-semantic-release]: https://github.com/semantic-release/semantic-release
[badge-size]:
  https://badgen.net/bundlephobia/minzip/conventional-changelog-unconventional
[badge-tree-shaking]:
  https://badgen.net/bundlephobia/tree-shaking/conventional-changelog-unconventional
  'Is this package optimized for Webpack?'
[link-bundlephobia]:
  https://bundlephobia.com/result?p=conventional-changelog-unconventional
  'Package size (minified and gzipped)'
