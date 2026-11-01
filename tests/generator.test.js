const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { runGenerator } = require('./support/vue-cli')

describe('vue add generator', () => {
  it('adds the generate:component script and its g:c shortcut', () => {
    const [{ scripts }] = runGenerator({ rootDir: './src/components', script: 'typescript', style: 'scss' })

    assert.deepEqual(scripts, {
      'generate:component': 'vue-cli-service generate:component --style scss --script ts --view html --root-dir ./src/components',
      'g:c': 'npm run generate:component'
    })
  })

  it('changes nothing else in the project package.json', () => {
    const extended = runGenerator({ rootDir: './src/components' })

    assert.equal(extended.length, 1)
    assert.deepEqual(Object.keys(extended[0]), ['scripts'])
  })

  it('uses JavaScript and CSS in a project without TypeScript or Sass (no script or style answer)', () => {
    const [{ scripts }] = runGenerator({ rootDir: './src/components' })

    assert.equal(scripts['generate:component'],
      'vue-cli-service generate:component --style css --script js --view html --root-dir ./src/components')
  })

  it('quotes a root directory with spaces', () => {
    const [{ scripts }] = runGenerator({ rootDir: './src/my components' })

    assert.match(scripts['generate:component'], / --root-dir "\.\/src\/my components"$/)
  })

  it('passes a quoted root directory to the command as one argument', () => {
    const [{ scripts }] = runGenerator({ rootDir: './src/my components' })
    // The command line after vue-cli-service, run through the shell npm uses
    const args = scripts['generate:component'].replace(/^vue-cli-service /, '')
    const printArgs = `${JSON.stringify(process.execPath)} -e "console.log(JSON.stringify(process.argv.slice(1)))" ${args}`
    const argv = JSON.parse(execFileSync(printArgs, { shell: true, encoding: 'utf8' }))

    assert.deepEqual(argv.slice(-2), ['--root-dir', './src/my components'])
  })

  it('uses JavaScript when it is chosen in a TypeScript project', () => {
    const [{ scripts }] = runGenerator({ rootDir: './src/components', script: 'javascript', style: 'css' })

    assert.match(scripts['generate:component'], / --script js /)
  })
})
