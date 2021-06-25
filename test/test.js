'use strict';
const conventionalChangelogCore = require('conventional-changelog-core');
const getPreset = require('../index');
const expect = require('chai').expect;
const mocha = require('mocha');
const it = mocha.it;
const gitDummyCommit = require('git-dummy-commit');
const shell = require('shelljs');
const through = require('through2');
const { writeFileSync } = require('fs');
const betterThanBefore = require('better-than-before')();
const preparing = betterThanBefore.preparing;

// TODO: upgrade to using projector-pipeline suite of tools instead of all this

betterThanBefore.setups([
  function () {
    shell.config.resetForTesting();
    shell.cd('/tmp');
    shell.rm('-rf', 'cvc-test');
    shell.mkdir('cvc-test');
    shell.cd('cvc-test');
    writeFileSync(
      '/tmp/cvc-test/package.json',
      JSON.stringify({
        name: 'fake-pkg',
        version: '1.2.3',
        description: 'fake',
        repository: {
          type: 'git',
          url: 'https://github.com/fake-user/fake-repo.git',
          lens: 'cjs'
        }
      })
    );
    shell.mkdir('git-templates');
    shell.exec('git init --template=./git-templates');

    gitDummyCommit(['build!: first build setup', 'BREAKING CHANGE: New build system.']);
    gitDummyCommit([
      'ci(travis): add TravisCI pipeline',
      'BREAKING CHANGE: Continuously integrated.'
    ]);
    gitDummyCommit([
      'Feat: amazing new module',
      'BREAKING CHANGE: Not backward compatible.'
    ]);
    gitDummyCommit(['Fix(compile): avoid a bug', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['perf(ngOptions): make it faster', ' closes #1, #2']);
    gitDummyCommit([
      'fix(changelog): proper issue links',
      ' see #1, fake-user/fake-repo#358'
    ]);
    gitDummyCommit('revert(ngOptions): bad commit');
    gitDummyCommit('fix(*): oops');
    gitDummyCommit(['fix(changelog): proper issue links', ' see GH-1']);
    gitDummyCommit(['feat(awesome): address EXAMPLE-1']);
    gitDummyCommit(['chore(deps): upgrade example from 1 to 2']);
    gitDummyCommit(['chore(release): release 0.0.0']);
  },
  function () {
    gitDummyCommit(['feat(awesome): addresses the issue brought up in #133']);
  },
  function () {
    gitDummyCommit(['feat(awesome): fix #88']);
  },
  function () {
    gitDummyCommit(['feat(awesome): issue brought up by @bcoe! on Friday']);
  },
  function () {
    gitDummyCommit([
      'build(npm): edit build script',
      'BREAKING CHANGE: The Change is huge.'
    ]);
    gitDummyCommit(['ci(travis): setup travis', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit([
      'docs(readme): make it clear',
      'BREAKING CHANGE: The Change is huge.'
    ]);
    gitDummyCommit([
      'style(whitespace): make it easier to read',
      'BREAKING CHANGE: The Change is huge.'
    ]);
    gitDummyCommit([
      'refactor(code): change a lot of code',
      'BREAKING CHANGE: The Change is huge.'
    ]);
    gitDummyCommit(['test(*)!: more tests', 'BREAKING CHANGE: The Change is huge.']);
  },
  function () {
    shell.exec('git tag v0.1.0 -m "v0.1.0"');
    gitDummyCommit('feat: some more feats');
  },
  function () {
    shell.exec('git tag v0.2.0 -m "v0.2.0"');
    gitDummyCommit('feature: some more features');
  },
  function () {
    gitDummyCommit(['feat(*): implementing #5 by @dlmr', ' closes #10']);
  },
  function () {
    gitDummyCommit(['fix: use npm@5 (@username)']);
    gitDummyCommit([
      'build(deps): bump @dummy/package from 7.1.2 to 8.0.0',
      'BREAKING CHANGE: The Change is huge.'
    ]);
    gitDummyCommit([
      'feat: complex new feature',
      'this is a complex new feature with many reviewers',
      'Reviewer: @hutson',
      'Fixes: #99',
      'Refs: #100',
      'BREAKING CHANGE: this completely changes the API'
    ]);
    gitDummyCommit(['FEAT(foo)!: incredible new flag FIXES: #33']);
  },
  function () {
    gitDummyCommit([
      'Revert \\"feat: default revert format\\"',
      'This reverts commit 1234.'
    ]);
    gitDummyCommit(['revert: feat: custom revert format', 'This reverts commit 5678.']);
  },
  function () {
    gitDummyCommit(['chore: release at different version', 'Release-As: v3.0.2']);
  }
]);

it('should work if there is no semver tag', function (done) {
  preparing(1);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('1.2.3');
        expect(chunk).to.include('First build setup');
        expect(chunk).to.include('**travis:** add TravisCI pipeline');
        expect(chunk).to.include('**travis:** **Continuously integrated.**');
        expect(chunk).to.include('Amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');
        expect(chunk).to.include('make it faster');
        expect(chunk).to.include(
          '<sup>closes [#1](https://github.com/fake-user/fake-repo/issues/1), [#2](https://github.com/fake-user/fake-repo/issues/2)</sup>'
        );
        expect(chunk).to.include('New build system.');
        expect(chunk).to.include('Not backward compatible.');
        expect(chunk).to.include('**compile:** **The Change is huge.**');
        expect(chunk).to.include('Build System');
        expect(chunk).to.include('Continuous Integration');
        expect(chunk).to.include('Features');
        expect(chunk).to.include('Bug Fixes');
        expect(chunk).to.include('Performance Improvements');
        expect(chunk).to.include('Reverts');
        expect(chunk).to.include('bad commit');
        expect(chunk).to.include('BREAKING CHANGE');

        expect(chunk).to.not.include('ci');
        expect(chunk).to.not.include('feat');
        expect(chunk).to.not.include('fix');
        expect(chunk).to.not.include('Fix ');
        expect(chunk).to.not.include('perf');
        expect(chunk).to.not.include('revert');
        expect(chunk).to.not.include('***:**');
        expect(chunk).to.not.include(': Not backward compatible.');

        // CHANGELOG should group sections in order of importance:
        expect(
          chunk.indexOf('BREAKING CHANGE') < chunk.indexOf('Features') &&
            chunk.indexOf('Features') < chunk.indexOf('Bug Fixes') &&
            chunk.indexOf('Bug Fixes') < chunk.indexOf('Performance Improvements') &&
            chunk.indexOf('Performance Improvements') < chunk.indexOf('Reverts')
        ).to.equal(true);

        done();
      })
    );
});

