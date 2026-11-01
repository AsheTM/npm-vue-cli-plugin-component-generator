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
  '--blank': 'empty template and style, without the demo content',
  '--no-template': 'leave the <template> section out (also --no-script, --no-style)',
  '--force': 'overwrite the component without asking',
  '--dry-run': 'print the component instead of writing it'
}

// Flags without a value: minimist reads "--blank UserCard" as blank = 'UserCard'
const booleanFlags = ['scoped', 'module', 'ts', 'options', 'blank', 'force', 'dry-run']
const vue3Flags    = ['emits', 'ts', 'options']
// Options of 0.2, replaced by single-file components in 1.0
const removedFlags = ['script', 'view', 'root-dir']

// Error message for an invalid name (optional sub-folders, then a name starting with a letter), undefined if valid
function validateName(relativeName) {
  const parts = String(relativeName).split(/\\|\//).filter(Boolean)
  const name = parts[parts.length - 1]

  if(!name || !name.trim()) {
    return 'A component name is required'
  }
  if(!/^[A-Za-z][\w-]*(\.vue)?$/.test(name)) {
    return `Invalid component name "${name}": letters, digits, - and _ only, starting with a letter`
  }
  if(parts.some((part) => part === '.' || part === '..')) {
    return `Invalid component path "${relativeName}": . and .. are not allowed`
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

// vueg's options from the command line arguments (minimist), and the component's relative name if given
function vuegOptions(args, vue) {
  const { _: names = [], ...flags } = args
  const rest = [...names]

  for (const flag of booleanFlags) {
    if(typeof flags[flag] === 'string' && !/^(true|false)$/.test(flags[flag])) {
      rest.push(flags[flag])
      flags[flag] = true
    }
  }

  const removed = removedFlags.filter((flag) => typeof flags[flag] === 'string')
  if(removed.length) {
    throw new Error(`${removed.map((flag) => `--${flag}`).join(', ')}: removed in 1.0.0, components are single .vue files. ` +
      'Run "vue invoke @ashetm/component-generator" to update the scripts of package.json')
  }

  const vue3Only = vue3Flags.filter((flag) => flag in flags && vue !== 3)
  if(vue3Only.length) {
    throw new Error(`${vue3Only.map((flag) => `--${flag}`).join(', ')}: Vue 3 only, this project uses Vue ${vue}`)
  }

  const known = ['path', 'style', 'props', 'template', 'script', ...booleanFlags, ...vue3Flags]
  const unknown = Object.keys(flags).filter((flag) => !known.includes(flag))
  if(unknown.length) {
    throw new Error(`Unknown option ${unknown.map((flag) => `--${flag}`).join(', ')}, see "vue-cli-service help generate:component"`)
  }

  const isTrue = (value) => value === true || value === 'true'
  const options = {}

  if('path' in flags) {
    if(typeof flags.path !== 'string') {
      throw new Error('--path needs a folder inside src/, e.g. --path components/ui')
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
  if(flags.template === false) options.noTemplate = true
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

  return { options, relativeName: rest[0] }
}

module.exports = api => {
  const cmd = 'generate:component'

  const description = 'Generate a single-file component with vueg'
  const usage = `vue-cli-service ${cmd} [options] [name]`

  api.registerCommand(
    cmd,
    { description, usage, options: componentOptions },
    async (args) => {
      const pkg = api.service.pkg || {}
      const context = api.service.context
      let vueg

      try {
        const vue = vueVersion(context, pkg)
        if(!vuegPackages[vue]) {
          throw new Error(`Vue ${vue} is not supported: Vue 2 and Vue 3 only`)
        }
        vueg = require(vuegPackages[vue])

        let { options, relativeName } = vuegOptions(args, vue)

        // The name comes from the command line or the prompt, with optional sub-folders: admin/UserCard
        if(relativeName === undefined) {
          ({ relativeName } = await prompts([{
            type: 'text',
            name: 'relativeName',
            message: 'What\'s your component name?',
            validate: (name) => validateName(name) || true
          }]))

          // Cancelled (Ctrl+C, Escape): no answer
          if(relativeName === undefined) {
            console.log('Cancelled: no component generated')
            return
          }
        }

        const error = validateName(relativeName)
        if(error) {
          throw new Error(error)
        }

        const parts = String(relativeName).split(/\\|\//).filter(Boolean)
        const name = pascalCase(parts.pop())
        const component = {
          ...options,
          name,
          path: path.posix.join(options.path ?? 'components', ...parts),
          cwd: context
        }

        try {
          vueg.component(component)
        } catch (err) {
          if(err?.code !== 'EEXIST' || component.dryRun) {
            throw err
          }

          // Ask before overwriting an existing component
          console.warn(`Component ${name} exists!`)

          const { override } = await prompts([{
            type: 'confirm',
            name: 'override',
            message: 'Override it?',
            initial: false
          }])

          if(override) {
            vueg.component({ ...component, force: true })
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
    })
}
