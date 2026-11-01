const { expect } = require('chai')
const { execFileSync } = require('node:child_process')
const minimist = require('minimist')
const { createProject, createVueProject, addRouter, readTree, runGenerator, runCommand } = require('./support/vue-cli')

// The arguments of a script, as the shell npm uses passes them to vue-cli-service (sh or cmd.exe)
function scriptArgv(script) {
  const args = script.replace(/^vue-cli-service /, '')
  const printArgs = `${JSON.stringify(process.execPath)} -e "console.log(JSON.stringify(process.argv.slice(1)))" ${args}`
  return JSON.parse(execFileSync(printArgs, { shell: true, encoding: 'utf8' }))
}

// The arguments vue-cli-service gives to the command of a script (bin/vue-cli-service.js, then Service.run)
function commandArgs(script) {
  const args = minimist(scriptArgv(script), {
    boolean: ['modern', 'report', 'report-json', 'inline-vue', 'watch', 'open', 'copy', 'https', 'verbose']
  })
  const name = args._.shift()
  return { name, args }
}

describe('vue add generator', () => {
  it('adds the scripts of generate:component and generate:view, and their shortcuts', () => {
    const [{ scripts }] = runGenerator({ path: 'components', style: 'scss', ts: true })

    expect(scripts).to.deep.equal({
      'generate:component': 'vue-cli-service generate:component --ts --style scss',
      'g:c': 'npm run generate:component --',
      'generate:view': 'vue-cli-service generate:view --ts --style scss',
      'g:v': 'npm run generate:view --'
    })
  })

  it('changes nothing else in the project package.json', () => {
    const extended = runGenerator({ path: 'components' })

    expect(extended).to.have.lengthOf(1)
    expect(Object.keys(extended[0])).to.deep.equal(['scripts'])
  })

  it('uses CSS and JavaScript without the style and TypeScript answers', () => {
    const [{ scripts }] = runGenerator({ path: 'components' })

    expect(scripts['generate:component']).to.equal('vue-cli-service generate:component --style css')
    expect(scripts['generate:view']).to.equal('vue-cli-service generate:view --style css')
  })

  it('uses JavaScript when TypeScript is declined', () => {
    const [{ scripts }] = runGenerator({ path: 'components', style: 'css', ts: false })

    expect(scripts['generate:component']).to.equal('vue-cli-service generate:component --style css')
  })

  const folders = [
    { answer: 'components/ui', option: ' --path components/ui' },
    { answer: './src/widgets', option: ' --path widgets' },
    { answer: 'my components', option: ' --path "my components"' },
    { answer: '', option: ' --path ""' }
  ]

  for (const { answer, option } of folders) {
    it(`passes the components folder ${JSON.stringify(answer)} to generate:component only`, () => {
      const [{ scripts }] = runGenerator({ path: answer, style: 'css' })

      expect(scripts['generate:component']).to.equal(`vue-cli-service generate:component${option} --style css`)
      expect(scripts['generate:view']).to.equal('vue-cli-service generate:view --style css')
    })
  }

  for (const [shortcut, script] of [['g:c', 'generate:component'], ['g:v', 'generate:view']]) {
    it(`passes everything after -- on to ${script} through npm run ${shortcut}`, () => {
      const [{ scripts }] = runGenerator({ path: 'components', style: 'css' })
      // The shortcut, and the command replaced by a script printing its arguments (npm run puts node in the PATH)
      const printArgs = 'node -e "console.log(JSON.stringify(process.argv.slice(1)))" --'
      const dir = createProject({ scripts: { [shortcut]: scripts[shortcut], [script]: `${printArgs} --style css` } })

      const stdout = execFileSync(`npm run ${shortcut} -- Card --props title,items --blank`, { cwd: dir, shell: true, encoding: 'utf8' })
      const argv = JSON.parse(stdout.trim().split('\n').pop())

      expect(argv).to.deep.equal(['--style', 'css', 'Card', '--props', 'title,items', '--blank'])
    })
  }

  describe('the scripts run through the shell and vue-cli-service', () => {
    const cases = [
      { label: 'Vue 2, CSS', vue: 2, answers: { path: 'components', style: 'css' },
        component: 'src/components/Card.vue', style: '<style lang="css" scoped>', script: /export default \{/ },
      { label: 'Vue 3, SCSS, TypeScript', vue: 3, answers: { path: 'components', style: 'scss', ts: true },
        component: 'src/components/Card.vue', style: '<style lang="scss" scoped>', script: /<script setup lang="ts">/ },
      { label: 'a folder with spaces', vue: 3, answers: { path: './src/my components', style: 'css' },
        component: 'src/my components/Card.vue', style: '<style lang="css" scoped>', script: /<script setup>/ },
      { label: 'components in src/', vue: 3, answers: { path: 'src', style: 'css' },
        component: 'src/Card.vue', style: '<style lang="css" scoped>', script: /<script setup>/ }
    ]

    for (const { label, vue, answers, component, style, script } of cases) {
      it(`generates the component and the view: ${label}`, async () => {
        const [{ scripts }] = runGenerator(answers)
        const dir = createVueProject(vue)
        addRouter(dir, vue)

        for (const [script, name] of [['generate:component', 'Card'], ['generate:view', 'Contact']]) {
          const { name: command, args } = commandArgs(`${scripts[script]} ${name}`)
          expect(command).to.equal(script)
          const { output, exitCode } = await runCommand(dir, args, [], { name: command })
          expect(output.error).to.deep.equal([])
          expect(exitCode).to.equal(undefined)
        }

        const files = readTree(dir)
        expect(files[component]).to.include(style).and.match(script)
        expect(files['src/views/Contact.vue']).to.include(style).and.match(script)
      })
    }

    it('lets the options of the scripts be overridden', async () => {
      const [{ scripts }] = runGenerator({ path: 'components/ui', style: 'scss', ts: true })
      const dir = createVueProject()

      const { args } = commandArgs(`${scripts['generate:component']} Card --path widgets --style less --ts false`)
      const { output } = await runCommand(dir, args)

      expect(output.error).to.deep.equal([])
      expect(readTree(dir)['src/widgets/Card.vue']).to.include('<style lang="less" scoped>').and.match(/<script setup>/)
    })
  })
})
