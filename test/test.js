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
const path = require('path');
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
      'see #1, fake-user/fake-repo#358'
    ]);
    // ! XXX: gitDummyCommit sucks for this, switch away from it to own code
    gitDummyCommit('revert(ngOptions): \\"feat(headstrong): bad commit\\"');
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
    gitDummyCommit('feat(another): more features');
    gitDummyCommit('feature: some more features');
    gitDummyCommit('feat: even more features');
  },
  function () {
    gitDummyCommit(['feat(*): implementing #5 by @dlmr', ' closes #10']);
  },
  function () {
    gitDummyCommit(['fix: use npm@5 (@username)']);
    gitDummyCommit([
      'build(deps): bump @dummy/package from 7.1.2 to 8.0.0 (thanks @Xunnamius, @suimannux @user1/@user2, @user3/@+u%+(#bad email@aol.com with help from @merchanz039f9)',
      'BREAKING CHANGE: The Change is huge. Big. Really big.',
      'Really. Like super big. Wow! Here are some extra details!'
    ]);
    gitDummyCommit([
      'feat: complex new feature',
      'this is a complex new feature with many reviewers',
      'Reviewer: @hutson',
      'Fixes: #99',
      'Refs: #100',
      'BREAKING CHANGE: this completely changes the API'
    ]);
    gitDummyCommit(['FEAT(FOO)!: incredible new flag FIXES: #33']);
  },
  function () {
    gitDummyCommit([
      'Revert \\"feat: default revert format\\"',
      'This reverts commit 1234.'
    ]);
    gitDummyCommit(['revert: feat: custom revert format', 'This reverts commit 5678.']);
    gitDummyCommit([
      'revert: \\"Feat(two): custom revert format 2\\"',
      'This reverts commit 9101112.'
    ]);
    gitDummyCommit('revert: \\"feat(X): broken-but-still-supported revert\\"');
  },
  function () {
    shell.exec('git tag v0.3.0 -m "v0.3.0"');
    gitDummyCommit([
      'refactor(code): big bigly big change skip1! [skip ci]',
      'BREAKING CHANGE: the change is bigly luxurious 5-stars everybody is saying'
    ]);
    gitDummyCommit('feat: something else skip2 [cd skip]');
    gitDummyCommit('fix: something other skip3 [CI SKIP]');
    gitDummyCommit('build(bore): include1 [skipcd]');
  }
]);

