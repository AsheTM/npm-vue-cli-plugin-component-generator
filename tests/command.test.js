const { expect } = require('chai')
const fs = require('node:fs')
const path = require('node:path')
const { createProject, createVueProject, readTree, runCommand } = require('./support/vue-cli')

const vueg = { 2: require('vueg-vue2'), 3: require('vueg-vue3') }

// The files generated in src/ (not main.js and App.vue)
const generated = (dir) => Object.keys(readTree(dir))
  .filter((file) => file.startsWith('src/') && !['src/main.js', 'src/App.vue'].includes(file))
  .sort()

const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8')

// The component vueg generates in a new project of this Vue version, with these options
function vuegComponent(vue, options) {
  const dir = createVueProject(vue)
  const log = console.log
  console.log = () => {}
  try {
    return fs.readFileSync(vueg[vue].component({ ...options, cwd: dir }), 'utf8')
  } finally {
    console.log = log
  }
}

describe('generate:component', () => {
  it('registers the command with its options', async () => {
    const { command } = await runCommand(createVueProject(), { _: ['Card'] })

    expect(command.name).to.equal('generate:component')
    expect(command.options.usage).to.equal('vue-cli-service generate:component [options] [name]')
    expect(Object.keys(command.options.options)).to.deep.equal([
      '--path', '--style', '--scoped', '--module', '--props', '--emits', '--ts', '--options',
      '--template', '--test', '--story', '--blank', '--no-template', '--force', '--dry-run'
    ])
  })

  describe('Vue version', () => {
    it('generates a single-file Vue 3 component with vueg 2 (<script setup>)', async () => {
      const dir = createVueProject(3)
      const { output, exitCode } = await runCommand(dir, { _: ['UserCard'] })

      expect(generated(dir)).to.deep.equal(['src/components/UserCard.vue'])
      expect(read(dir, 'src/components/UserCard.vue')).to.equal(vuegComponent(3, { name: 'UserCard', path: 'components' }))
      expect(read(dir, 'src/components/UserCard.vue')).to.match(/<script setup>/)
      expect(output.log).to.deep.equal(['> Generating vue component starting', '> Generating vue component success'])
      expect(exitCode).to.equal(undefined)
    })

    it('generates a single-file Vue 2 component with vueg 1 (Options API)', async () => {
      const dir = createVueProject(2)
      await runCommand(dir, { _: ['UserCard'] })

      expect(generated(dir)).to.deep.equal(['src/components/UserCard.vue'])
      expect(read(dir, 'src/components/UserCard.vue')).to.equal(vuegComponent(2, { name: 'UserCard', path: 'components' }))
      expect(read(dir, 'src/components/UserCard.vue')).to.match(/export default \{\s+name: "UserCard"/)
    })

    it('uses the installed Vue version first', async () => {
      // package.json says Vue 3, node_modules has Vue 2
      const dir = createVueProject(2, { dependencies: { vue: '^3.2.13' } })
      fs.mkdirSync(path.join(dir, 'node_modules', 'vue'), { recursive: true })
      fs.writeFileSync(path.join(dir, 'node_modules', 'vue', 'package.json'), JSON.stringify({ name: 'vue', version: '2.7.16' }))
      await runCommand(dir, { _: ['Card'] })

      expect(read(dir, 'src/components/Card.vue')).to.equal(vuegComponent(2, { name: 'Card', path: 'components' }))
    })

    it('reads Vue from devDependencies too', async () => {
      const dir = createVueProject(2, { devDependencies: { vue: '2.6.14' } })
      await runCommand(dir, { _: ['Card'] })

      expect(read(dir, 'src/components/Card.vue')).to.equal(vuegComponent(2, { name: 'Card', path: 'components' }))
    })

    it('uses Vue 3 without vue in package.json', async () => {
      const dir = createVueProject(3, {})
      await runCommand(dir, { _: ['Card'] })

      expect(read(dir, 'src/components/Card.vue')).to.match(/<script setup>/)
    })

    for (const vue of ['^1.0.28', '4.0.0']) {
      it(`refuses Vue ${vue}`, async () => {
        const dir = createVueProject(3, { dependencies: { vue } })
        const { output, exitCode } = await runCommand(dir, { _: ['Card'] })

        expect(output.error).to.deep.equal([`Vue ${vue.match(/\d/)[0]} is not supported: Vue 2 and Vue 3 only`])
        expect(exitCode).to.equal(1)
        expect(generated(dir)).to.deep.equal([])
      })
    }

    it('refuses a Vue 2 project with Vue 3 in package.json', async () => {
      const dir = createVueProject(2, { dependencies: { vue: '^3.2.13' } })
      const { output, exitCode } = await runCommand(dir, { _: ['Card'] })

      expect(output.error).to.deep.equal(['src/main.js is a Vue 2 entry, but package.json has Vue 3: check the version of vue'])
      expect(exitCode).to.equal(1)
      expect(generated(dir)).to.deep.equal([])
    })
  })

  describe('name and folder', () => {
    for (const name of ['UserCard', 'userCard', 'user-card', 'user_card', 'UserCard.vue']) {
      it(`names the component UserCard for ${name}`, async () => {
        const dir = createVueProject()
        await runCommand(dir, { _: [name] })

        expect(generated(dir)).to.deep.equal(['src/components/UserCard.vue'])
      })
    }

    it('generates in a sub-folder of src/components/', async () => {
      const dir = createVueProject()
      await runCommand(dir, { _: ['admin/user-card'] })

      expect(generated(dir)).to.deep.equal(['src/components/admin/UserCard.vue'])
    })

    it('generates in the folder of --path, inside src/', async () => {
      const dir = createVueProject()
      await runCommand(dir, { _: ['admin/Card'], path: 'ui' })
      await runCommand(dir, { _: ['Card'], path: '' })

      expect(generated(dir)).to.deep.equal(['src/Card.vue', 'src/ui/admin/Card.vue'])
    })

    it('generates in the project, whatever the current directory', async () => {
      const dir = createVueProject()
      const elsewhere = createProject()
      await runCommand(dir, { _: ['Card'] }, [], { cwd: elsewhere })

      expect(generated(dir)).to.deep.equal(['src/components/Card.vue'])
      expect(Object.keys(readTree(elsewhere))).to.deep.equal(['package.json'])
    })

    it('generates the prompted component', async () => {
      const dir = createVueProject()
      await runCommand(dir, {}, ['admin/Card'])

      expect(generated(dir)).to.deep.equal(['src/components/admin/Card.vue'])
    })

    it('stops quietly when the name prompt is cancelled', async () => {
      const dir = createVueProject()
      const { output, exitCode } = await runCommand(dir, {}, [new Error('cancelled')])

      expect(generated(dir)).to.deep.equal([])
      expect(output.log).to.deep.equal(['Cancelled: no component generated'])
      expect(exitCode).to.equal(undefined)
    })

    const invalid = [
      { name: '', error: 'A component name is required' },
      { name: '   ', error: 'A component name is required' },
      { name: '/', error: 'A component name is required' },
      { name: '1card', error: 'Invalid component name "1card": letters, digits, - and _ only, starting with a letter' },
      { name: 'user card', error: 'Invalid component name "user card": letters, digits, - and _ only, starting with a letter' },
      { name: 'user.card', error: 'Invalid component name "user.card": letters, digits, - and _ only, starting with a letter' },
      { name: '../user-card', error: 'Invalid component path "../user-card": . and .. are not allowed' },
      { name: 404, error: 'Invalid component name "404": letters, digits, - and _ only, starting with a letter' }
    ]

    for (const { name, error } of invalid) {
      it(`refuses ${JSON.stringify(name)} without generating anything`, async () => {
        const dir = createVueProject()

        for (const run of [() => runCommand(dir, {}, [name]), () => runCommand(dir, { _: [name] })]) {
          const { output, exitCode } = await run()
          expect(output.error).to.deep.equal([error])
          expect(exitCode).to.equal(1)
        }
        expect(generated(dir)).to.deep.equal([])
      })
    }
  })

  describe('options', () => {
    const cases = [
      { label: 'Vue 3: --style, --props, --emits, --scoped false', vue: 3,
        args: { style: 'scss', props: 'title, items', emits: 'close,save', scoped: 'false' },
        options: { style: 'scss', props: ['title', 'items'], emits: ['close', 'save'], scoped: false } },
      { label: 'Vue 3: --ts, --options, --blank', vue: 3,
        args: { ts: true, options: true, blank: true },
        options: { ts: true, optionsApi: true, blank: true } },
      // Without the template, vueg 2 needs something in <script setup> (vuegc 2.1)
      { label: 'Vue 3: --module, --no-template', vue: 3,
        args: { module: true, template: false, props: 'title' },
        options: { cssModule: true, noTemplate: true, props: ['title'] } },
      { label: 'Vue 3: --template pug', vue: 3,
        args: { template: 'pug', blank: true },
        options: { template: 'pug', blank: true } },
      { label: 'Vue 3: --no-script, --no-scoped', vue: 3,
        args: { script: false, scoped: false },
        options: { noScript: true, scoped: false } },
      { label: 'Vue 3: --no-style', vue: 3,
        args: { style: false },
        options: { noStyle: true } },
      { label: 'Vue 2: --style, --props, --blank, --scoped true', vue: 2,
        args: { style: 'less', props: 'title', blank: 'true', scoped: 'true' },
        options: { style: 'less', props: ['title'], blank: true, scoped: true } },
      { label: 'Vue 2: --module, --no-template', vue: 2,
        args: { module: true, template: false },
        options: { cssModule: true, noTemplate: true } }
    ]

    for (const { label, vue, args, options } of cases) {
      it(`passes ${label} to vueg`, async () => {
        const dir = createVueProject(vue)
        await runCommand(dir, { _: ['Card'], ...args })

        expect(read(dir, 'src/components/Card.vue')).to.equal(vuegComponent(vue, { name: 'Card', path: 'components', ...options }))
      })
    }

    it('ignores vue-cli-service\'s own options (its boolean flags are always there)', async () => {
      const dir = createVueProject()
      const service = { modern: false, report: false, 'report-json': false, 'inline-vue': false, watch: false,
        open: false, copy: false, https: false, verbose: false, mode: 'development', 'skip-plugins': 'eslint' }
      const { output, exitCode } = await runCommand(dir, { _: ['Card'], ...service })

      expect(output.error).to.deep.equal([])
      expect(exitCode).to.equal(undefined)
      expect(generated(dir)).to.deep.equal(['src/components/Card.vue'])
    })

    it('takes the last value of an option given twice (the script\'s, then yours)', async () => {
      const dir = createVueProject()
      // vue-cli-service generate:component --path components --style css --ts Card --path ui --style less --ts false
      await runCommand(dir, { _: ['Card'], path: ['components', 'ui'], style: ['css', 'less'], ts: [true, 'false'] })

      expect(generated(dir)).to.deep.equal(['src/ui/Card.vue'])
      expect(read(dir, 'src/ui/Card.vue')).to.equal(vuegComponent(3, { name: 'Card', path: 'ui', style: 'less' }))
    })

    it('reads the name after a flag without value given twice (--ts Card --ts false)', async () => {
      const dir = createVueProject()
      await runCommand(dir, { ts: ['Card', 'false'] })

      expect(read(dir, 'src/components/Card.vue')).to.equal(vuegComponent(3, { name: 'Card', path: 'components' }))
    })

    it('reads the name after a flag without value (--blank Card)', async () => {
      const dir = createVueProject()
      await runCommand(dir, { blank: 'Card', 'dry-run': 'false' })

      expect(read(dir, 'src/components/Card.vue')).to.equal(vuegComponent(3, { name: 'Card', path: 'components', blank: true }))
    })

    it('prints the component and writes nothing with --dry-run', async () => {
      const dir = createVueProject()
      const { output } = await runCommand(dir, { _: ['Card'], 'dry-run': true })

      expect(generated(dir)).to.deep.equal([])
      expect(output.log.join('\n')).to.include('<script setup>')
    })

    const errors = [
      { label: 'the options removed in 1.0.0', args: { script: 'js', view: 'html', 'root-dir': './src/components' },
        error: '--script, --view, --root-dir: removed in 1.0.0, components are single .vue files. ' +
          'Run "vue invoke @ashetm/component-generator" to update the scripts of package.json' },
      { label: 'an unknown option', args: { color: 'red', x: true },
        error: 'Unknown option --color, --x, see "vue-cli-service help generate:component"' },
      { label: '--path without a folder', args: { path: true }, error: '--path needs a folder inside src/, e.g. --path admin' },
      { label: '--style without a value', args: { style: true }, error: '--style needs a value: css, scss, sass, less or stylus' },
      { label: '--props without names', args: { props: true }, error: '--props needs comma-separated names, e.g. --props title,items' },
      { label: 'an unsupported style (vueg\'s message)', args: { style: 'styl' }, error: 'Style styl not supported, use one of: css, scss, sass, less, stylus' },
      { label: 'a path outside src/ (vueg\'s message)', args: { path: '../lib' }, error: /^Path .* must be/ }
    ]

    for (const { label, args, error } of errors) {
      it(`refuses ${label}`, async () => {
        const dir = createVueProject()
        const { output, exitCode } = await runCommand(dir, { _: ['Card'], ...args })

        expect(output.error).to.have.lengthOf(1)
        if (error instanceof RegExp) {
          expect(output.error[0]).to.match(error)
        } else {
          expect(output.error[0]).to.equal(error)
        }
        expect(exitCode).to.equal(1)
        expect(generated(dir)).to.deep.equal([])
      })
    }

    it('refuses the Vue 3 options in a Vue 2 project', async () => {
      const dir = createVueProject(2)
      const { output, exitCode } = await runCommand(dir, { _: ['Card'], emits: 'close', ts: true, options: true })

      expect(output.error).to.deep.equal(['--emits, --ts, --options: Vue 3 only, this project uses Vue 2'])
      expect(exitCode).to.equal(1)
      expect(generated(dir)).to.deep.equal([])
    })

    it('refuses --test, --story and --template in a Vue 2 project, but not --no-template', async () => {
      const dir = createVueProject(2)
      const refused = await runCommand(dir, { _: ['Card'], test: true, story: true, template: 'pug' })

      expect(refused.output.error).to.deep.equal(['--test, --story, --template: Vue 3 only, this project uses Vue 2'])
      expect(refused.exitCode).to.equal(1)
      expect(generated(dir)).to.deep.equal([])

      const { exitCode } = await runCommand(dir, { _: ['Card'], template: false })
      expect(exitCode).to.equal(undefined)
      expect(generated(dir)).to.deep.equal(['src/components/Card.vue'])
    })

    it('writes the test and the story next to the component', async () => {
      const dir = createVueProject(3)
      const { exitCode } = await runCommand(dir, { _: ['admin/user-card'], test: true, story: true, ts: true, props: 'title' })

      expect(exitCode).to.equal(undefined)
      expect(generated(dir)).to.deep.equal([
        'src/components/admin/UserCard.spec.ts', 'src/components/admin/UserCard.stories.ts', 'src/components/admin/UserCard.vue'
      ])
      expect(read(dir, 'src/components/admin/UserCard.spec.ts')).to.contain('mount(UserCard, { props: { title: "title" } })')
      expect(read(dir, 'src/components/admin/UserCard.stories.ts')).to.contain('satisfies Meta<typeof UserCard>')
    })

    it('takes the name after --test or --story, not as their value', async () => {
      const dir = createVueProject(3)
      await runCommand(dir, { _: [], test: 'Card', story: true })

      expect(generated(dir)).to.deep.equal(['src/components/Card.spec.js', 'src/components/Card.stories.js', 'src/components/Card.vue'])
    })

    it('refuses --template without a value', async () => {
      const dir = createVueProject(3)
      const { output, exitCode } = await runCommand(dir, { _: ['Card'], template: true })

      expect(output.error).to.deep.equal(['--template needs a value: html or pug'])
      expect(exitCode).to.equal(1)
      expect(generated(dir)).to.deep.equal([])
    })
  })

  describe('existing component', () => {
    // A generated Card, edited by the user
    async function existingComponent() {
      const dir = createVueProject()
      await runCommand(dir, { _: ['Card'] })
      fs.writeFileSync(path.join(dir, 'src', 'components', 'Card.vue'), 'edited')
      return dir
    }

    it('overwrites it when confirmed', async () => {
      const dir = await existingComponent()
      const { output, exitCode } = await runCommand(dir, { _: ['Card'] }, [true])

      expect(output.warn).to.deep.equal(['Component Card exists!'])
      expect(read(dir, 'src/components/Card.vue')).to.equal(vuegComponent(3, { name: 'Card', path: 'components' }))
      expect(exitCode).to.equal(undefined)
    })

    it('changes nothing when not confirmed', async () => {
      const dir = await existingComponent()
      const { output, exitCode } = await runCommand(dir, { _: ['Card'] }, [false])

      expect(output.warn).to.deep.equal(['Component Card exists!'])
      expect(read(dir, 'src/components/Card.vue')).to.equal('edited')
      expect(exitCode).to.equal(undefined)
    })

    it('overwrites it without asking with --force', async () => {
      const dir = await existingComponent()
      const { output } = await runCommand(dir, { _: ['Card'], force: true })

      expect(output.warn).to.deep.equal([])
      expect(read(dir, 'src/components/Card.vue')).to.equal(vuegComponent(3, { name: 'Card', path: 'components' }))
    })

    it('fails without asking with --dry-run', async () => {
      const dir = await existingComponent()
      const { output, exitCode } = await runCommand(dir, { _: ['Card'], 'dry-run': true })

      expect(output.warn).to.deep.equal([])
      expect(output.error).to.deep.equal(['Component already exists, use --force to overwrite it'])
      expect(exitCode).to.equal(1)
      expect(read(dir, 'src/components/Card.vue')).to.equal('edited')
    })

    // Only the test exists: the question names it (vuegc 2.1's EEXIST has the file)
    it('names an existing test, and overwrites it when confirmed', async () => {
      const dir = createVueProject()
      fs.mkdirSync(path.join(dir, 'src', 'components'), { recursive: true })
      fs.writeFileSync(path.join(dir, 'src', 'components', 'Card.spec.js'), 'my own test')

      const refused = await runCommand(dir, { _: ['Card'], test: true }, [false])
      expect(refused.output.warn).to.deep.equal(['src/components/Card.spec.js exists!'])
      expect(generated(dir)).to.deep.equal(['src/components/Card.spec.js'])

      await runCommand(dir, { _: ['Card'], test: true }, [true])
      expect(read(dir, 'src/components/Card.spec.js')).to.contain('mount(Card)')
      expect(generated(dir)).to.deep.equal(['src/components/Card.spec.js', 'src/components/Card.vue'])
    })
  })

  for (const vue of [2, 3]) {
    it(`prints vueg's message outside a Vue ${vue} project`, async () => {
      const dir = createVueProject(vue)
      fs.rmSync(path.join(dir, 'src', 'main.js'))
      const { output, exitCode } = await runCommand(dir, { _: ['Card'] })

      expect(output.error).to.deep.equal(['It is not the root of Vue project'])
      expect(exitCode).to.equal(1)
      expect(generated(dir)).to.deep.equal([])
    })
  }
})
