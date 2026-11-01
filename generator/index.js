
module.exports = (api, options, rootOptions) => {
  const {
    rootDir,
    script,
    style
  } = options

  // The script language is only asked when TypeScript is installed: JavaScript otherwise
  const scriptExtensions = { javascript: 'js', typescript: 'ts' }

  const viewExtension   = 'html'
  const scriptExtension = scriptExtensions[script] || 'js'
  const styleExtension  = style || 'css'

  const cmd = 'generate:component'
  const cmdShortcut = 'g:c'

  // Extending package
  api.extendPackage({
    scripts: {
      [cmd]: `vue-cli-service ${cmd} --style ${styleExtension} --script ${scriptExtension} --view ${viewExtension} --root-dir ${rootDir}`,
      [cmdShortcut]: `npm run ${cmd}`
    },
    devDependencies: {}
  })
}
