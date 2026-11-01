const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { installQuestions } = require('./support/vue-cli')

const names = (questions) => questions.map((question) => question.name)

describe('vue add questions', () => {
  it('asks only for the root directory in a plain project', () => {
    const questions = installQuestions({})

    assert.deepEqual(names(questions), ['rootDir'])
    assert.equal(questions[0].default, './src/components')
  })

  it('asks for the script language when TypeScript is installed', () => {
    const questions = installQuestions({ devDependencies: { typescript: '^4.5.0' } })

    assert.deepEqual(names(questions), ['rootDir', 'script'])
    assert.deepEqual(questions[1].choices, ['javascript', 'typescript'])
  })

  it('asks for the style language when sass-loader is installed', () => {
    const questions = installQuestions({ devDependencies: { 'sass-loader': '^12.0.0' } })

    assert.deepEqual(names(questions), ['rootDir', 'style'])
    assert.deepEqual(questions[1].choices, ['css', 'sass', 'scss'])
  })
})
