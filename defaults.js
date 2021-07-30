'use strict';

const { readFileSync } = require('fs');
const { toss } = require('toss-expression');
const debug = require('debug')(`${require(__dirname + '/package.json').name}:defaults`);
const semver = require('semver');

// ? The preamble prefixed to any generated changelog
const CHANGELOG_TITLE =
  `# Changelog\n\n` +
  `All notable changes to this project will be documented in this auto-generated\n` +
  `file. The format is based on [Conventional Commits](https://conventionalcommits.org);\n` +
  `this project adheres to [Semantic Versioning](https://semver.org).`;

// ? Strings in commit messages that, when found, are skipped
const SKIP_COMMANDS = ['[skip ci]', '[ci skip]', '[skip cd]', '[cd skip]'];

// ? Commits, having been grouped by type, will appear in the CHANGELOG in the
// ? order they appear in COMMIT_TYPE_CHANGELOG_ORDER. Types that are not listed
// ? in COMMIT_TYPE_CHANGELOG_ORDER will appear in input order _after_ listed
// ? types.
const COMMIT_TYPE_CHANGELOG_ORDER = ['feat', 'fix', 'perf', 'build', 'revert'];

// ? Matches a valid GitHub username with respect to the following:
// ?   - Avoids matching scoped package names (e.g. @xunnamius/package)
// ?   - Will match multiple usernames separated by slash (e.g. @user1/@user2)
const USERNAME_REGEX = /\B@([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})\b(?!\/(?!@))/gi;

// ? Used to normalize the aesthetic of revert CHANGELOG entries
const DELETE_REVERT_PREFIX_REGEX = /^Revert\s+/;

// ? The character(s) used to reference issues by number on GitHub
const ISSUE_PREFIXES = ['#'];

// ? Handlebars template data
const templates = {
  commit: readFileSync(`${__dirname}/templates/commit.hbs`, 'utf-8'),
  footer: readFileSync(`${__dirname}/templates/footer.hbs`, 'utf-8'),
  header: readFileSync(`${__dirname}/templates/header.hbs`, 'utf-8'),
  template: readFileSync(`${__dirname}/templates/template.hbs`, 'utf-8'),
  // ? Handlebars partials for property substitutions using commit context
  partials: {
    owner: '{{#if this.owner}}{{~this.owner}}{{else}}{{~@root.owner}}{{/if}}',
    host: '{{~@root.host}}',
    repository:
      '{{#if this.repository}}{{~this.repository}}{{else}}{{~@root.repository}}{{/if}}'
  }
};

/**
 * Transform a string into sentence case capitalization.
 *
 * @param {string} s The string to transform
 */
const sentenceCase = (s) => s.toString().charAt(0).toUpperCase() + s.toString().slice(1);

/**
 * Expand simple handlebars templates without actually using handlebars.
 *
 * @param {string} template
 * @param {Record<string, string>} context
 */
const expandTemplate = (template, context) => {
  Object.keys(context).forEach((key) => {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), context[key]);
  });
  return template;
};

/**
 * Returns a partially initialized configuration object as well as a `finish`
 * function. Call `finish()` to complete initialization or behavior is
 * undefined.
 */
