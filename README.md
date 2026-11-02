# Vue CLI component generator

[![npm version](https://img.shields.io/npm/v/@ashetm/vue-cli-plugin-component-generator?style=flat-square)](https://www.npmjs.com/package/@ashetm/vue-cli-plugin-component-generator)
[![npm downloads](https://img.shields.io/npm/dm/@ashetm/vue-cli-plugin-component-generator?style=flat-square)](https://www.npmjs.com/package/@ashetm/vue-cli-plugin-component-generator)
[![CI](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/AsheTM/npm-vue-cli-plugin-component-generator/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@ashetm/vue-cli-plugin-component-generator?style=flat-square)](LICENSE)

[Vue CLI](https://cli.vuejs.org) plugin generating **single-file components**, **views with their route** and **services** (API calls), in Vue 2 and Vue 3 projects.

Generation relies on [vueg](https://github.com/AsheTM/npm-vueg) and [vuegc](https://github.com/AsheTM/npm-vuegc): same options, same files. Not a Vue CLI project (Vite, create-vue)? Use the `vueg` command directly.

## Installation

In a Vue CLI project (Node 20.19 or later):

```sh
vue add @ashetm/vue-cli-plugin-component-generator
```

or with npm, then `vue invoke` to answer the installation questions:

```sh
npm install --save-dev @ashetm/vue-cli-plugin-component-generator
vue invoke @ashetm/vue-cli-plugin-component-generator
```

The installation asks:

- where your components are, inside `src/` (`components` by default);
- the style, `css` or one of the installed pre-processors: `scss` and `sass` with Sass, `less` with Less, `stylus` with Stylus. CSS when none is installed;
- in a Vue 3 project with TypeScript, whether components are in TypeScript.

It adds 6 scripts to your `package.json`, for example in a Vue 3 project with Sass and TypeScript:

```json
"generate:component": "vue-cli-service generate:component --ts --style scss",
"g:c": "npm run generate:component --",
"generate:view": "vue-cli-service generate:view --ts --style scss",
"g:v": "npm run generate:view --",
"generate:service": "vue-cli-service generate:service --ts",
"g:s": "npm run generate:service --"
```

To change the answers later, or to add the scripts of a newer version (`generate:service` came in 1.2.0), run `vue invoke @ashetm/vue-cli-plugin-component-generator` again.

## Components

```sh
npm run generate:component                        # asks for the name
npm run generate:component UserCard               # src/components/UserCard.vue
npm run generate:component admin/user-card        # src/components/admin/UserCard.vue
npm run g:c -- Card --props title,items --blank   # shortcut, with options after --
```

- The name can be written `UserCard`, `userCard`, `user-card`, `user_card` or `UserCard.vue`; the component is `UserCard.vue`. It starts with a letter, then letters, digits, `-` and `_`.
- Sub-folders in the name (`admin/user-card`) are created inside the components folder.
- An existing component isn't overwritten without asking first, or `--force`.

`npm run g:c -- admin/user-card --props title,items --blank`, with `--style scss`, generates `src/components/admin/UserCard.vue`.

In a **Vue 3** project:

```vue
<template>
    <div></div>
</template>

<script setup>
const props = defineProps({
    title: null,
    items: null
});
</script>

<style lang="scss" scoped>
</style>
```

In a **Vue 2** project:

```vue
<template>
    <div></div>
</template>

<script>
export default {
    name: "UserCard",
    props: {
        title: null,
        items: null
    },
    data() {
        return { };
    },
    methods: { }
}
</script>

<style lang="scss" scoped>
</style>
```

Without `--blank`, the template and the style have some demo content.

## Views

A view is a page: a component in `src/views/`, shown by the router. `generate:view` generates it and adds its route to `src/router/index.js` (or `index.ts`, `router.js`, `router.ts`).

```sh
npm run generate:view About                       # src/views/About.vue, route /about
npm run generate:view admin/UserProfile           # src/views/admin/UserProfile.vue, route /admin/user-profile
npm run g:v -- Profile --route /users/:id         # choose the route's path
npm run g:v -- Help --no-route                    # leave the router as is
```

`npm run generate:view admin/UserProfile` prints:

```text
> Generating vue component starting
> Generating vue component success
> Route /admin/user-profile added to src/router/index.js
```

and adds the route, **lazy loaded**, in the style of your router file (indentation, quotes, trailing commas):

```js
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/admin/user-profile',
    name: 'userProfile',
    component: () => import('../views/admin/UserProfile.vue')
  }
]
```

**Nothing is written if something is wrong**: no router, a route path or name already used, an invalid `--route`, or a view that already exists without `--force`. The message says what to do. To regenerate an existing view, its route usually exists too: use `--force --no-route`.

## Services

A service keeps the API calls out of the components: a module of functions using `fetch`. `generate:service` generates it in `src/services/`, with [vueg](https://github.com/AsheTM/npm-vueg#vueg-service), in Vue 2 and Vue 3 projects alike (it has no Vue code).

```sh
npm run generate:service User                     # src/services/user.service.js
npm run g:s -- admin/UserProfile                  # src/services/admin/user-profile.service.js
npm run g:s -- User --ts --test                   # user.service.ts and its Vitest test, user.service.spec.ts
```

`src/services/user.service.js` has a `request()` helper (JSON, throws on an HTTP error, `null` for 204 No Content) and `getAll`, `getById`, `create`, `update` and `remove` on `/api/user`. Change `BASE_URL` to your API, then use it in a component: `import { getAll } from '@/services/user.service'`.

| Option | Description | Default |
|---|---|---|
| `--path` | Folder inside `src/` | `services` |
| `--ts` | TypeScript: `user.service.ts`, functions typed with generics (`getAll<User>()`) | |
| `--test` | Also write a [Vitest](https://vitest.dev) test next to it, stubbing `fetch`: `user.service.spec.js` | |
| `--blank` | An empty module, without the API calls | |
| `--force` | Overwrite the service (and its test) without asking | |
| `--dry-run` | Print the service instead of writing it | |

File names are in kebab-case; `User`, `user`, `user.service` and `user.service.js` all give `user.service.js`. An existing service or test is overwritten only after confirming. The component options (`--style`, `--props`…) are refused. `vue-cli-service help generate:service` lists the options.

## Options

`generate:component` and `generate:view` take the same options. The scripts added at installation already pass `--style` (and `--ts`, `--path`); add others after `--` with the shortcuts. Give one of the script's options again to change it for one run: `npm run g:c -- Card --style less`, `--ts false`.

| Option | Description | Default |
|---|---|---|
| `--path` | `generate:component`: folder inside `src/`. `generate:view`: sub-folder of `src/views/` | `components` / `src/views/` |
| `--style` | `css`, `scss`, `sass` (indented syntax), `less` or `stylus` | `css` in Vue 3, `scss` in Vue 2 |
| `--scoped` | `scoped` attribute on `<style>`, `--scoped false` to remove it | `true` |
| `--module` | CSS modules: `<style module>` instead of `scoped` | |
| `--props` | Comma-separated prop names: `--props title,items` | |
| `--blank` | Empty template and style, without the demo content | |
| `--no-template`, `--no-script`, `--no-style` | Leave the section out. In Vue 3, without the template, the script needs something in it: `--props`, `--emits` or `--options` | |
| `--force` | Overwrite the component or view without asking | |
| `--dry-run` | Print the component (and the route) instead of writing it | |
| `--route` | `generate:view` only: path of the route, starting with `/` | `/<path>/<name in kebab-case>` |
| `--no-route` | `generate:view` only: generate the view, leave the router as is | |

**Vue 3 only:**

| Option | Description |
|---|---|
| `--emits` | Comma-separated event names: `--emits close,save` |
| `--ts` | `<script setup lang="ts">` |
| `--options` | Options API (`export default { … }`) instead of `<script setup>` |
| `--template pug` | Template in Pug: `<template lang="pug">` (the project must compile Pug: see [vue-loader's pre-processors](https://vue-loader.vuejs.org/guide/pre-processors.html#pug)) |
| `--test` | Also write a [Vitest](https://vitest.dev) test next to the component or view: `UserCard.spec.js` (`.spec.ts` with `--ts`) |
| `--story` | Also write a [Storybook](https://storybook.js.org) story next to it: `UserCard.stories.js` (`.stories.ts` with `--ts`) |

`npm run g:c -- admin/user-card --props title --test --story` writes `src/components/admin/UserCard.vue`, `UserCard.spec.js` and `UserCard.stories.js`. The test mounts the component with Vue Test Utils; the story has its props as args. See [vuegc](https://github.com/AsheTM/npm-vuegc#test) for their content. When the project lacks Vitest, Vue Test Utils, Storybook or Pug, the command says what to install. An existing test or story is overwritten only after confirming, like the component.

`vue-cli-service help generate:component` and `vue-cli-service help generate:view` list them too.

## Vue 2 and Vue 3

The plugin reads the project's Vue version: the installed `vue` package first, then `vue` in your `package.json` (`dependencies` or `devDependencies`). Without either, Vue 3.

| Project | Generated by | Script |
|---|---|---|
| Vue 2 | vueg 1 (vuegc 1) | Options API, JavaScript |
| Vue 3 | vueg 2 (vuegc 2) | `<script setup>`, or Options API with `--options`; TypeScript with `--ts` |

Both are installed with the plugin.

## Errors

On an invalid name, an unknown option, an unsupported style, a Vue 3 option in a Vue 2 project, or outside a Vue project, the command prints the reason, generates nothing, and exits with code `1`:

```text
$ npm run g:c -- Card --style styl
Style styl not supported, use one of: css, scss, sass, less, stylus
```

## Migrating from 0.2

1.0.0 generates **one `.vue` file** per component, with vueg, instead of 4 files:

| 0.2 | 1.0 |
|---|---|
| `src/components/user-card/user-card.{vue,html,js,css}` | `src/components/UserCard.vue` |
| `--script js\|ts` | `--ts` (Vue 3) |
| `--view html` | removed: the template is in the `.vue` file |
| `--root-dir ./src/components` | `--path components` (inside `src/`) |
| Vue 2 class components (`vue-property-decorator`) | removed: Options API |
| | `generate:view`, and the options above |

After updating, the scripts added by 0.2 still pass `--script`, `--view` and `--root-dir`, and the command says they were removed. Run `vue invoke @ashetm/vue-cli-plugin-component-generator` to replace the scripts with the new ones. Components generated by 0.2 are left as they are.

1.0.0 needs Node 20.19 or later.

## Development

```sh
npm test                # tests (mocha + chai)
npm run test:coverage   # tests with coverage (c8)
```

Tests run the plugin with a fake Vue CLI API in temporary Vue 2 and Vue 3 projects, and compare what it generates with what vueg generates. The scripts added by `vue add` are also run through the shell, minimist and `npm run`, like in a real project. The CI runs them on Node 20, 22 and 24, on Ubuntu and Windows.

## Credits

This README started from the one of [vue-cli-plugin-vue-component-generator](https://www.npmjs.com/package/vue-cli-plugin-vue-component-generator), by Udara bandara (MIT).

## License

[MIT](LICENSE)
