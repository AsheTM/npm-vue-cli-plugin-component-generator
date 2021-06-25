<a href="https://www.npmjs.com/package/vue-cli-plugin-vue-component-generator">
    <img alt="" src="https://img.shields.io/npm/v/vue-cli-plugin-vue-component-generator/latest.svg?style=flat-square">
</a>
<a href="https://www.npmjs.com/package/vue-cli-plugin-vue-component-generator">
    <img alt="" src="https://img.shields.io/npm/dm/vue-cli-plugin-vue-component-generator.svg?style=flat-square">
</a>

# Vue Component Generator (Javascript & Typescript)

[vue-cli 3](https://github.com/vuejs/vue-cli) plugin to generate vue components

This package will works with typescript and create vue components easily using vue cli.

## Installation

- Install via npm

```sh
$ npm i @ashetm/vue-cli-plugin-component-generator
```

- Install via vue-cli

```sh
$ vue add @ashetm/vue-cli-plugin-component-generator
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
