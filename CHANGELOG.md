# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- CHANGELOG in Keep a Changelog format ([#19](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/issues/19)).

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