// TODO: split up tests that are testing more than one thing (sometimes secretly)

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
        expect(chunk).to.include('**_travis_:** **Continuously integrated.**');
        expect(chunk).to.include('Amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');
        expect(chunk).to.include('make it faster');
        expect(chunk).to.include(
          '<sup>closes [#1](https://github.com/fake-user/fake-repo/issues/1), [#2](https://github.com/fake-user/fake-repo/issues/2)</sup>'
        );
        expect(chunk).to.include('New build system.');
        expect(chunk).to.include('Not backward compatible.');
        expect(chunk).to.include('**_compile_:** **The Change is huge.**');
        expect(chunk).to.include('Build system');
        expect(chunk).to.include('CI/CD');
        expect(chunk).to.include('Features');
        expect(chunk).to.include('Fixes');
        expect(chunk).to.include('Optimizations');
        expect(chunk).to.include('Reverted');
        expect(chunk).to.include('"feat(headstrong): bad commit"');
        expect(chunk).to.include('BREAKING CHANGE');

        expect(chunk).to.not.include('ci');
        expect(chunk).to.not.match(/feat(?!\()/);
        expect(chunk).to.not.include('fix');
        expect(chunk).to.not.include('Fix ');
        expect(chunk).to.not.include('perf');
        expect(chunk).to.not.include('revert');
        expect(chunk).to.not.include('***:**');
        expect(chunk).to.not.include(': Not backward compatible.');

        // CHANGELOG should group sections in order of importance:
        expect(
          chunk.indexOf('BREAKING CHANGE') < chunk.indexOf('Features') &&
            chunk.indexOf('Features') < chunk.indexOf('Fixes') &&
            chunk.indexOf('Fixes') < chunk.indexOf('Optimizations') &&
            chunk.indexOf('Optimizations') < chunk.indexOf('Reverted')
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
        expect(chunk).to.include('**_travis_:** **Continuously integrated.**');
        expect(chunk).to.include('Amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');
        expect(chunk).to.include('make it faster');
        expect(chunk).to.include('New build system.');
        expect(chunk).to.include('Not backward compatible.');
        expect(chunk).to.include('**_compile_:** **The Change is huge.**');
        expect(chunk).to.include('Build system');
        expect(chunk).to.include('CI/CD');
        expect(chunk).to.include('Features');
        expect(chunk).to.include('Fixes');
        expect(chunk).to.include('Optimizations');
        expect(chunk).to.include('Reverted');
        expect(chunk).to.include('"feat(headstrong): bad commit"');
        expect(chunk).to.include('BREAKING CHANGE');
        expect(chunk).to.include('FAKE TYPE SECTION');
        expect(chunk).to.include('New type from');

        expect(chunk).to.not.include('ci');
        expect(chunk).to.not.match(/feat(?!\()/);
        expect(chunk).to.not.include('fix');
        expect(chunk).to.not.include('Fix ');
        expect(chunk).to.not.include('perf');
        expect(chunk).to.not.include('revert');
        expect(chunk).to.not.include('***:**');
        expect(chunk).to.not.include(': Not backward compatible.');

        // CHANGELOG should group sections in order of importance:
        expect(
          chunk.indexOf('BREAKING CHANGE') < chunk.indexOf('Features') &&
            chunk.indexOf('Features') < chunk.indexOf('Fixes') &&
            chunk.indexOf('Fixes') < chunk.indexOf('Optimizations') &&
            chunk.indexOf('Optimizations') < chunk.indexOf('Reverted') &&
            chunk.indexOf('Reverted') < chunk.indexOf('FAKE TYPE SECTION')
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
        expect(chunk).to.include('**_travis_:** **Continuously integrated.**');
        expect(chunk).to.include('Amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');

        expect(chunk.toLowerCase()).to.not.include('make it faster');
        expect(chunk).to.not.include('Reverted');
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
        expect(chunk).to.include('**_travis_:** **Continuously integrated.**');
        expect(chunk).to.include('Amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');

        expect(chunk.toLowerCase()).to.not.include('make it faster');
        expect(chunk).to.not.include('Reverted');
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
        expect(chunk).to.match(
          /\[#358<img .*? \/>\]\(issues:\/\/fake-repo\/issues\/358\)/g
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

        expect(chunk).to.include('CI/CD');
        expect(chunk).to.include('Build system');
        expect(chunk).to.include('Documentation');
        expect(chunk).to.include('Aesthetics');
        expect(chunk).to.include('Refactored');
        expect(chunk).to.include('Test system');

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

        expect(chunk).to.match(/^#### \S+ Test system$/m);
        expect(chunk).to.include('* More tests');

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

it('should treat "feature" as a perfect alias for "feat"', function (done) {
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

          expect(chunk).to.include('* Some more features');
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

// TODO: this test is broken by upstream, investigate what to do about it
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
          '<sup>closes [#10](https://github.internal.example.com/fake-repo/internal/issues/10)'
        );

        done();
      })
    );
});

it('should only replace with link to user if it is a username', function (done) {
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
        expect(chunk).to.include('[@Xunnamius](https://github.com/Xunnamius),');
        expect(chunk).to.include('[@suimannux](https://github.com/suimannux) ');
        expect(chunk).to.include(
          '[@user1](https://github.com/user1)/[@user2](https://github.com/user2),'
        );
        expect(chunk).to.include('[@user3](https://github.com/user3)/@+u%+(#bad');
        expect(chunk).to.include(
          'from [@merchanz039f9](https://github.com/merchanz039f9))'
        );

        expect(chunk).to.not.include('[@aol');
        done();
      })
    );
});

it('should support multiple lines of footer information', function (done) {
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
        expect(chunk).to.include('* **This completely changes the API**');
        done();
      })
    );
});

it('should not require that types are case sensitive', function (done) {
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

it('should populate breaking change notes if ! is present', function (done) {
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
        // TODO: next version should sweep the rest of the document for links
        // TODO: and transform them
        expect(chunk).to.include('incredible new flag FIXES: #33**\n');
        done();
      })
    );
});

it('should lowercase scope strings', function (done) {
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
        expect(chunk).to.include('foo_:** **incredible new flag');
        done();
      })
    );
});

it('should parse default, customized, and malformed revert commits', function (done) {
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
        expect(chunk).to.include('*"feat: default revert format"*');
        expect(chunk).to.include('*Feat: custom revert format*');
        expect(chunk).to.include('*"Feat(two): custom revert format 2"*');
        expect(chunk).to.include('*"feat(X): broken-but-still-supported revert"*');

        done();
      })
    );
});

it('should discard ALL commits with skip commands in the subject', function (done) {
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
        expect(chunk).to.include('include1');
        expect(chunk).to.not.include('BREAKING');
        expect(chunk).to.not.include('skip1');
        expect(chunk).to.not.include('skip2');
        expect(chunk).to.not.include('skip3');

        done();
      })
    );
});
