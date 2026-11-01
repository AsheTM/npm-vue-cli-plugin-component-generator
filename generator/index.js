const { srcFolder } = require('../prompts')

module.exports = (api, options) => {
  const {
    path = 'components',
    style = 'css',
    ts = false
  } = options

  // Quoted when empty or with spaces, to stay one argument of the script (sh and cmd.exe)
  const quote = (value) => value === '' || /\s/.test(value) ? `"${value}"` : value

  // The answers, as options of the commands: --style always, vueg 1 (Vue 2) defaults to scss
  const folder = srcFolder(path)
  const common = ` --style ${style}${ts ? ' --ts' : ''}`
  const componentPath = folder === 'components' ? '' : ` --path ${quote(folder)}`

  // Extending package
  api.extendPackage({
    scripts: {
      'generate:component': `vue-cli-service generate:component${componentPath}${common}`,
      'g:c': 'npm run generate:component',
      'generate:view': `vue-cli-service generate:view${common}`,
      'g:v': 'npm run generate:view'
    }
  })
}
