'use strict';

const { readFileSync } = require('fs');
const { toss } = require('toss-expression');
const debug = require('debug')(`${require('./package.json').name}:defaults`);

// ? The preamble prefixed to any generated changelog
const CHANGELOG_TITLE =
  `# Changelog\n\n` +
  `All notable changes to this project will be documented in this file.\n\n` +
  `The format is based on [Conventional Commits](https://conventionalcommits.org),\n` +
  `and this project adheres to [Semantic Versioning](https://semver.org).`;

// ? Strings in commit messages that, when found, are skipped
const SKIP_COMMANDS = ['[skip ci]', '[ci skip]', '[skip cd]', '[cd skip]'];

// ? Commits, having been grouped by type, will appear in the CHANGELOG in the
// ? order they appear in COMMIT_TYPE_CHANGELOG_ORDER. Types that are not listed
// ? in COMMIT_TYPE_CHANGELOG_ORDER will appear in unicode order _after_ listed
// ? types.
const COMMIT_TYPE_CHANGELOG_ORDER = ['feat', 'fix', 'perf', 'revert'];

// ? Matches the release-as footer (conventional-changelog-conventionalcommits)
const RELEASEAS_REGEX =
  /release-as:\s*\w*@?([0-9]+\.[0-9]+\.[0-9a-z]+(-[0-9a-z.]+)?)\s*/i;

// ? Handlebars template data
const templates = {
  commit: readFileSync('./templates/commit.hbs', 'utf-8'),
  footer: readFileSync('./templates/footer.hbs', 'utf-8'),
  header: readFileSync('./templates/header.hbs', 'utf-8'),
  template: readFileSync('./templates/template.hbs', 'utf-8'),
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
 * Adds additional breaking change notes for the special case
 * `test(system)!: hello world` but with no `BREAKING CHANGE` in body.
 *
 * @param {Record<string, unknown>} commit
 */
const addBangNotes = ({ header, notes }) => {
  const match = header.match(module.exports.breakingHeaderPattern);
  if (match && notes.length == 0) {
    const noteText = match[3]; // ? Grab description of this commit
    notes.push({
      text: noteText
    });
  }
};

module.exports = {
  changelogTitle: CHANGELOG_TITLE,
  skipCommands: SKIP_COMMANDS,
  gitRawCommitsOpts: { noMerges: null },
  parserOpts: {
    headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/,
    breakingHeaderPattern: /^(\w*)(?:\((.*)\))?!: (.*)$/,
    headerCorrespondence: ['type', 'scope', 'subject'],
    mergePattern: /^Merge pull request #(\d+) from (.*)$/,
    mergeCorrespondence: ['id', 'source'],
    revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w*)\./i,
    revertCorrespondence: ['header', 'hash'],
    issuePrefixes: ['#'],
    noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
  },
  writerOpts: {
    generateOn: ({ version }) => {
      const debug1 = debug.extend('writerOpts:generateOn');
      const decision = !!semver.valid(version) && !semver.prerelease(version);
      debug1(`decision: ${decision}`);
      return decision;
    },
    types: [
      { type: 'feat', section: 'Features' },
      { type: 'fix', section: 'Bug Fixes' },
      { type: 'perf', section: 'Performance Improvements' },
      { type: 'revert', section: 'Reverts' },
      { type: 'build', section: 'Build System' },
      { type: 'docs', section: 'Documentation', hidden: true },
      { type: 'style', section: 'Styles', hidden: true },
      { type: 'refactor', section: 'Refactoring', hidden: true },
      { type: 'test', section: 'Tests', hidden: true },
      { type: 'ci', section: 'Continuous Integration', hidden: true },
      { type: 'chore', section: 'Miscellaneous', hidden: true }
    ],
    issueUrlFormat: '{{host}}/{{owner}}/{{repository}}/issues/{{id}}',
    commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
    compareUrlFormat:
      '{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}',
    userUrlFormat: '{{host}}/{{user}}',
    issuePrefixes: ['#'],
    mainTemplate: templates.template,
    footerPartial: templates.footer,
    groupBy: 'type',
    // ? Commit message groupings (e.g. Features) are sorted by their importance
    commitGroupsSort: (a, b) => {
      a = commitGroupOrder.indexOf(a.title);
      b = commitGroupOrder.indexOf(b.title);
      return a == -1 || b == -1 ? b - a : a - b;
    },
    commitsSort: ['scope', 'subject'],
    noteGroupsSort: 'title'
  }
};

