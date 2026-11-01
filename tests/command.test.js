const { expect } = require('chai')
const fs = require('node:fs')
const path = require('node:path')
const { createProject, stub, rejection, readTree, runCommand } = require('./support/vue-cli')

const options = { script: 'js', style: 'css', view: 'html', 'root-dir': './src/components' }

describe('generate:component', () => {
  it('registers the command with its options', async () => {
    const dir = createProject()
    const command = await runCommand(dir, options, ['user-card'])

    expect(command.name).to.equal('generate:component')
    expect(Object.keys(command.options.options)).to.deep.equal(['--script', '--style', '--view', '--root-dir'])
  })

  it('generates the 4 files of the prompted component in its own folder', async () => {
    const dir = createProject()
    await runCommand(dir, options, ['user-card'])

    const files = readTree(dir)
    delete files['package.json']
    expect(Object.keys(files).sort()).to.deep.equal([
      'src/components/user-card/user-card.css',
      'src/components/user-card/user-card.html',
      'src/components/user-card/user-card.js',
      'src/components/user-card/user-card.vue'
    ])
    expect(files['src/components/user-card/user-card.vue']).to.equal(
      '\n<template src="./user-card.html"></template>\n\n<script src="./user-card.js"></script>\n\n<style src="./user-card.css"></style>\n')
    expect(files['src/components/user-card/user-card.html']).to.match(/<div class="UserCard">/)
    expect(files['src/components/user-card/user-card.js']).to.match(/name: 'UserCardComponent'/)
    expect(files['src/components/user-card/user-card.css']).to.match(/\.UserCard\{\}/)
  })

  it('generates the component in a sub-folder of the root directory', async () => {
    const dir = createProject()
    await runCommand(dir, options, ['admin/user-card'])

    expect(readTree(dir)).to.have.property('src/components/admin/user-card/user-card.vue')
  })

  it('generates the component named on the command line, without prompting', async () => {
    const dir = createProject()
    await runCommand(dir, { ...options, _: ['admin/user-card'] })

    expect(Object.keys(readTree(dir)).filter((file) => file.startsWith('src/')).sort()).to.deep.equal([
      'src/components/admin/user-card/user-card.css',
      'src/components/admin/user-card/user-card.html',
      'src/components/admin/user-card/user-card.js',
      'src/components/admin/user-card/user-card.vue'
    ])
  })

  it('works without the options added by vue add (defaults: js, css, html, ./src/components)', async () => {
    const dir = createProject()
    await runCommand(dir, { _: ['user-card'] })

    expect(Object.keys(readTree(dir)).filter((file) => file.startsWith('src/')).sort()).to.deep.equal([
      'src/components/user-card/user-card.css',
      'src/components/user-card/user-card.html',
      'src/components/user-card/user-card.js',
      'src/components/user-card/user-card.vue'
    ])
  })

  it('generates in the project, whatever the current directory', async () => {
    const dir = createProject()
    const elsewhere = createProject()
    await runCommand(dir, { ...options, _: ['user-card'] }, [], elsewhere)

    expect(readTree(dir)).to.have.property('src/components/user-card/user-card.vue')
    expect(Object.keys(readTree(elsewhere))).to.deep.equal(['package.json'])
  })

  for (const name of ['UserCard', 'userCard', 'user-card', 'user_card']) {
    it(`names the files user-card and the component UserCard for ${name}`, async () => {
      const dir = createProject()
      await runCommand(dir, { ...options, _: [`admin/${name}`] })

      const files = readTree(dir)
      expect(files['src/components/admin/user-card/user-card.vue']).to.match(/<script src="\.\/user-card\.js"><\/script>/)
      expect(files['src/components/admin/user-card/user-card.html']).to.match(/<div class="UserCard">/)
      expect(files['src/components/admin/user-card/user-card.js']).to.match(/name: 'UserCardComponent'/)
      expect(files['src/components/admin/user-card/user-card.css']).to.match(/\.UserCard\{\}/)
    })
  }

  it('keeps acronyms together (HTMLEditor → html-editor, HtmlEditor)', async () => {
    const dir = createProject()
    await runCommand(dir, { ...options, _: ['HTMLEditor'] })

    expect(readTree(dir)['src/components/html-editor/html-editor.js']).to.match(/name: 'HtmlEditorComponent'/)
  })

  for (const script of ['js', 'ts']) {
    it(`generates ${script} components with LF line endings only`, async () => {
      const dir = createProject()
      await runCommand(dir, { ...options, script, _: ['user-card'] })

      for (const [file, content] of Object.entries(readTree(dir))) {
        expect(content, `${file} has CRLF line endings`).to.not.include('\r')
      }
    })
  }

  it('generates TypeScript components without // @ts-ignore', async () => {
    const dir = createProject()
    await runCommand(dir, { ...options, script: 'ts', _: ['user-card'] })

    expect(readTree(dir)['src/components/user-card/user-card.ts']).to.not.match(/@ts-ignore/)
  })

  it('uses the script and style languages of the options', async () => {
    const dir = createProject()
    await runCommand(dir, { ...options, script: 'ts', style: 'scss' }, ['user-card'])

    const files = readTree(dir)
    expect(files['src/components/user-card/user-card.ts']).to.match(/export default defineComponent\(/)
    expect(files['src/components/user-card/user-card.scss']).to.match(/\.UserCard\{\}/)
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
    it(`generates the ${script} script of a ${project} project`, async () => {
      const dir = createProject({ dependencies })
      await runCommand(dir, { ...options, script, _: ['user-card'] })

      expect(readTree(dir)[`src/components/user-card/user-card.${script}`]).to.equal(expected)
    })
  }

  describe('existing component', () => {
    // A generated user-card, with an edited script and a file added by the user
    async function existingComponent() {
      const dir = createProject()
      await runCommand(dir, { ...options, _: ['user-card'] })
      const folder = path.join(dir, 'src', 'components', 'user-card')
      fs.writeFileSync(path.join(folder, 'user-card.js'), 'edited')
      fs.writeFileSync(path.join(folder, 'user-card.spec.js'), 'test')
      const warnings = stub(console, 'warn')
      return { dir, folder, warnings }
    }

    it('overwrites only the generated files when confirmed', async () => {
      const { dir, folder, warnings } = await existingComponent()
      await runCommand(dir, { ...options, _: ['user-card'] }, [true])

      expect(fs.readFileSync(path.join(folder, 'user-card.js'), 'utf8')).to.match(/name: 'UserCardComponent'/)
      expect(fs.readFileSync(path.join(folder, 'user-card.spec.js'), 'utf8')).to.equal('test')
      expect(warnings).to.have.lengthOf(1)
    })

    it('changes nothing when not confirmed', async () => {
      const { dir, folder } = await existingComponent()
      await runCommand(dir, { ...options, _: ['user-card'] }, [false])

      expect(fs.readFileSync(path.join(folder, 'user-card.js'), 'utf8')).to.equal('edited')
      expect(fs.readFileSync(path.join(folder, 'user-card.spec.js'), 'utf8')).to.equal('test')
    })
  })

  describe('component name', () => {
    const generated = (dir) => Object.keys(readTree(dir)).filter((file) => file !== 'package.json')

    it('stops quietly when the name prompt is cancelled', async () => {
      const dir = createProject()
      const logs = stub(console, 'log')
      await runCommand(dir, options, [new Error('cancelled')])

      expect(generated(dir)).to.deep.equal([])
      expect(logs[0]).to.deep.equal(['Cancelled: no component generated'])
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
      it(`refuses ${JSON.stringify(name)} without generating anything`, async () => {
        const dir = createProject()

        expect((await rejection(runCommand(dir, options, [name]))).message).to.match(error)
        expect((await rejection(runCommand(dir, { ...options, _: [name] }))).message).to.match(error)
        expect(generated(dir)).to.deep.equal([])
      })
    }
  })

  it('reads Vue from devDependencies too', async () => {
    const dir = createProject({ devDependencies: { vue: '2.6.14' } })
    await runCommand(dir, { ...options, _: ['user-card'] })

    expect(readTree(dir)['src/components/user-card/user-card.js']).to.not.match(/defineComponent/)
  })
})