it('should not list breaking change twice if ! is used', function (done) {
  preparing(1);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.not.match(/\* First build setup\r?\n/);
        done();
      })
    );
});

it('should allow additional "types" configuration to be provided', function (done) {
  preparing(1);

  gitDummyCommit(['mytype: new type from @Xunnamius']);

  conventionalChangelogCore({
    config: getPreset({
      types: [{ type: 'mytype', section: 'FAKE TYPE SECTION', hidden: false }]
    })
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('1.2.3');
        expect(chunk).to.include('First build setup');
        expect(chunk).to.include('**travis:** add TravisCI pipeline');
        expect(chunk).to.include('**travis:** **Continuously integrated.**');
        expect(chunk).to.include('Amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');
        expect(chunk).to.include('make it faster');
        expect(chunk).to.include('New build system.');
        expect(chunk).to.include('Not backward compatible.');
        expect(chunk).to.include('**compile:** **The Change is huge.**');
        expect(chunk).to.include('Build System');
        expect(chunk).to.include('Continuous Integration');
        expect(chunk).to.include('Features');
        expect(chunk).to.include('Bug Fixes');
        expect(chunk).to.include('Performance Improvements');
        expect(chunk).to.include('Reverts');
        expect(chunk).to.include('bad commit');
        expect(chunk).to.include('BREAKING CHANGE');
        expect(chunk).to.include('FAKE TYPE SECTION');
        expect(chunk).to.include('New type from');

        expect(chunk).to.not.include('ci');
        expect(chunk).to.not.include('feat');
        expect(chunk).to.not.include('fix');
        expect(chunk).to.not.include('Fix ');
        expect(chunk).to.not.include('perf');
        expect(chunk).to.not.include('revert');
        expect(chunk).to.not.include('***:**');
        expect(chunk).to.not.include(': Not backward compatible.');

        // CHANGELOG should group sections in order of importance:
        expect(
          chunk.indexOf('BREAKING CHANGE') < chunk.indexOf('Features') &&
            chunk.indexOf('Features') < chunk.indexOf('Bug Fixes') &&
            chunk.indexOf('Bug Fixes') < chunk.indexOf('Performance Improvements') &&
            chunk.indexOf('Performance Improvements') < chunk.indexOf('Reverts') &&
            chunk.indexOf('Reverts') < chunk.indexOf('FAKE TYPE SECTION')
        ).to.equal(true);

        done();
      })
    );
});

