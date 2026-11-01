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

## Usage
- Invoke to generate a new components:

```sh
$ vue invoke  @ashetm/vue-cli-plugin-component-generator
```
This will prompt to following questions.

```sh
? Where's your components's root directory?
```

By default this will give ./src/components path. But you can decide and type the path you want to generate the component.

```sh
? What's your component name?
```
Here componet name can be defined.

Now it will generate 4 files in the defined directory inside a folder with file name.

    file-name.html
    file-name.vue
    file-name.scss or file-name.sass or file-name.css
    file-name.js or file-name.ts

## Credits

This README started from the one of [vue-cli-plugin-vue-component-generator](https://www.npmjs.com/package/vue-cli-plugin-vue-component-generator), by Udara bandara (MIT).

## License

[MIT](LICENSE)
