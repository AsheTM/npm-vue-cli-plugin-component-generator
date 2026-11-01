
module.exports = packageJson => {
  // Installed packages, wherever they are listed
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

  let prompts = [
    {
      type: 'input',
      name: 'rootDir',
      message: 'Where\'s your components\'s root directory?',
      default: './src/components'
    }/*, {
      type: 'input',
      name: 'componentName',
      message: 'What\'s your new component\'s name?',
      validate(input) {
        return String(input).match(/$\w(-?(\w|\d))*^/)
      }
    }*/
  ]

  if('typescript' in dependencies) {
    prompts = [
      ...prompts, {
        type: 'list',
        name: 'script',
        message: 'What langage you want to work with?',
        // validate(input) {
        //   return ['js', 'javascript', 'ts', 'typescript'].includes(input)
        // },
        // default: 'typescript',
        choices: ['javascript', 'typescript']
      }
    ]
  }

  if(['sass', 'node-sass', 'dart-sass', 'sass-loader'].some((name) => name in dependencies)) {
    prompts = [
      ...prompts, {
        type: 'list',
        name: 'style',
        message: 'What style you want to work with?',
        // validate(input) {
        //   return ['css', 'sass', 'scss'].includes(input)
        // },
        // default: 'scss',
        choices: ['css', 'sass', 'scss']
      }
    ]
  }

  return prompts
}
