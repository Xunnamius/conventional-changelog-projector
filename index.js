'use strict';

const deepmerge = require('deepmerge');
const isPlainObject = require('is-plain-object');
const debug = require('debug')(`${require('./package.json').name}:index`);

/**
 * Constructs and returns an conventional-changelog config preset tweaked to be
 * a tad "unconventional". See the documentation for details and differences
 * from the official conventional-changelog-conventionalcommits package.
 *
 * `configOverrides` is recursively merged into the default config, overwriting
 * same keys. The exceptions to this are `writerOpts.generateOn`,
 * `writerOpts.transform`, and `recommendedBumpOpts.whatBump`. Functions at
 * these keys, if present, will be invoked _after_ their original
 * implementations; when invoked, they will receive the additional parameter
 * containing the result from the original implementation. Useful for quick
 * patches to core functionality without rewriting the package.
 *
 * Another exception is `writerOpts.types`, which is always merged via array
 * concatenation rather than an overwrite.
 *
 * @param
     {typeof import('./defaults')|(err: unknown, config: typeof
     import('./defaults')) => typeof import('./defaults')} configOverrides A
     config object or an old-world callback function
 * @returns {typeof import('./defaults')}
 */
module.exports = (configOverrides) => {
  const config = require('./defaults');

  // ? "Carefully" merge in configuration overrides
  Object.entries(configOverrides).forEach(([key, val]) => {
    let handled = true;

    if (['writerOpts', 'recommendedBumpOpts'].includes(key)) {
      if (val.generateOn) {
        debug('merging "writerOpts.generateOn" via function chaining');
        const _generateOn = config.writerOpts.generateOn;
        config.writerOpts.generateOn = (...args) =>
          val.generateOn(...[...args, _generateOn]);
      } else if (val.transform) {
        debug('merging "writerOpts.transform" via function chaining');
        const _transform = config.writerOpts.transform;
        config.writerOpts.transform = (...args) =>
          val.transform(...[...args, _transform]);
      } else if (val.whatBump) {
        debug('merging "recommendedBumpOpts.whatBump" via function chaining');
        const _whatBump = config.writerOpts.whatBump;
        config.writerOpts.whatBump = (...args) => val.whatBump(...[...args, _whatBump]);
      } else if (val.types) {
        debug('merging "writerOpts.types" via array concatenation');
        config.writerOpts.types = [...config.writerOpts.types, ...val.types];
      } else handled = false;
    }

    if (!handled) {
      debug(`merging "${key}" via deepmerge`);
      config[key] = deepmerge(config[key], val, {
        isMergeableObject: isPlainObject,
        arrayMerge: (_, source) => source
      });
    }
  });

  return typeof configOverrides == 'function' ? configOverrides(null, config) : config;
};

debug.extend('exports')('exports: %O', module.exports);
