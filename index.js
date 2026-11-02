const fs      = require('fs')
const path    = require('path')
const prompts = require('prompts')

// vueg generates the components: vueg 1 for Vue 2 projects, vueg 2 for Vue 3 projects (npm aliases, see package.json)
const vuegPackages = { 2: 'vueg-vue2', 3: 'vueg-vue3' }

// Options of generate:component, as shown by vue-cli-service help
const componentOptions = {
  '--path': 'folder inside src/ (Default: \'components\')',
  '--style': 'css, scss, sass, less or stylus (Default: \'css\' with Vue 3, \'scss\' with Vue 2)',
  '--scoped': 'scoped attribute on <style>, \'--scoped false\' to remove it (Default: true)',
  '--module': 'CSS modules instead of scoped: <style module>',
  '--props': 'comma-separated prop names, e.g. \'title,items\'',
  '--emits': 'comma-separated event names, e.g. \'close,save\' (Vue 3)',
  '--ts': 'TypeScript <script> (Vue 3)',
  '--options': 'Options API instead of <script setup> (Vue 3)',
  '--template': 'template language, html or pug (Vue 3) (Default: \'html\')',
  '--test': 'also write a Vitest test next to it, Name.spec.js (Vue 3)',
  '--story': 'also write a Storybook story next to it, Name.stories.js (Vue 3)',
  '--blank': 'empty template and style, without the demo content',
  '--no-template': 'leave the <template> section out (also --no-script, --no-style)',
  '--force': 'overwrite the component without asking',
  '--dry-run': 'print the component instead of writing it'
}

// Options of generate:view: the component's, in src/views/, and the route
const { '--path': componentPath, ...sharedOptions } = componentOptions
const viewOptions = {
  '--path': 'sub-folder of src/views/ (Default: src/views/)',
  '--route': 'path of the route, starting with / (Default: /<path>/<name in kebab-case>)',
  '--no-route': 'generate the view only, leave the router as is',
  ...sharedOptions,
  '--force': 'overwrite the view if it exists',
  '--dry-run': 'print the view and its route instead of writing them'
}

// Options of generate:service: a module of API calls, without Vue code, so the same in Vue 2 and Vue 3 projects
const serviceOptions = {
  '--path': 'folder inside src/ (Default: \'services\')',
  '--ts': 'TypeScript: name.service.ts, typed functions',
  '--test': 'also write a Vitest test next to it, name.service.spec.js',
  '--blank': 'an empty module, without the API calls',
  '--force': 'overwrite the service without asking',
  '--dry-run': 'print the service instead of writing it'
}

// What each command generates, with which vueg function, where by default
const commands = {
  'generate:component': { kind: 'component', options: componentOptions, folder: 'components', flags: [] },
  'generate:view': { kind: 'view', options: viewOptions, folder: '', flags: ['route'] },
  'generate:service': { kind: 'service', options: serviceOptions, folder: 'services', only: ['path', 'ts', 'test', 'blank', 'force', 'dry-run'] }
}

// Flags without a value: minimist reads "--blank UserCard" as blank = 'UserCard'
const booleanFlags = ['scoped', 'module', 'ts', 'options', 'blank', 'force', 'dry-run', 'test', 'story']
const vue3Flags    = ['emits', 'ts', 'options', 'test', 'story']
// Options of 0.2, replaced by single-file components in 1.0
const removedFlags = ['script', 'view', 'root-dir']
// vue-cli-service's own options: its boolean flags are in every command's arguments (false when not given)
const serviceFlags = ['modern', 'report', 'report-json', 'inline-vue', 'watch', 'open', 'copy', 'https', 'verbose', 'mode', 'skip-plugins']

