
// Style pre-processors vueg supports, offered when their package is installed
const preprocessors = [
  { packages: ['sass', 'node-sass', 'dart-sass', 'sass-loader'], styles: ['scss', 'sass'] },
  { packages: ['less', 'less-loader'], styles: ['less'] },
  { packages: ['stylus', 'stylus-loader'], styles: ['stylus'] }
]

// A folder inside src/: './src/components' (0.2's answer) → 'components'
function srcFolder(folder) {
  return String(folder).trim().replace(/\\/g, '/').replace(/^(\.\/)?(src(\/|$))?/, '').replace(/\/+$/, '')
}

module.exports = packageJson => {
  // Installed packages, wherever they are listed
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  const vue = Number((String(dependencies.vue || '').match(/\d+/) || [3])[0])

  let prompts = [
    {
      type: 'input',
      name: 'path',
      message: 'Where are your components, inside src/?',
      default: 'components',
      filter: srcFolder
    }
  ]

  const styles = preprocessors
    .filter(({ packages }) => packages.some((name) => name in dependencies))
    .flatMap(({ styles }) => styles)

  if(styles.length) {
    prompts = [
      ...prompts, {
        type: 'list',
        name: 'style',
        message: 'What style do you want to work with?',
        choices: ['css', ...styles]
      }
    ]
  }

  // vueg generates TypeScript components in Vue 3 projects only
  if(vue === 3 && 'typescript' in dependencies) {
    prompts = [
      ...prompts, {
        type: 'confirm',
        name: 'ts',
        message: 'Generate TypeScript components (<script lang="ts">)?',
        default: true
      }
    ]
  }

  return prompts
}

module.exports.srcFolder = srcFolder
