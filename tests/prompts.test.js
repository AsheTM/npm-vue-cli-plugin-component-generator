const { expect } = require('chai')
const { installQuestions } = require('./support/vue-cli')

const names = (questions) => questions.map((question) => question.name)
const question = (questions, name) => questions.find((question) => question.name === name)

describe('vue add questions', () => {
  it('asks only for the components folder in a plain project', () => {
    const questions = installQuestions({ dependencies: { vue: '^3.2.13' } })

    expect(names(questions)).to.deep.equal(['path'])
    expect(questions[0].message).to.equal('Where are your components, inside src/?')
    expect(questions[0].default).to.equal('components')
  })

  const folders = [
    ['components', 'components'],
    ['./src/components', 'components'],
    ['src/components/ui/', 'components/ui'],
    ['.\\src\\components', 'components'],
    ['  ui  ', 'ui'],
    ['./src', ''],
    ['', ''],
    ['source', 'source']
  ]

  for (const [answer, folder] of folders) {
    it(`takes ${JSON.stringify(answer)} as the folder ${JSON.stringify(folder)} inside src/`, () => {
      expect(installQuestions({})[0].filter(answer)).to.equal(folder)
    })
  }

  const styles = [
    { packages: ['sass-loader'], choices: ['css', 'scss', 'sass'] },
    { packages: ['sass'], choices: ['css', 'scss', 'sass'] },
    { packages: ['node-sass'], choices: ['css', 'scss', 'sass'] },
    { packages: ['dart-sass'], choices: ['css', 'scss', 'sass'] },
    { packages: ['less', 'less-loader'], choices: ['css', 'less'] },
    { packages: ['stylus-loader'], choices: ['css', 'stylus'] },
    { packages: ['sass', 'less', 'stylus'], choices: ['css', 'scss', 'sass', 'less', 'stylus'] }
  ]

  for (const { packages, choices } of styles) {
    it(`offers ${choices.join(', ')} with ${packages.join(', ')} installed`, () => {
      const devDependencies = Object.fromEntries(packages.map((name) => [name, '*']))
      const questions = installQuestions({ devDependencies })

      expect(names(questions)).to.deep.equal(['path', 'style'])
      expect(question(questions, 'style').choices).to.deep.equal(choices)
    })
  }

  it('asks for TypeScript in a Vue 3 project with TypeScript', () => {
    const questions = installQuestions({ dependencies: { vue: '^3.2.13' }, devDependencies: { typescript: '~4.5.5' } })

    expect(names(questions)).to.deep.equal(['path', 'ts'])
    expect(question(questions, 'ts')).to.include({ type: 'confirm', default: true })
  })

  it('doesn\'t ask for TypeScript in a Vue 2 project: vueg 1 generates JavaScript', () => {
    const questions = installQuestions({ dependencies: { vue: '^2.6.14' }, devDependencies: { typescript: '~4.5.5' } })

    expect(names(questions)).to.deep.equal(['path'])
  })

  it('finds Vue, TypeScript and Sass in dependencies and devDependencies', () => {
    const questions = installQuestions({ dependencies: { typescript: '~4.5.5', sass: '^1.32.7' }, devDependencies: { vue: '3.4.0' } })

    expect(names(questions)).to.deep.equal(['path', 'style', 'ts'])
  })
})
