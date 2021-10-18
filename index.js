'use strict';

const deepObjectAssign = require('assign-deep');
const { isPlainObject } = require('is-plain-object');
const debug = require('debug')(`${require('./package.json').name}:index`);
const getDefaults = require('./defaults');

/**
 * Returns an "unconventional" conventional-changelog configuration preset. See
 * the documentation for details on the differences between this and the
 * official `conventional-changelog-conventionalcommits` package.
 *
 * `configOverrides`, if an object, is recursively merged into the default
 * config, overwriting same keys. The exceptions to this include
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
module.exports = (configOverrides) => {
  const { config, finish } = getDefaults();

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
          config.writerOpts.generateOn = (...args) => {
            const result = _generateOn(...args);
            return val.generateOn(...[...args, result]);
          };
        } else if (val.transform) {
          debug('merging "writerOpts.transform" via function chaining');
          const _transform = config.writerOpts.transform;
          config.writerOpts.transform = (...args) => {
            const result = _transform(...args);
            val.transform(...[...args, result]);
          };
        } else if (val.whatBump) {
          debug('merging "recommendedBumpOpts.whatBump" via function chaining');
          const _whatBump = config.writerOpts.whatBump;
          config.writerOpts.whatBump = (...args) => {
            const result = _whatBump(...args);
            val.whatBump(...[...args, result]);
          };
        } else handled = false;
      } else if (key == 'types') {
        debug('merging "types" via array concatenation');
        config.types = [...config.types, ...val];
        handled = true;
      }

      if (!handled) {
        const useDOA = isPlainObject(config[key]) && isPlainObject(val);
        debug(`merging "${key}" via ${useDOA ? 'deep object assignment' : 'overwrite'}`);
        useDOA ? deepObjectAssign(config[key], val) : (config[key] = val);
      }
    });
  }

  finish();
  return config;
};

debug.extend('exports')('exports: %O', module.exports);
