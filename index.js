'use strict';

const deepmerge = require('deepmerge');
const { isPlainObject } = require('is-plain-object');
const debug = require('debug')(`${require(__dirname + '/package.json').name}:index`);

/**
 * Returns an "unconventional" conventional-changelog configuration preset. See
 * the documentation for details on the differences between this and the
 * official `conventional-changelog-conventionalcommits` package.
 *
 * `configOverrides`, if an object, is recursively merged into the default
 * config, overwriting same keys. The exceptions to this include
 * `writerOpts.generateOn`, `writerOpts.transform`, and
 * `recommendedBumpOpts.whatBump`. Functions at these keys, if present, will be
 * invoked _after_ their original implementations; when invoked, they will
 * receive an additional parameter containing the result from the original
 * implementation. The other exception is `types`, which is always merged via
 * array concatenation rather than an overwrite. Every other key is deep-merged.
 *
 * If `configOverrides` is a function, it should be of the form
 * `configOverrides(config) => void`. Ancient-style callbacks also supported.
 *
 * @param {((config: Record<string, unknown>) => void) | ((_: null, config:
    Record<string, unknown>) => void)}
    configOverrides
    A spec-compliant conventional-changelog config object
 * @returns {typeof import('./defaults')}
 */
module.exports = (configOverrides) => {
  const config = require(`${__dirname}/defaults`)();

  if (typeof configOverrides == 'function') {
    if (configOverrides.length == 2) configOverrides(null, config);
    else configOverrides(config);
  } else if (isPlainObject(configOverrides)) {
    // ? "Carefully" merge in configuration overrides
    Object.entries(configOverrides).forEach(([key, val]) => {
      let handled = false;

      if (['writerOpts', 'recommendedBumpOpts'].includes(key)) {
        handled = true;

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
        } else handled = false;
      } else if (key == 'types') {
        debug('merging "types" via array concatenation');
        config.types = [...config.types, ...val];
        handled = true;
      }

      if (!handled) {
        debug(`merging "${key}" via deepmerge`);
        config[key] = !isPlainObject(config[key])
          ? val
          : deepmerge(config[key], val, {
              isMergeableObject: isPlainObject,
              arrayMerge: (_, source) => source
            });
      }
    });
  }

  return config;
};

debug.extend('exports')('exports: %O', module.exports);