const commitGroupOrder = COMMIT_TYPE_CHANGELOG_ORDER.map(
  (type) =>
    module.exports.writerOpts.types.find((obj) => obj.type == type).section ||
    toss(new Error(`unmatched commit type "${type}" in COMMIT_TYPE_CHANGELOG_ORDER`))
);

module.exports.writerOpts.transform = (commit, context) => {
  const debug1 = debug.extend('writerOpts:transform');

  let discard = true;
  const issues = [];
  const entry = findTypeEntry(module.exports.writerOpts.types, commit);

  addBangNotes(commit);

  if (commit.revert) {
    debug1('coercing to type "revert"');
    commit.type = 'revert';
  } else if (commit.type == 'revert') {
    debug1('saw potentially malformed revert commit; discarding...');
    discard = true;
  }

  // ? Add an entry in the CHANGELOG if special Release-As footer is used
  if (
    (commit.footer && RELEASEAS_REGEX.test(commit.footer)) ||
    (commit.body && RELEASEAS_REGEX.test(commit.body))
  ) {
    debug1('saw release-as in body/footer; NOT discarding...');
    discard = false;
  }

  // ? However, ignore any commits with skip commands in them
  if (SKIP_COMMANDS.some((cmd) => commit.subject?.includes(cmd))) {
    debug1('saw skip command in commit message; discarding...');
    discard = true;
  }

  // ? Still, never ignore breaking changes. Additionally, make all scopes
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
  if (discard && (entry === undefined || entry.hidden)) {
    debug1('decision: commit discarded');
    return;
  } else debug1('decision: commit NOT discarded');

  commit.originalType = commit.type;
  if (entry) commit.type = entry.section;
  if (commit.scope == '*') commit.scope = '';
  if (typeof commit.hash == 'string') commit.shortHash = commit.hash.substring(0, 7);

  if (typeof commit.subject == 'string') {
    const issueRegex = new RegExp(
      `(${module.exports.writerOpts.issuePrefixes.join('|')})([0-9]+)`,
      'g'
    );

    // ? Replace issue refs with URIs
    commit.subject = commit.subject.replace(issueRegex, (_, prefix, issue) => {
      const issueStr = `${prefix}${issue}`;
      const url = expandTemplate(module.exports.writerOpts.issueUrlFormat, {
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
      /\B@([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})/gi,
      (_, user) => {
        const usernameUrl = expandTemplate(module.exports.writerOpts.userUrlFormat, {
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
    if (commit.originalType == 'revert') commit.subject = `*${commit.subject}*`;
  }

  // ? Remove references that already appear in the subject
  commit.references = commit.references.filter(
    ({ prefix, issue }) => !issues.includes(`${prefix}${issue}`)
  );

  debug1('transformed commit: %O', commit);
  return commit;
};

module.exports.writerOpts.headerPartial = expandTemplate(templates.header, {
  compareUrlFormat: expandTemplate(module.exports.writerOpts.compareUrlFormat, {
    host: templates.partials.host,
    owner: templates.partials.owner,
    repository: templates.partials.repository
  })
});

module.exports.writerOpts.commitPartial = expandTemplate(templates.commit, {
  commitUrlFormat: expandTemplate(module.exports.writerOpts.commitUrlFormat, {
    host: templates.partials.host,
    owner: templates.partials.owner,
    repository: templates.partials.repository
  }),
  issueUrlFormat: expandTemplate(module.exports.writerOpts.issueUrlFormat, {
    host: templates.partials.host,
    owner: templates.partials.owner,
    repository: templates.partials.repository,
    id: '{{this.issue}}',
    prefix: '{{this.prefix}}'
  })
});

module.exports.conventionalChangelog = {
  parserOpts: module.exports.parserOpts,
  writerOpts: module.exports.writerOpts
};

module.exports.recommendedBumpOpts = {
  parserOpts: module.exports.parserOpts,
  whatBump: (commits) => {
    const debug1 = debug.extend('writerOpts:transform');

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
    if (module.exports.writerOpts.preMajor && level < 2) {
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

debug.extend('exports')('exports: %O', module.exports);
debug('types: %O', module.exports.writerOpts.types);
