# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Tests with the built-in `node:test` runner and a fake Vue CLI API, run in temporary projects: `npm test`, and `npm run test:coverage` for the coverage ([#1](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/1)).
- CI: GitHub Actions run `npm ci` and `npm test` on every pull request into `develop` or `master` and every push to `develop`, on Node 18, 20, 22 and 24, on Ubuntu and Windows. Dependabot: a weekly pull request into `develop` for npm packages and GitHub Actions ([#2](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/2)).

### Changed
- A project `.npmrc` pins the registry to registry.npmjs.org, also for `@ashetm` packages: installs, the lock file and `npm publish` no longer depend on the developer's own npm config (no token in it; npm never packs it) ([#3](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/3)).
- `vue add` no longer adds an empty `devDependencies` to the project's `package.json`; question typos fixed ("What language do you want to work with?") ([#13](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/13)).
- CHANGELOG in Keep a Changelog format ([#19](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/19)).

### Fixed
- `vue add` no longer crashes in JavaScript projects (`Cannot read properties of undefined (reading '0')`): without TypeScript, the language question isn't asked and the components are in JavaScript ([#4](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/4)).
- `generate:component user-card` (the name on the command line, with optional sub-folders: `admin/user-card`) no longer crashes (`The "path" argument must be of type string`), and the command works without its options, with defaults: `--script js`, `--style css`, `--view html`, `--root-dir ./src/components`. The component is generated in the project, whatever the current directory ([#5](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/5)).
- Component names are no longer lowercased: `UserCard`, `userCard`, `user-card` and `user_card` all give the files `user-card/user-card.*`, the class `.UserCard` and the name `UserCardComponent` (`UserCard` gave `usercard/usercard.*`, `.Usercard` and `UsercardComponent`) ([#6](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/6)).
- The script matches the project's Vue version (from its `package.json`): `defineComponent` for Vue 3 (and when Vue isn't listed); for Vue 2, a plain object in JavaScript, `Vue.extend` in TypeScript, or a class component when the project uses `vue-property-decorator`. The JavaScript template was Vue 3 only and the TypeScript one Vue 2 only ([#7](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/7)).
- Overriding an existing component replaces only its generated files: the other files of its folder (tests, stories…) are kept, instead of deleting the whole folder. The confirmation defaults to *no* ([#9](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/9)).
- Cancelling the name prompt (Ctrl+C, Escape) stops quietly instead of crashing (`Cannot read properties of undefined (reading 'split')`). An empty or invalid name (not starting with a letter, other characters than letters, digits, `-` and `_`, or a `.`/`..` folder) is refused with a clear message, in the prompt and on the command line, instead of creating files named `.vue`, `.html`… ([#10](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/10)).
- A components root directory with spaces (`./src/my components`) is quoted in the `generate:component` script, instead of being split into several arguments ([#11](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/11)).
- `vue add` finds TypeScript and Sass in `dependencies` too (not only `devDependencies`), and recognizes the `sass` package (Dart Sass): those projects get the script and style questions ([#12](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/12)).
- Generated files always have LF line endings, and TypeScript components no longer keep `// @ts-ignore` when the plugin comes from a Windows checkout ([#8](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/8)).

## [0.1.1] - 2021-06-25

Same code as 0.1.0, republished.

## [0.1.0] - 2021-06-25

First release.

### Added
- `vue add @ashetm/vue-cli-plugin-component-generator` asks for the components root directory, the script language (when TypeScript is installed) and the style language (when Sass is installed), and adds the `generate:component` and `g:c` scripts to the project.
- `generate:component` asks for the component name and generates 4 files in its own folder: the `.vue` file and its separate template (`.html`), script (`.js` or `.ts`) and style (`.css`, `.scss` or `.sass`).

[Unreleased]: https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/compare/13fce9b...develop
[0.1.1]: https://www.npmjs.com/package/@ashetm/vue-cli-plugin-component-generator/v/0.1.1
[0.1.0]: https://www.npmjs.com/package/@ashetm/vue-cli-plugin-component-generator/v/0.1.0
