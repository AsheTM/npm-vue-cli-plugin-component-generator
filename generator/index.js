const { srcFolder } = require('../prompts')

module.exports = (api, options) => {
  const {
    path = 'components',
    style = 'css',
    ts = false
  } = options

  // Quoted when empty or with spaces, to stay one argument of the script (sh and cmd.exe)
  const quote = (value) => value === '' || /\s/.test(value) ? `"${value}"` : value

  // The answers, as options of the commands: --style always (vueg 1, for Vue 2, defaults to scss), and last:
  // it takes a value, so the name after the script isn't read as the value of a flag (--ts Card)
  const folder = srcFolder(path)
  const common = `${ts ? ' --ts' : ''} --style ${style}`
  const componentPath = folder === 'components' ? '' : ` --path ${quote(folder)}`

  // Extending package; the shortcuts end with --, so the inner npm run passes the options on (npm run g:c -- Card --blank)
  api.extendPackage({
    scripts: {
      'generate:component': `vue-cli-service generate:component${componentPath}${common}`,
      'g:c': 'npm run generate:component --',
      'generate:view': `vue-cli-service generate:view${common}`,
      'g:v': 'npm run generate:view --'
    }
  })
}