it('should allow "types" to be overridden using callback form', function (done) {
  preparing(1);
  conventionalChangelogCore({
    config: getPreset((config) => (config.types = []))
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('First build setup');
        expect(chunk).to.include('**travis:** add TravisCI pipeline');
        expect(chunk).to.include('**travis:** **Continuously integrated.**');
        expect(chunk).to.include('Amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');

        expect(chunk.toLowerCase()).to.not.include('make it faster');
        expect(chunk).to.not.include('Reverts');
        done();
      })
    );
});

it('should allow "types" to be overridden using second callback form', function (done) {
  preparing(1);
  conventionalChangelogCore({
    config: getPreset((_, config) => (config.types = []))
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('First build setup');
        expect(chunk).to.include('**travis:** add TravisCI pipeline');
        expect(chunk).to.include('**travis:** **Continuously integrated.**');
        expect(chunk).to.include('Amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');

        expect(chunk.toLowerCase()).to.not.include('make it faster');
        expect(chunk).to.not.include('Reverts');
        done();
      })
    );
});

it('should allow matching "scope" to configuration', function (done) {
  preparing(1);
  conventionalChangelogCore({
    config: getPreset((config) => {
      config.types = [{ type: 'chore', scope: 'deps', section: 'Dependencies' }];
    })
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('### Dependencies');
        expect(chunk).to.include('**deps:** upgrade example from 1 to 2');

        expect(chunk.toLowerCase()).to.not.include('release 0.0.0');
        done();
      })
    );
});

it('should properly format external repository issues', function (done) {
  preparing(1);
  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[#1](https://github.com/fake-user/fake-repo/issues/1)');
        expect(chunk).to.include('[#358<img');
        done();
      })
    );
});

it('should properly format external repository issues given an `issueUrlFormat`', function (done) {
  preparing(1);
  conventionalChangelogCore({
    config: getPreset({
      issuePrefixes: ['#', 'GH-'],
      issueUrlFormat: 'issues://{{repository}}/issues/{{id}}'
    })
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[#1](issues://fake-repo/issues/1)');
        expect(chunk).to.include(
          '[fake-user/fake-repo#358](issues://standard-version/issues/358)'
        );
        expect(chunk).to.include('[GH-1](issues://fake-repo/issues/1)');
        done();
      })
    );
});

it('should properly format issues in external issue tracker given an `issueUrlFormat` with `prefix`', function (done) {
  preparing(1);
  conventionalChangelogCore({
    config: getPreset({
      issueUrlFormat: 'https://example.com/browse/{{prefix}}{{id}}',
      issuePrefixes: ['EXAMPLE-']
    })
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[EXAMPLE-1](https://example.com/browse/EXAMPLE-1)');
        done();
      })
    );
});

it('should replace #[0-9]+ with GitHub format issue URL by default', function (done) {
  preparing(2);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include(
          '[#133](https://github.com/fake-user/fake-repo/issues/133)'
        );
        done();
      })
    );
});

it('should remove the issues that already appear in the subject', function (done) {
  preparing(3);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include(
          '[#88](https://github.com/fake-user/fake-repo/issues/88)'
        );
        expect(chunk.toLowerCase()).to.not.include(
          'closes [#88](https://github.com/fake-user/fake-repo/issues/88)'
        );
        done();
      })
    );
});

it('should replace @user with configured userUrlFormat', function (done) {
  preparing(4);

  conventionalChangelogCore({
    config: getPreset({
      userUrlFormat: 'https://foo/{{user}}'
    })
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[@bcoe](https://foo/bcoe)');
        done();
      })
    );
});

it('should not discard commit if there is BREAKING CHANGE', function (done) {
  preparing(5);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('Continuous Integration');
        expect(chunk).to.include('Build System');
        expect(chunk).to.include('Documentation');
        expect(chunk).to.include('Styles');
        expect(chunk).to.include('Code Refactoring');
        expect(chunk).to.include('Tests');

        done();
      })
    );
});

it('should omit optional ! in breaking commit', function (done) {
  preparing(5);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('### Tests');
        expect(chunk).to.include('* more tests');

        done();
      })
    );
});

