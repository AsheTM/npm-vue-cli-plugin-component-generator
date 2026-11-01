const fs      = require('fs')
const path    = require('path')
const prompts = require('prompts')

// Convert a component name to kebab-case for its files: UserCard, userCard, user_card → user-card
function kebabCase(str) {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

// Error message for an invalid name (optional sub-folders, then a name starting with a letter), undefined if valid
function validateName(relativeName) {
  const parts = String(relativeName).split(/\\|\//).filter(Boolean)
  const name = parts[parts.length - 1]

  if(!name || !name.trim()) {
    return 'A component name is required'
  }
  if(!/^[A-Za-z][\w-]*$/.test(name)) {
    return `Invalid component name "${name}": letters, digits, - and _ only, starting with a letter`
  }
  if(parts.some((part) => part === '.' || part === '..')) {
    return `Invalid component path "${relativeName}": . and .. are not allowed`
  }
}

// Script template for the project: Vue 3 (default), Vue 2, or a Vue 2 class component with vue-property-decorator
function scriptTemplate(pkg, scriptExtension) {
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
  const vueMajor = Number((String(dependencies.vue || '').match(/\d+/) || [3])[0])

  if(vueMajor !== 2) {
    return `template.${scriptExtension}`
  }
  if(scriptExtension === 'ts' && 'vue-property-decorator' in dependencies) {
    return 'template.class.ts'
  }
  return `template.vue2.${scriptExtension}`
}

module.exports = api => {
  const cmd = 'generate:component'

  const description = 'Generate component'
  const usage = `vue-cli-service ${cmd} [options] [name]`
  const options = {
    '--script': 'language for script (Default: \'js\')',
    '--style': 'language for style (Default: \'css\')',
    '--view': 'language for view (Default: \'html\')',
    '--root-dir': 'root directory (Default: \'./src/components\')'
  }

  api.registerCommand(
    cmd,
    { description, usage, options },
    async ({ _, script = 'js', style = 'css', view = 'html', 'root-dir': rootDir = './src/components' }) => {
      // The name comes from the command line or the prompt, with optional sub-folders: admin/user-card
      let [relativeComponentName] = _

      const vueExtension    = 'vue'
      const viewExtension   = view
      const scriptExtension = script
      const styleExtension  = style

      if(relativeComponentName === undefined) {
        ({ relativeComponentName } = await prompts([{
          type: 'text',
          name: 'relativeComponentName',
          message: 'What\'s your component name?',
          validate: (name) => validateName(name) || true
        }]))

        // Cancelled (Ctrl+C, Escape): no answer
        if(relativeComponentName === undefined) {
          console.log('Cancelled: no component generated')
          return
        }
      }

      const error = validateName(relativeComponentName)
      if(error) {
        throw new Error(error)
      }

      const pathFile = String(relativeComponentName).split(/\\|\//).filter(Boolean)

      let componentName = pathFile[pathFile.length - 1]
      const foldersPath = api.resolve(path.join(rootDir, ...pathFile.slice(0, pathFile.length - 1)))

      fs.mkdirSync(foldersPath, { recursive: true })

      componentName = kebabCase(componentName)

      const templatesPath     = path.join(__dirname, 'generator', 'templates')
      const componentDirPath  = path.join(foldersPath, componentName)
      const vueFilePath       = path.join(componentDirPath, `${componentName}.${vueExtension}`)

      // Ask before overwriting an existing component: only its generated files are replaced
      if (fs.existsSync(vueFilePath)) {
        console.warn(`Component ${componentName} exists!`)

        const { override } = await prompts([{
          type: 'confirm',
          name: 'override',
          message: 'Override its files?',
          initial: false
        }])

        if(!override) {
          return
        }
      }

      const optionsFsRead = { encoding: 'utf-8' }

      const placeholder = 'PLACEHOLDER'

      const templatePathVue     = path.join(templatesPath, `template.${vueExtension}`)
      const templatePathView    = path.join(templatesPath, `template.${viewExtension}`)
      const templatePathScript  = path.join(templatesPath, scriptTemplate(api.service.pkg || {}, scriptExtension))
      const templatePathStyle   = path.join(templatesPath, `template.${styleExtension}`)

      // Templates with LF line endings, even from a Windows checkout
      const readTemplate = (templatePath) => fs.readFileSync(templatePath, optionsFsRead).replace(/\r\n/g, '\n')

      const templateContentVue    = readTemplate(templatePathVue)
      const templateContentView   = readTemplate(templatePathView)
      const templateContentScript = readTemplate(templatePathScript)
      const templateContentStyle  = readTemplate(templatePathStyle)

      const importLineView    = `<template src="./${componentName}.${viewExtension}"></template>`
      const importLineScript  = `<script src="./${componentName}.${scriptExtension}"></script>`
      const importLineStyle   = `<style src="./${componentName}.${styleExtension}"></style>`
      const importLines       = `\n${importLineView}\n\n${importLineScript}\n\n${importLineStyle}\n`

      const contentVue    = importLines
      const contentView   = templateContentView.replace(placeholder, `${prettify(componentName)}`)
      const contentScript = templateContentScript.replace(placeholder, `${prettify(componentName)}Component`)
      const contentStyle  = templateContentStyle.replace(placeholder, `${prettify(componentName)}`)

      // Convert component name to CamelCase
      function prettify(str) {
        return str.split('-').map(function capitalize(part) {
            return part.charAt(0).toUpperCase() + part.slice(1)
        }).join('')
      }

      fs.mkdirSync(componentDirPath, { recursive: true })

      const newFilePathVue    = path.join(componentDirPath, `${componentName}.${vueExtension}`)
      const newFilePathView   = path.join(componentDirPath, `${componentName}.${viewExtension}`)
      const newFilePathScript = path.join(componentDirPath, `${componentName}.${scriptExtension}`)
      const newFilePathStyle  = path.join(componentDirPath, `${componentName}.${styleExtension}`)

      // Write files
      fs.writeFileSync(newFilePathVue,    contentVue,     optionsFsRead)
      fs.writeFileSync(newFilePathView,   contentView,    optionsFsRead)
      fs.writeFileSync(newFilePathScript, contentScript,  optionsFsRead)
      fs.writeFileSync(newFilePathStyle,  contentStyle,   optionsFsRead)
    })
}
