const { expect } = require('chai')
const { installQuestions } = require('./support/vue-cli')

const names = (questions) => questions.map((question) => question.name)

describe('vue add questions', () => {
  it('asks only for the root directory in a plain project', () => {
    const questions = installQuestions({})

    expect(names(questions)).to.deep.equal(['rootDir'])
    expect(questions[0].default).to.equal('./src/components')
  })

  it('asks for the script language when TypeScript is installed', () => {
    const questions = installQuestions({ devDependencies: { typescript: '^4.5.0' } })

    expect(names(questions)).to.deep.equal(['rootDir', 'script'])
    expect(questions[1].choices).to.deep.equal(['javascript', 'typescript'])
  })

  it('asks for the style language when sass-loader is installed', () => {
    const questions = installQuestions({ devDependencies: { 'sass-loader': '^12.0.0' } })

    expect(names(questions)).to.deep.equal(['rootDir', 'style'])
    expect(questions[1].choices).to.deep.equal(['css', 'sass', 'scss'])
  })

  for (const sass of ['sass', 'node-sass', 'dart-sass']) {
    it(`asks for the style language when ${sass} is installed`, () => {
      expect(names(installQuestions({ devDependencies: { [sass]: '*' } }))).to.deep.equal(['rootDir', 'style'])
    })
  }

  it('finds TypeScript and Sass in dependencies too', () => {
    const questions = installQuestions({ dependencies: { typescript: '~4.5.5', sass: '^1.32.7' } })

    expect(names(questions)).to.deep.equal(['rootDir', 'script', 'style'])
  })
})
