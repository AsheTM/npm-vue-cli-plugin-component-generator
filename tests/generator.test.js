const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { runGenerator } = require('./support/vue-cli')

describe('vue add generator', () => {
  it('adds the generate:component script and its g:c shortcut', () => {
    const [{ scripts }] = runGenerator({ rootDir: './src/components', script: 'typescript', style: 'scss' })

    assert.deepEqual(scripts, {
      'generate:component': 'vue-cli-service generate:component --style scss --script ts --view html --root-dir ./src/components',
      'g:c': 'npm run generate:component'
    })
  })

  it('uses JavaScript and CSS in a project without TypeScript or Sass (no script or style answer)', () => {
    const [{ scripts }] = runGenerator({ rootDir: './src/components' })

    assert.equal(scripts['generate:component'],
      'vue-cli-service generate:component --style css --script js --view html --root-dir ./src/components')
  })

  it('uses JavaScript when it is chosen in a TypeScript project', () => {
    const [{ scripts }] = runGenerator({ rootDir: './src/components', script: 'javascript', style: 'css' })

    assert.match(scripts['generate:component'], / --script js /)
  })
})
