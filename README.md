# Vue CLI component generator

[![npm version](https://img.shields.io/npm/v/@ashetm/vue-cli-plugin-component-generator?style=flat-square)](https://www.npmjs.com/package/@ashetm/vue-cli-plugin-component-generator)
[![npm downloads](https://img.shields.io/npm/dm/@ashetm/vue-cli-plugin-component-generator?style=flat-square)](https://www.npmjs.com/package/@ashetm/vue-cli-plugin-component-generator)
[![CI](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@ashetm/vue-cli-plugin-component-generator?style=flat-square)](LICENSE)

[Vue CLI](https://cli.vuejs.org) plugin generating Vue components, in JavaScript or TypeScript, with their template, script and style in separate files.

## Installation

In a Vue CLI project:

```sh
vue add @ashetm/vue-cli-plugin-component-generator
```

or with npm, then `vue invoke` to answer the installation questions:

```sh
npm install --save-dev @ashetm/vue-cli-plugin-component-generator
vue invoke @ashetm/vue-cli-plugin-component-generator
```

The installation asks:

- the components root directory (`./src/components` by default);
- the script language, `javascript` or `typescript`, when TypeScript is installed (JavaScript otherwise);
- the style language, `css`, `sass` or `scss`, when Sass is installed (`sass`, `sass-loader`, `node-sass`…; CSS otherwise).

and adds 2 scripts to the project's `package.json` with your answers, for example:

```json
"generate:component": "vue-cli-service generate:component --style scss --script ts --view html --root-dir ./src/components",
"g:c": "npm run generate:component"
```

To change the answers later, run `vue invoke @ashetm/vue-cli-plugin-component-generator` again.

## Usage

```sh
npm run generate:component                  # asks for the component name
npm run generate:component UserCard         # in the root directory
npm run generate:component admin/UserCard   # in a sub-folder of the root directory
npm run g:c UserCard                        # shortcut
```

The name can be written `UserCard`, `userCard`, `user-card` or `user_card`: it must start with a letter, then letters, digits, `-` and `_`. Sub-folders are created when needed.

The command generates 4 files in a folder named after the component (in kebab-case). For `admin/UserCard` with TypeScript and SCSS, in a Vue 3 project:

```text
src/components/admin/user-card/
├── user-card.vue
├── user-card.html
├── user-card.ts
└── user-card.scss
```

`user-card.vue` links the 3 others:

```html
<template src="./user-card.html"></template>

<script src="./user-card.ts"></script>

<style src="./user-card.scss"></style>
```

`user-card.html`:

```html
<div class="UserCard">
  <h1>Component Works</h1>
</div>
```

`user-card.ts`:

```ts
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'UserCardComponent'
})
```

`user-card.scss`:

```scss
.UserCard{}
```

If the component already exists, the command asks before overwriting its 4 files (other files of its folder are kept).

### Vue 2 and Vue 3

The script follows the project's Vue version, read from its `package.json`:

| Project | JavaScript | TypeScript |
|---|---|---|
| Vue 3 (or `vue` not listed) | `defineComponent({ name })` | `defineComponent({ name })` |
| Vue 2 | `export default { name }` | `Vue.extend({ name })` |
| Vue 2 with `vue-property-decorator` | `export default { name }` | `@Component` class |

### Options

The scripts added at installation pass these options; when running `vue-cli-service generate:component` yourself, each has a default:

| Option | Values | Default |
|---|---|---|
| `--script` | `js`, `ts` | `js` |
| `--style` | `css`, `scss`, `sass` | `css` |
| `--view` | `html` | `html` |
| `--root-dir` | a folder of the project | `./src/components` |

## Development

```sh
npm test                # tests (node:test)
npm run test:coverage   # tests with coverage
```

Tests run the plugin with a fake Vue CLI API in temporary projects. The CI runs them on Node 18, 20, 22 and 24, on Ubuntu and Windows.

## Credits

This README started from the one of [vue-cli-plugin-vue-component-generator](https://www.npmjs.com/package/vue-cli-plugin-vue-component-generator), by Udara bandara (MIT).

## License

[MIT](LICENSE)
