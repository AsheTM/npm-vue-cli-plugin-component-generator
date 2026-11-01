
module.exports = packageJson => {
  // Installed packages, wherever they are listed
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

  let prompts = [
    {
      type: 'input',
      name: 'rootDir',
      message: 'Where\'s your components\'s root directory?',
      default: './src/components'
    }
  ]

  if('typescript' in dependencies) {
    prompts = [
      ...prompts, {
        type: 'list',
        name: 'script',
        message: 'What language do you want to work with?',
        choices: ['javascript', 'typescript']
      }
    ]
  }

  if(['sass', 'node-sass', 'dart-sass', 'sass-loader'].some((name) => name in dependencies)) {
    prompts = [
      ...prompts, {
        type: 'list',
        name: 'style',
        message: 'What style do you want to work with?',
        choices: ['css', 'sass', 'scss']
      }
    ]
  }

  return prompts
}
