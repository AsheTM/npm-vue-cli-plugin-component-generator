const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { createProject, readTree, runCommand } = require('./support/vue-cli')

const options = { script: 'js', style: 'css', view: 'html', 'root-dir': './src/components' }

describe('generate:component', () => {
  it('registers the command with its options', async (t) => {
    const dir = createProject(t)
    const command = await runCommand(t, dir, options, ['user-card'])

    assert.equal(command.name, 'generate:component')
    assert.deepEqual(Object.keys(command.options.options), ['--script', '--style', '--view', '--root-dir'])
  })

  it('generates the 4 files of the prompted component in its own folder', async (t) => {
    const dir = createProject(t)
    await runCommand(t, dir, options, ['user-card'])

    const files = readTree(dir)
    delete files['package.json']
    assert.deepEqual(Object.keys(files).sort(), [
      'src/components/user-card/user-card.css',
      'src/components/user-card/user-card.html',
      'src/components/user-card/user-card.js',
      'src/components/user-card/user-card.vue'
    ])
    assert.equal(files['src/components/user-card/user-card.vue'],
      '\n<template src="./user-card.html"></template>\n\n<script src="./user-card.js"></script>\n\n<style src="./user-card.css"></style>\n')
    assert.match(files['src/components/user-card/user-card.html'], /<div class="UserCard">/)
    assert.match(files['src/components/user-card/user-card.js'], /name: 'UserCardComponent'/)
    assert.match(files['src/components/user-card/user-card.css'], /\.UserCard\{\}/)
  })

  it('generates the component in a sub-folder of the root directory', async (t) => {
    const dir = createProject(t)
    await runCommand(t, dir, options, ['admin/user-card'])

    assert.ok(readTree(dir)['src/components/admin/user-card/user-card.vue'])
  })

  it('generates the component named on the command line, without prompting', async (t) => {
    const dir = createProject(t)
    await runCommand(t, dir, { ...options, _: ['admin/user-card'] })

    assert.deepEqual(Object.keys(readTree(dir)).filter((file) => file.startsWith('src/')).sort(), [
      'src/components/admin/user-card/user-card.css',
      'src/components/admin/user-card/user-card.html',
      'src/components/admin/user-card/user-card.js',
      'src/components/admin/user-card/user-card.vue'
    ])
  })

  it('works without the options added by vue add (defaults: js, css, html, ./src/components)', async (t) => {
    const dir = createProject(t)
    await runCommand(t, dir, { _: ['user-card'] })

    assert.deepEqual(Object.keys(readTree(dir)).filter((file) => file.startsWith('src/')).sort(), [
      'src/components/user-card/user-card.css',
      'src/components/user-card/user-card.html',
      'src/components/user-card/user-card.js',
      'src/components/user-card/user-card.vue'
    ])
  })

  it('generates in the project, whatever the current directory', async (t) => {
    const dir = createProject(t)
    const elsewhere = createProject(t)
    await runCommand(t, dir, { ...options, _: ['user-card'] }, [], elsewhere)

    assert.ok(readTree(dir)['src/components/user-card/user-card.vue'])
    assert.deepEqual(Object.keys(readTree(elsewhere)), ['package.json'])
  })

  for (const name of ['UserCard', 'userCard', 'user-card', 'user_card']) {
    it(`names the files user-card and the component UserCard for ${name}`, async (t) => {
      const dir = createProject(t)
      await runCommand(t, dir, { ...options, _: [`admin/${name}`] })

      const files = readTree(dir)
      assert.match(files['src/components/admin/user-card/user-card.vue'], /<script src="\.\/user-card\.js"><\/script>/)
      assert.match(files['src/components/admin/user-card/user-card.html'], /<div class="UserCard">/)
      assert.match(files['src/components/admin/user-card/user-card.js'], /name: 'UserCardComponent'/)
      assert.match(files['src/components/admin/user-card/user-card.css'], /\.UserCard\{\}/)
    })
  }

  it('keeps acronyms together (HTMLEditor → html-editor, HtmlEditor)', async (t) => {
    const dir = createProject(t)
    await runCommand(t, dir, { ...options, _: ['HTMLEditor'] })

    assert.match(readTree(dir)['src/components/html-editor/html-editor.js'], /name: 'HtmlEditorComponent'/)
  })

  it('uses the script and style languages of the options', async (t) => {
    const dir = createProject(t)
    await runCommand(t, dir, { ...options, script: 'ts', style: 'scss' }, ['user-card'])

    const files = readTree(dir)
    assert.match(files['src/components/user-card/user-card.ts'], /export default class UserCardComponent/)
    assert.match(files['src/components/user-card/user-card.scss'], /\.UserCard\{\}/)
  })
})
