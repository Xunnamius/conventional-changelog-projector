/// <reference types="node" />
/**
 * Returns an "unconventional" conventional-changelog configuration preset.
 *
 * `configOverrides`, if an object, is recursively merged into the default
 * config, overwriting same keys. Exceptions to this include
 * `writerOpts.generateOn`, `writerOpts.transform`, and
 * `recommendedBumpOpts.whatBump`. The functions at these keys, if present, will
 * be invoked _after_ their original implementations; when invoked, they will
 * receive an additional parameter containing the result from the original
 * implementation. The only other exception is `types`, which is always merged
 * via array concatenation. Every other key is deep-merged using
 * `Object.assign()`.
 *
 * If `configOverrides` is a function, it should be of the form
 * `configOverrides(config) => void`. Ancient-style callbacks of the form
 * `configOverrides(err, config) => void` are also supported.
 */
export default function main(
  configOverrides?: (config: Record<string, unknown>) => void
): typeof import('./defaults');
export default function main(
  configOverrides?: (err: null, config: Record<string, unknown>) => void
): typeof import('./defaults');
