const { expect } = require('chai')
const { execSync } = require('node:child_process')
const path = require('node:path')

const root = path.join(__dirname, '..')

describe('npm package', () => {
  it('publishes only the plugin and its docs', () => {
    const [{ files }] = JSON.parse(execSync('npm pack --dry-run --json --ignore-scripts', { cwd: root, encoding: 'utf8' }))

    expect(files.map((file) => file.path).sort()).to.deep.equal([
      'CHANGELOG.md',
      'LICENSE',
      'README.md',
      'generator/index.js',
      'index.js',
      'package.json',
      'prompts.js'
    ])
  })
})