it('should work if there is a semver tag', function (done) {
  preparing(6);
  let i = 0;

  conventionalChangelogCore({
    config: getPreset(),
    outputUnreleased: true
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(
        function (chunk, _, cb) {
          chunk = chunk.toString();

          expect(chunk).to.include('Some more feats');
          expect(chunk).to.not.include('BREAKING');

          i++;
          cb();
        },
        function () {
          expect(i).to.equal(1);
          done();
        }
      )
    );
});

it('should support "feature" as alias for "feat"', function (done) {
  preparing(7);
  let i = 0;

  conventionalChangelogCore({
    config: getPreset(),
    outputUnreleased: true
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(
        function (chunk, _, cb) {
          chunk = chunk.toString();

          expect(chunk).to.include('some more features');
          expect(chunk).to.not.include('BREAKING');

          i++;
          cb();
        },
        function () {
          expect(i).to.equal(1);
          done();
        }
      )
    );
});

it('should work with unknown host', function (done) {
  preparing(7);
  let i = 0;

  conventionalChangelogCore({
    config: getPreset({
      commitUrlFormat: 'http://unknown/commit/{{hash}}',
      compareUrlFormat: 'http://unknown/compare/{{previousTag}}...{{currentTag}}'
    }),
    pkg: {
      path: path.join(__dirname, 'fixtures/_unknown-host.json')
    }
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(
        function (chunk, _, cb) {
          chunk = chunk.toString();

          expect(chunk).to.include('(http://unknown/compare');
          expect(chunk).to.include('](http://unknown/commit/');

          i++;
          cb();
        },
        function () {
          expect(i).to.equal(1);
          done();
        }
      )
    );
});

it('should work specifying where to find a package.json using conventional-changelog-core', function (done) {
  preparing(8);
  let i = 0;

  conventionalChangelogCore({
    config: getPreset(),
    pkg: {
      path: path.join(__dirname, 'fixtures/_known-host.json')
    }
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(
        function (chunk, _, cb) {
          chunk = chunk.toString();

          expect(chunk).to.include('(https://github.com/fake-repo/example/compare');
          expect(chunk).to.include('](https://github.com/fake-repo/example/commit/');
          expect(chunk).to.include('](https://github.com/fake-repo/example/issues/');

          i++;
          cb();
        },
        function () {
          expect(i).to.equal(1);
          done();
        }
      )
    );
});

it('should fallback to the closest package.json when not providing a location for a package.json', function (done) {
  preparing(8);
  let i = 0;

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      console.info(err);
      done(err);
    })
    .pipe(
      through(
        function (chunk, _, cb) {
          chunk = chunk.toString();

          expect(chunk).to.include('(https://github.com/fake-user/fake-repo/compare');
          expect(chunk).to.include('](https://github.com/fake-user/fake-repo/commit/');
          expect(chunk).to.include('](https://github.com/fake-user/fake-repo/issues/');

          i++;
          cb();
        },
        function () {
          expect(i).to.equal(1);
          done();
        }
      )
    );
});

it('should support non public GitHub repository locations', function (done) {
  preparing(8);

  conventionalChangelogCore({
    config: getPreset(),
    pkg: {
      path: path.join(__dirname, 'fixtures/_ghe-host.json')
    }
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('(https://github.internal.example.com/dlmr');
        expect(chunk).to.include(
          '(https://github.internal.example.com/fake-repo/internal/compare'
        );
        expect(chunk).to.include(
          '](https://github.internal.example.com/fake-repo/internal/commit/'
        );
        expect(chunk).to.include(
          '5](https://github.internal.example.com/fake-repo/internal/issues/5'
        );
        expect(chunk).to.include(
          ' closes [#10](https://github.internal.example.com/fake-repo/internal/issues/10)'
        );

        done();
      })
    );
});

it('should only replace with link to user if it is an username', function (done) {
  preparing(9);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();

        expect(chunk.toLowerCase()).to.not.include('(https://github.com/5');
        expect(chunk).to.include('(https://github.com/username');

        expect(chunk.toLowerCase()).to.not.include(
          '[@dummy](https://github.com/dummy)/package'
        );
        expect(chunk).to.include('bump @dummy/package from');
        done();
      })
    );
});

it('supports multiple lines of footer information', function (done) {
  preparing(9);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('closes [#99]');
        expect(chunk).to.include('[#100]');
        expect(chunk).to.include('this completely changes the API');
        done();
      })
    );
});

it('does not require that types are case sensitive', function (done) {
  preparing(9);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('incredible new flag');
        done();
      })
    );
});

it('populates breaking change if ! is present', function (done) {
  preparing(9);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.match(/incredible new flag FIXES: #33\r?\n/);
        done();
      })
    );
});

it('parses both default (Revert "<subject>") and custom (revert: <subject>) revert commits', function (done) {
  preparing(10);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.match(/custom revert format/);
        expect(chunk).to.match(/default revert format/);
        done();
      })
    );
});

it('should include commits with "Release-As:" footer in CHANGELOG', function (done) {
  preparing(11);

  conventionalChangelogCore({
    config: getPreset()
  })
    .on('error', function (err) {
      done(err);
    })
    .pipe(
      through(function (chunk) {
        chunk = chunk.toString();
        expect(chunk).to.match(/release at different version/);
        done();
      })
    );
});
