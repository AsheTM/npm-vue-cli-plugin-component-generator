const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { execSync } = require('node:child_process')
const path = require('node:path')

const root = path.join(__dirname, '..')

describe('npm package', () => {
  it('publishes only the plugin, its templates and docs', () => {
    const [{ files }] = JSON.parse(execSync('npm pack --dry-run --json --ignore-scripts', { cwd: root, encoding: 'utf8' }))

    assert.deepEqual(files.map((file) => file.path).sort(), [
      'CHANGELOG.md',
      'LICENSE',
      'README.md',
      'generator/index.js',
      'generator/templates/template.class.ts',
      'generator/templates/template.css',
      'generator/templates/template.html',
      'generator/templates/template.js',
      'generator/templates/template.sass',
      'generator/templates/template.scss',
      'generator/templates/template.ts',
      'generator/templates/template.vue2.js',
      'generator/templates/template.vue2.ts',
      'index.js',
      'package.json',
      'prompts.js'
    ])
  })
})