module.exports = () => {
  /**
   * Adds additional breaking change notes for the special case
   * `test(system)!: hello world` but with no `BREAKING CHANGE` in body.
   *
   * @param {Record<string, unknown>} commit
   */
  const addBangNotes = ({ header, notes }) => {
    const match = header.match(config.parserOpts.breakingHeaderPattern);
    if (match && notes.length == 0) {
      const noteText = match[3]; // ? Commit subject becomes BC note text
      notes.push({
        text: noteText
      });
    }
  };

  // ? Single source of truth for shared values
  const memory = {
    issuePrefixes: ISSUE_PREFIXES
  };

  /**
   * The default partially-initialized conventional-changelog config object.
   */
  // TODO: add this comment to type description instead
  const config = {
    // * Custom configuration keys * \\
    changelogTitle: CHANGELOG_TITLE,
    skipCommands: SKIP_COMMANDS.map((cmd) => cmd.toLowerCase()),

    // * Core configuration keys * \\

    // conventionalChangelog and recommendedBumpOpts keys are defined below
    gitRawCommitsOpts: {
      // ? `null` unsets the flag passed to the git CLI, ensuring all commits
      // ? are analyzed. `true` (old default) hides merge commits while `false`
      // ? hides non merge commits. See also: https://shorturl.at/bjCW5
      noMerges: null
    },
    // ? See: https://shorturl.at/aguFJ
    parserOpts: {
      headerPattern: /^(\w*)(?:\(([^\)]*)\))?!?: (.*)$/,
      breakingHeaderPattern: /^(\w*)(?:\(([^\)]*)\))?!: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
      mergePattern: /^Merge pull request #(\d+) from (.*)$/,
      mergeCorrespondence: ['id', 'source'],
      revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w*)\./i,
      revertCorrespondence: ['header', 'hash'],
      noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING'],
      // ? See: https://shorturl.at/bivyB
      warn: console.warn.bind(console),
      get issuePrefixes() {
        return memory.issuePrefixes;
      },
      set issuePrefixes(v) {
        memory.issuePrefixes = v;
      }
    },
    // ? See: https://shorturl.at/qrzS3
    writerOpts: {
      generateOn: ({ version }) => {
        const debug1 = debug.extend('writerOpts:generateOn');
        debug1(`saw version: ${version}`);
        const decision = !!semver.valid(version) && !semver.prerelease(version);
        debug1(`decision: ${decision}`);
        return decision;
      },
      // transform sub-key is defined below
      mainTemplate: templates.template,
      // headerPartial and commitPartial sub-keys are defined below
      footerPartial: templates.footer,
      groupBy: 'type',
      // ? Commit message groupings (e.g. Features) are sorted by their
      // ? importance. Unlike the original version, this is a stable sort algo!
      // ? See: https://shorturl.at/hqAGX
      commitGroupsSort: (a, b) => {
        a = commitGroupOrder.indexOf(a.title);
        b = commitGroupOrder.indexOf(b.title);
        return a == -1 || b == -1 ? b - a : a - b;
      },
      commitsSort: ['scope', 'subject'],
      noteGroupsSort: 'title'
    },

    // * Spec-compliant configuration keys * \\
    // ? See: https://shorturl.at/dgY68

    // ? Commits are grouped by section; new types can alias existing types by
    // ? matching sections:
    // prettier-ignore
    types: [
      { type: 'feat',     section: '✨ Features',       hidden: false },
      { type: 'feature',  section: '✨ Features',       hidden: false },
      { type: 'fix',      section: '🪄 Fixes',          hidden: false },
      { type: 'perf',     section: '⚡️ Optimizations',  hidden: false },
      { type: 'revert',   section: '🔥 Reverted',       hidden: false },
      { type: 'build',    section: '⚙️ Build system',   hidden: false },
      { type: 'docs',     section: '📚 Documentation',  hidden: true },
      { type: 'style',    section: '💎 Aesthetics',     hidden: true },
      { type: 'refactor', section: '🧙🏿 Refactored',     hidden: true },
      { type: 'test',     section: '⚗️ Test system',    hidden: true },
      { type: 'ci',       section: '🏭 CI/CD',          hidden: true },
      { type: 'cd',       section: '🏭 CI/CD',          hidden: true },
      { type: 'chore',    section: '🗄️ Miscellaneous',  hidden: true }
    ],
    commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
    compareUrlFormat:
      '{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}',
    issueUrlFormat: '{{host}}/{{owner}}/{{repository}}/issues/{{id}}',
    userUrlFormat: '{{host}}/{{user}}',
    get issuePrefixes() {
      return memory.issuePrefixes;
    },
    set issuePrefixes(v) {
      memory.issuePrefixes = v;
    }
  };

  config.writerOpts.transform = (commit, context) => {
    const debug1 = debug.extend('writerOpts:transform');

    // ? Scope should always be lowercase (or undefined)
    commit.scope = commit.scope?.toLowerCase();

    let discard = true;
    const issues = [];
    const typeKey = (commit.revert ? 'revert' : commit.type || '').toLowerCase();
    const typeEntry = config.types.find(
      (entry) => entry.type == typeKey && (!entry.scope || entry.scope == commit.scope)
    );
    const skipCmdEvalTarget = `${commit.subject || ''}${
      commit.header || ''
    }`.toLowerCase();

    // ? Ignore any commits with skip commands in them (including BCs)
    if (config.skipCommands.some((cmd) => skipCmdEvalTarget.includes(cmd))) {
      debug1('saw skip command in commit message; discarding immediately');
      debug1('decision: commit discarded');
      return;
    }

    addBangNotes(commit);

    // ? Otherwise, never ignore breaking changes. Additionally, make all scopes
    // ?  and subjects bold. Scope-less subjects are made sentence case.
    commit.notes.forEach((note) => {
      if (note.text) {
        debug1('saw BC notes for this commit; NOT discarding...');
        const [firstLine, ...remainder] = note.text.trim().split('\n');
        // ? Never discard breaking changes
        discard = false;

        note.title = 'BREAKING CHANGES';
        note.text =
          `**${!commit.scope ? sentenceCase(firstLine) : firstLine}**` +
          remainder.reduce((result, line) => `${result}\n${line}`, '');
      }
    });

    // ? Discard entries of unknown or hidden types if discard == true
    if (discard && (typeEntry === undefined || typeEntry.hidden)) {
      debug1('decision: commit discarded');
      return;
    } else debug1('decision: commit NOT discarded');

    if (typeEntry) commit.type = typeEntry.section;
    if (commit.scope == '*') commit.scope = '';
    if (typeof commit.hash == 'string') commit.shortHash = commit.hash.substring(0, 7);

    // ? Badly crafted reverts are all header and no subject
    if (typeKey == 'revert' && !commit.subject) {
      commit.subject = commit.header.replace(DELETE_REVERT_PREFIX_REGEX, '');
    }

    if (typeof commit.subject == 'string') {
      // ? Replace issue refs with URIs
      const issueRegex = new RegExp(`(${config.issuePrefixes.join('|')})([0-9]+)`, 'g');
      commit.subject = commit.subject.replace(issueRegex, (_, prefix, issue) => {
        const issueStr = `${prefix}${issue}`;
        const url = expandTemplate(config.issueUrlFormat, {
          host: context.host,
          owner: context.owner,
          repository: context.repository,
          id: issue,
          prefix: prefix
        });

        issues.push(issueStr);
        return `[${issueStr}](${url})`;
      });

      // ? Replace user refs with URIs
      commit.subject = commit.subject.replace(
        // * https://github.com/shinnn/github-username-regex
        USERNAME_REGEX,
        (_, user) => {
          const usernameUrl = expandTemplate(config.userUrlFormat, {
            host: context.host,
            owner: context.owner,
            repository: context.repository,
            user
          });

          return `[@${user}](${usernameUrl})`;
        }
      );

      // ? Make scope-less commit subjects sentence case
      if (!commit.scope) commit.subject = sentenceCase(commit.subject);

      // ? Italicize reverts
      if (typeKey == 'revert') commit.subject = `*${commit.subject}*`;
    }

    // ? Remove references that already appear in the subject
    commit.references = commit.references.filter(
      ({ prefix, issue }) => !issues.includes(`${prefix}${issue}`)
    );

    debug1('transformed commit: %O', commit);
    return commit;
  };

  // ? The order commit type groups will appear in (ordered by section title)
  const commitGroupOrder = COMMIT_TYPE_CHANGELOG_ORDER.map(
    (type) =>
      config.types.find((entry) => entry.type == type).section ||
      toss(new Error(`unmatched commit type "${type}" in COMMIT_TYPE_CHANGELOG_ORDER`))
  );

  // ! Must be called after tweaking the default config object !
  /**
   * Finish initializing the default config object.
   */
  // TODO: add this comment to type description instead
  const finish = () => {
    if (!config.writerOpts.headerPartial) {
      config.writerOpts.headerPartial = expandTemplate(templates.header, {
        compareUrlFormat: expandTemplate(config.compareUrlFormat, {
          host: templates.partials.host,
          owner: templates.partials.owner,
          repository: templates.partials.repository
        })
      });
    }

    if (!config.writerOpts.commitPartial) {
      config.writerOpts.commitPartial = expandTemplate(templates.commit, {
        commitUrlFormat: expandTemplate(config.commitUrlFormat, {
          host: templates.partials.host,
          owner: templates.partials.owner,
          repository: templates.partials.repository
        }),
        issueUrlFormat: expandTemplate(config.issueUrlFormat, {
          host: templates.partials.host,
          owner: templates.partials.owner,
          repository: templates.partials.repository,
          id: '{{this.issue}}',
          prefix: '{{this.prefix}}'
        })
      });
    }
  };

  config.conventionalChangelog = {
    parserOpts: config.parserOpts,
    writerOpts: config.writerOpts
  };

  config.recommendedBumpOpts = {
    parserOpts: config.parserOpts,
    whatBump: (commits) => {
      const debug1 = debug.extend('writerOpts:whatBump');

      let level = 2; // ? 0 = major, 1 = minor, 2 = patch (default)
      let breakings = 0;
      let features = 0;

      commits.forEach((commit) => {
        addBangNotes(commit);

        if (commit.notes.length > 0) {
          breakings += commit.notes.length;
          level = 0; // ? -> major
        } else if (commit.type == 'feat' || commit.type == 'feature') {
          features += 1;
          level == 2 && (level = 1); // ? patch -> minor
        }
      });

      // ? If release <1.0.0 and we were gonna do a major/minor bump, do a
      // ? minor/patch (respectively) bump instead
      if (config.preMajor && level < 2) {
        debug1('preMajor release detected; restricted to minor and patch bumps');
        level++;
      }

      const recommendation = {
        level,
        reason: `There ${breakings == 1 ? 'is' : 'are'} ${breakings} breaking change${
          breakings == 1 ? '' : 's'
        } and ${features} feature${features == 1 ? '' : 's'}`
      };

      debug1('recommendation: %O');
      return recommendation;
    }
  };

  debug('types: %O', config.types);
  return { config, finish };
};

debug.extend('exports')('exports: %O', module.exports);