// Error message for an invalid name (optional sub-folders, then a name starting with a letter), undefined if valid
function validateName(relativeName, kind = 'component') {
  const parts = String(relativeName).split(/\\|\//).filter(Boolean)
  const name = parts[parts.length - 1]
  // Card.vue, user.service.js: the extension vueg understands
  const pattern = kind === 'service' ? /^[A-Za-z][\w-]*(\.service)?(\.[jt]s)?$/ : /^[A-Za-z][\w-]*(\.vue)?$/

  if(!name || !name.trim()) {
    return `A ${kind} name is required`
  }
  if(!pattern.test(name)) {
    return `Invalid ${kind} name "${name}": letters, digits, - and _ only, starting with a letter`
  }
  if(parts.some((part) => part === '.' || part === '..')) {
    return `Invalid ${kind} path "${relativeName}": . and .. are not allowed`
  }
}

// Convert a component name to PascalCase: user-card, user_card, userCard → UserCard
function pascalCase(name) {
  return name
    .replace(/\.vue$/, '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

// The project's Vue major version: the installed vue, or the one in package.json; Vue 3 by default
function vueVersion(context, pkg) {
  try {
    const vuePackage = require.resolve('vue/package.json', { paths: [context] })
    return Number(JSON.parse(fs.readFileSync(vuePackage, 'utf-8')).version.split('.')[0])
  } catch {
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
    return Number((String(dependencies.vue || '').match(/\d+/) || [3])[0])
  }
}

// Comma-separated names: 'title, items' → ['title', 'items']
function list(flag, value) {
  if(typeof value !== 'string') {
    throw new Error(`--${flag} needs comma-separated names, e.g. --${flag} title,items`)
  }
  return value.split(',').map((name) => name.trim()).filter(Boolean)
}

// vueg's options from the command line arguments (minimist), and the relative name if given
function vuegOptions(cmd, args, vue) {
  const { _: names = [], ...allFlags } = args
  const rest = [...names]
  const flags = {}
  const isName = (value) => typeof value === 'string' && !/^(true|false)$/.test(value)

  for (const [flag, value] of Object.entries(allFlags)) {
    if(serviceFlags.includes(flag)) {
      continue
    }
    // An option given twice is an array: the scripts' options are overridden by the ones after them
    let values = [].concat(value)
    if(booleanFlags.includes(flag)) {
      rest.push(...values.filter(isName))
      values = values.map((value) => isName(value) ? true : value)
    }
    flags[flag] = values[values.length - 1]
  }

  const removed = removedFlags.filter((flag) => typeof flags[flag] === 'string')
  if(removed.length) {
    throw new Error(`${removed.map((flag) => `--${flag}`).join(', ')}: removed in 1.0.0, components are single .vue files. ` +
      'Run "vue invoke @ashetm/component-generator" to update the scripts of package.json')
  }

  // --no-template is template: false, --template pug a language: only the language is Vue 3 only
  const { flags: commandFlags = [], only } = commands[cmd]
  const vue3Only = [...vue3Flags, 'template']
    .filter((flag) => !only && flag in flags && !(flag === 'template' && flags.template === false) && vue !== 3)
  if(vue3Only.length) {
    throw new Error(`${vue3Only.map((flag) => `--${flag}`).join(', ')}: Vue 3 only, this project uses Vue ${vue}`)
  }

  const known = only ?? ['path', 'style', 'props', 'template', 'script', ...booleanFlags, ...vue3Flags, ...commandFlags]
  const unknown = Object.keys(flags).filter((flag) => !known.includes(flag))
  if(unknown.length) {
    throw new Error(`Unknown option ${unknown.map((flag) => `--${flag}`).join(', ')}, see "vue-cli-service help ${cmd}"`)
  }

  const isTrue = (value) => value === true || value === 'true'
  const options = {}

  if('path' in flags) {
    if(typeof flags.path !== 'string') {
      throw new Error(`--path needs a folder inside src/${commands[cmd].kind === 'view' ? 'views/' : ''}, e.g. --path ${commands[cmd].kind === 'service' ? 'api' : 'admin'}`)
    }
    options.path = flags.path
  }
  if(flags.style === false) {
    options.noStyle = true
  } else if('style' in flags) {
    if(typeof flags.style !== 'string') {
      throw new Error('--style needs a value: css, scss, sass, less or stylus')
    }
    options.style = flags.style
  }
  if(flags.route === false) {
    options.route = false
  } else if('route' in flags) {
    if(typeof flags.route !== 'string') {
      throw new Error('--route needs a path starting with "/", e.g. --route /admin/users')
    }
    options.route = flags.route
  }
  if(flags.template === false) {
    options.noTemplate = true
  } else if('template' in flags) {
    if(typeof flags.template !== 'string') {
      throw new Error('--template needs a value: html or pug')
    }
    options.template = flags.template
  }
  if(flags.script === false) options.noScript = true
  if('scoped' in flags) options.scoped = isTrue(flags.scoped)
  if('props' in flags) options.props = list('props', flags.props)
  if('emits' in flags) options.emits = list('emits', flags.emits)
  if(isTrue(flags.module)) options.cssModule = true
  if(isTrue(flags.ts)) options.ts = true
  if(isTrue(flags.options)) options.optionsApi = true
  if(isTrue(flags.blank)) options.blank = true
  if(isTrue(flags.force)) options.force = true
  if(isTrue(flags['dry-run'])) options.dryRun = true
  if(isTrue(flags.test)) options.test = true
  if(isTrue(flags.story)) options.story = true

  return { options, relativeName: rest[0] }
}

// Generate a component, a view or a service with vueg; errors are printed, with exit code 1
async function generate(api, cmd, args) {
  const { kind, folder } = commands[cmd]
  const pkg = api.service.pkg || {}
  const context = api.service.context
  let vueg

  try {
    // A service has no Vue code: vueg 2 generates it in Vue 2 projects too
    const vue = kind === 'service' ? 3 : vueVersion(context, pkg)
    if(!vuegPackages[vue]) {
      throw new Error(`Vue ${vue} is not supported: Vue 2 and Vue 3 only`)
    }
    vueg = require(vuegPackages[vue])

    let { options, relativeName } = vuegOptions(cmd, args, vue)

    // The name comes from the command line or the prompt, with optional sub-folders: admin/UserCard
    if(relativeName === undefined) {
      ({ relativeName } = await prompts([{
        type: 'text',
        name: 'relativeName',
        message: `What's your ${kind} name?`,
        validate: (name) => validateName(name, kind) || true
      }]))

      // Cancelled (Ctrl+C, Escape): no answer
      if(relativeName === undefined) {
        console.log(`Cancelled: no ${kind} generated`)
        return
      }
    }

    const error = validateName(relativeName, kind)
    if(error) {
      throw new Error(error)
    }

    const parts = String(relativeName).split(/\\|\//).filter(Boolean)
    // vueg names the service's file in kebab-case (user-profile.service.js), the components in PascalCase
    const name = kind === 'service' ? parts.pop() : pascalCase(parts.pop())
    const generated = {
      ...options,
      name,
      path: path.posix.join(options.path ?? folder, ...parts),
      cwd: context
    }

    if(kind === 'view') {
      // An existing view isn't overwritten without --force: its route usually exists too (--no-route)
      vueg.view(generated)
      return
    }

    const write = kind === 'service' ? vueg.service : vueg.component
    try {
      write(generated)
    } catch (err) {
      if(err?.code !== 'EEXIST' || generated.dryRun) {
        throw err
      }

      // Ask before overwriting an existing component or service, or its existing test or story (err.file, vuegc 2.1)
      console.warn(err.file ? `${err.file} exists!` : `Component ${name} exists!`)

      const { override } = await prompts([{
        type: 'confirm',
        name: 'override',
        message: 'Override it?',
        initial: false
      }])

      if(override) {
        write({ ...generated, force: true })
      }
    }
  } catch (err) {
    // vuegc 2 refuses a Vue 2 entry (new Vue): package.json has the wrong Vue version
    const message = err?.errno === 0x000A
      ? `src/main.js is a Vue 2 entry, but package.json has Vue ${vueVersion(context, pkg)}: check the version of vue`
      : vueg ? vueg.errorMessage(err) : err.message
    console.error(message)
    process.exitCode = 1
  }
}

module.exports = api => {
  api.registerCommand(
    'generate:component',
    {
      description: 'Generate a single-file component with vueg',
      usage: 'vue-cli-service generate:component [options] [name]',
      options: componentOptions
    },
    (args) => generate(api, 'generate:component', args))

  api.registerCommand(
    'generate:view',
    {
      description: 'Generate a view in src/views/ and add its route, with vueg',
      usage: 'vue-cli-service generate:view [options] [name]',
      options: viewOptions
    },
    (args) => generate(api, 'generate:view', args))

  api.registerCommand(
    'generate:service',
    {
      description: 'Generate a service, a module of API calls with fetch, in src/services/ with vueg',
      usage: 'vue-cli-service generate:service [options] [name]',
      options: serviceOptions
    },
    (args) => generate(api, 'generate:service', args))
}
