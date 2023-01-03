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

# @xunnamius/conventional-changelog-projector

This preset is a fork of
[conventional-changelog-conventionalcommits](https://www.npmjs.com/package/conventional-changelog-conventionalcommits)
built to work within the
[projector ecosystem](https://github.com/Xunnamius/projector).

> For now, see the original
> [conventional-changelog-conventionalcommits](https://www.npmjs.com/package/conventional-changelog-conventionalcommits)
> package for usage examples and related documentation.

## Install

```bash
npm install --save-dev @xunnamius/conventional-changelog-projector
```

If you're using
[`lernaPackage`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#lernapackage)
or
[`tagPrefix`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#tagPrefix)
configuration options, consider installing the
[fixed version of conventional-changelog](https://github.com/Xunnamius/conventional-changelog)
([see also](https://github.com/conventional-changelog/conventional-changelog/pull/865)).
For example:

```bash
npm install --save-dev https://xunn.at/conventional-changelog-cli
```

## Differences from Upstream

Along with several bug fixes (regex mangling, sorting problems, etc), what
follows are the major differences versus upstream.

### A Few Style Tweaks

Specifically:

- The scope is bolded
- Scope-less subjects are made sentence case
- The first line of the subject of breaking changes are bolded and sentence
  cased (scope is excluded)
- Reverts are italicized; malformed reverts are normalized
- Better grammar from
  [conventional-recommended-bump](https://www.npmjs.com/package/conventional-recommended-bump)

### Removed `release-as` Footer Line Support

Since this configuration is used primarily in
[`semantic-release`](https://www.npmjs.com/package/semantic-release)-based
flows, there is no reason to store release information in commit footers.

### No Longer Returns Promises

Calling
[conventional-changelog-conventionalcommits](https://www.npmjs.com/package/conventional-changelog-conventionalcommits)
emits a Promise, making the result impossible to reference in synchronized code
(babel plugins, semantic-release config files, some cli consumers, npm scripts,
etc).

This fork avoids the pain, allowing one shared configuration to be consumed by
[`conventional-changelog-core`](https://www.npmjs.com/package/conventional-changelog-core),
[`conventional-changelog-cli`](https://www.npmjs.com/package/conventional-changelog-cli)
via command line,
[`semantic-release`](https://www.npmjs.com/package/semantic-release) via release
configuration, [`projector`](https://www.npmjs.com/package/@xunnamius/projector)
and
[`projector-pipeline`](https://www.npmjs.com/package/@xunnamius/projector-pipeline)
at various points in the CI/CD pipeline, and other sync and async tooling.

> This also means `configOverrides` cannot be a Promise.

### Easier to Customize

When configuring
[conventional-changelog-conventionalcommits](https://www.npmjs.com/package/conventional-changelog-conventionalcommits),
drilling down into the
[config object](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#config)
and altering something like
[`writerOpts.transform`](https://github.com/conventional-changelog-archived-repos/conventional-changelog-writer#transform)
is not so easy. This fork allows you to tweak and chain invocations rather than
_completely overwrite_ these key functions via the various
[config](https://github.com/conventional-changelog/conventional-changelog-config-spec)
[keys](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-core#config).
See
[the function docs](https://github.com/Xunnamius/conventional-changelog-projector/blob/main/index.js#L8)
for more details.

### Simpler Source Organization

"Simplified" the source code by concentrating default configuration to a
[single file](./defaults.js) with the all the configuration knobs easily
accessible among the topmatter.

### Updated to Use Modern JS/Typescript

This fork uses a modern Babel-based build chain, is written in TypeScript, is
fully typed, and supports modern debugging practices.

<!-- TODO -->

> This will be true in the next minor version 😅

## Documentation

Further documentation can be found under [`docs/`][docs].

## Contributing and Support

**[New issues][choose-new-issue] and [pull requests][pr-compare] are always
welcome and greatly appreciated! 🤩** Just as well, you can [star 🌟 this
project][link-repo] to let me know you found it useful! ✊🏿 Thank you!

See [CONTRIBUTING.md][contributing] and [SUPPORT.md][support] for more
information.

[badge-blm]: https://xunn.at/badge-blm 'Join the movement!'
[link-blm]: https://xunn.at/donate-blm
[badge-maintenance]:
  https://img.shields.io/maintenance/active/2023
  'Is this package maintained?'
[link-repo]: https://github.com/xunnamius/conventional-changelog-projector
[badge-last-commit]:
  https://img.shields.io/github/last-commit/xunnamius/conventional-changelog-projector
  'Latest commit timestamp'
[badge-issues]:
  https://img.shields.io/github/issues/Xunnamius/conventional-changelog-projector
  'Open issues'
[link-issues]:
  https://github.com/Xunnamius/conventional-changelog-projector/issues?q=
[badge-pulls]:
  https://img.shields.io/github/issues-pr/xunnamius/conventional-changelog-projector
  'Open pull requests'
[link-pulls]:
  https://github.com/xunnamius/conventional-changelog-projector/pulls
[badge-codecov]:
  https://codecov.io/gh/Xunnamius/conventional-changelog-projector/branch/main/graph/badge.svg?token=HWRIOBAAPW
  'Is this package well-tested?'
[link-codecov]: https://codecov.io/gh/Xunnamius/conventional-changelog-projector
[badge-license]:
  https://img.shields.io/npm/l/@xunnamius/conventional-changelog-projector
  "This package's source license"
[link-license]:
  https://github.com/Xunnamius/conventional-changelog-projector/blob/main/LICENSE
[badge-fossa]:
  https://app.fossa.com/api/projects/custom+27276%2Fgit@github.com:Xunnamius%2Fconventional-changelog-projector.svg?type=large
  "Analysis of this package's license obligations"
[link-fossa]:
  https://app.fossa.com/projects/custom+27276%2Fgit@github.com:Xunnamius%2Fconventional-changelog-projector
[badge-npm]:
  https://api.ergodark.com/badges/npm-pkg-version/@xunnamius/conventional-changelog-projector
  'Install this package using npm or yarn!'
[link-npm]:
  https://www.npmjs.com/package/@xunnamius/conventional-changelog-projector
[badge-semantic-release]:
  https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
  'This repo practices continuous integration and deployment!'
[link-semantic-release]: https://github.com/semantic-release/semantic-release
[badge-size]:
  https://badgen.net/bundlephobia/minzip/@xunnamius/conventional-changelog-projector
[badge-tree-shaking]:
  https://badgen.net/bundlephobia/tree-shaking/@xunnamius/conventional-changelog-projector
  'Is this package optimized for Webpack?'
[link-bundlephobia]:
  https://bundlephobia.com/result?p=@xunnamius/conventional-changelog-projector
  'Package size (minified and gzipped)'
[package-json]: package.json
[docs]: docs
[choose-new-issue]:
  https://github.com/Xunnamius/conventional-changelog-projector/issues/new/choose
[pr-compare]:
  https://github.com/Xunnamius/conventional-changelog-projector/compare
[contributing]: CONTRIBUTING.md
[support]: .github/SUPPORT.md
