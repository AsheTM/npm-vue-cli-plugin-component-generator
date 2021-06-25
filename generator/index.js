
module.exports = (api, options, rootOptions) => {
  const {
    rootDir,
    script,
    style
  } = options

  const viewExtension   = 'html'
  const scriptExtension = script[0] + 's'
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
