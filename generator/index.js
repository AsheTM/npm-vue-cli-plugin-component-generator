
module.exports = (api, options) => {
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

  // Quoted when it has spaces, to stay one argument of the script (sh and cmd.exe)
  const rootDirArgument = /\s/.test(rootDir) ? `"${rootDir}"` : rootDir

  const cmd = 'generate:component'
  const cmdShortcut = 'g:c'

  // Extending package
  api.extendPackage({
    scripts: {
      [cmd]: `vue-cli-service ${cmd} --style ${styleExtension} --script ${scriptExtension} --view ${viewExtension} --root-dir ${rootDirArgument}`,
      [cmdShortcut]: `npm run ${cmd}`
    }
  })
}
