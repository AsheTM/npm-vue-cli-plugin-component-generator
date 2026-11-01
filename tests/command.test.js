const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
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

  for (const script of ['js', 'ts']) {
    it(`generates ${script} components with LF line endings only`, async (t) => {
      const dir = createProject(t)
      await runCommand(t, dir, { ...options, script, _: ['user-card'] })

      for (const [file, content] of Object.entries(readTree(dir))) {
        assert.ok(!content.includes('\r'), `${file} has CRLF line endings`)
      }
    })
  }

  it('generates TypeScript components without // @ts-ignore', async (t) => {
    const dir = createProject(t)
    await runCommand(t, dir, { ...options, script: 'ts', _: ['user-card'] })

    assert.doesNotMatch(readTree(dir)['src/components/user-card/user-card.ts'], /@ts-ignore/)
  })

  it('uses the script and style languages of the options', async (t) => {
    const dir = createProject(t)
    await runCommand(t, dir, { ...options, script: 'ts', style: 'scss' }, ['user-card'])

    const files = readTree(dir)
    assert.match(files['src/components/user-card/user-card.ts'], /export default defineComponent\(/)
    assert.match(files['src/components/user-card/user-card.scss'], /\.UserCard\{\}/)
  })

  const vue3 = "import { defineComponent } from 'vue'\n\nexport default defineComponent({\n  name: 'UserCardComponent'\n})\n"
  const scripts = [
    { project: 'Vue 3', dependencies: { vue: '^3.2.13' }, script: 'js', expected: vue3 },
    { project: 'Vue 3', dependencies: { vue: '^3.2.13' }, script: 'ts', expected: vue3 },
    { project: 'no Vue dependency (Vue 3)', dependencies: {}, script: 'ts', expected: vue3 },
    { project: 'Vue 2', dependencies: { vue: '^2.6.14' }, script: 'js', expected: "export default {\n  name: 'UserCardComponent'\n}\n" },
    { project: 'Vue 2', dependencies: { vue: '~2.7.16' }, script: 'ts', expected: "import Vue from 'vue'\n\nexport default Vue.extend({\n  name: 'UserCardComponent'\n})\n" },
    {
      project: 'Vue 2 with vue-property-decorator',
      dependencies: { vue: '^2.6.14', 'vue-property-decorator': '^9.1.2' },
      script: 'ts',
      expected: "import { Component, Vue } from 'vue-property-decorator'\n\n@Component\nexport default class UserCardComponent extends Vue {}\n"
    },
    {
      project: 'Vue 2 with vue-property-decorator',
      dependencies: { vue: '^2.6.14', 'vue-property-decorator': '^9.1.2' },
      script: 'js',
      expected: "export default {\n  name: 'UserCardComponent'\n}\n"
    }
  ]

  for (const { project, dependencies, script, expected } of scripts) {
    it(`generates the ${script} script of a ${project} project`, async (t) => {
      const dir = createProject(t, { dependencies })
      await runCommand(t, dir, { ...options, script, _: ['user-card'] })

      assert.equal(readTree(dir)[`src/components/user-card/user-card.${script}`], expected)
    })
  }

  describe('existing component', () => {
    // A generated user-card, with an edited script and a file added by the user
    async function existingComponent(t) {
      const dir = createProject(t)
      await runCommand(t, dir, { ...options, _: ['user-card'] })
      const folder = path.join(dir, 'src', 'components', 'user-card')
      fs.writeFileSync(path.join(folder, 'user-card.js'), 'edited')
      fs.writeFileSync(path.join(folder, 'user-card.spec.js'), 'test')
      t.mock.method(console, 'warn', () => {})
      return { dir, folder }
    }

    it('overwrites only the generated files when confirmed', async (t) => {
      const { dir, folder } = await existingComponent(t)
      await runCommand(t, dir, { ...options, _: ['user-card'] }, [true])

      assert.match(fs.readFileSync(path.join(folder, 'user-card.js'), 'utf8'), /name: 'UserCardComponent'/)
      assert.equal(fs.readFileSync(path.join(folder, 'user-card.spec.js'), 'utf8'), 'test')
      assert.equal(console.warn.mock.callCount(), 1)
    })

    it('changes nothing when not confirmed', async (t) => {
      const { dir, folder } = await existingComponent(t)
      await runCommand(t, dir, { ...options, _: ['user-card'] }, [false])

      assert.equal(fs.readFileSync(path.join(folder, 'user-card.js'), 'utf8'), 'edited')
      assert.equal(fs.readFileSync(path.join(folder, 'user-card.spec.js'), 'utf8'), 'test')
    })
  })

  describe('component name', () => {
    const generated = (dir) => Object.keys(readTree(dir)).filter((file) => file !== 'package.json')

    it('stops quietly when the name prompt is cancelled', async (t) => {
      const dir = createProject(t)
      t.mock.method(console, 'log', () => {})
      await runCommand(t, dir, options, [new Error('cancelled')])

      assert.deepEqual(generated(dir), [])
      assert.deepEqual(console.log.mock.calls[0].arguments, ['Cancelled: no component generated'])
    })

    const invalid = [
      { name: '', error: /A component name is required/ },
      { name: '   ', error: /A component name is required/ },
      { name: '/', error: /A component name is required/ },
      { name: '1card', error: /Invalid component name "1card"/ },
      { name: 'user card', error: /Invalid component name "user card"/ },
      { name: 'user.card', error: /Invalid component name "user.card"/ },
      { name: '../user-card', error: /Invalid component path "..\/user-card"/ },
      { name: 404, error: /Invalid component name "404"/ }
    ]

    for (const { name, error } of invalid) {
      it(`refuses ${JSON.stringify(name)} without generating anything`, async (t) => {
        const dir = createProject(t)

        await assert.rejects(runCommand(t, dir, options, [name]), error)
        await assert.rejects(runCommand(t, dir, { ...options, _: [name] }), error)
        assert.deepEqual(generated(dir), [])
      })
    }
  })

  it('reads Vue from devDependencies too', async (t) => {
    const dir = createProject(t, { devDependencies: { vue: '2.6.14' } })
    await runCommand(t, dir, { ...options, _: ['user-card'] })

    assert.doesNotMatch(readTree(dir)['src/components/user-card/user-card.js'], /defineComponent/)
  })
})
