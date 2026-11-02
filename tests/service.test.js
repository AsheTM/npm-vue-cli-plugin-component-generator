const { expect } = require('chai')
const fs = require('node:fs')
const path = require('node:path')
const { createVueProject, readTree, runCommand } = require('./support/vue-cli')

const vueg = require('vueg-vue3')

const runService = (dir, args = {}, promptAnswers = []) => runCommand(dir, args, promptAnswers, { name: 'generate:service' })

// The files generated in src/ (not main.js and App.vue)
const generated = (dir) => Object.keys(readTree(dir))
  .filter((file) => file.startsWith('src/') && !['src/main.js', 'src/App.vue'].includes(file))
  .sort()

const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8')

// The service vueg generates in a new project, with these options
function vuegService(options) {
  const dir = createVueProject()
  const log = console.log
  console.log = () => {}
  try {
    return fs.readFileSync(vueg.service({ ...options, cwd: dir }), 'utf8')
  } finally {
    console.log = log
  }
}

describe('generate:service', () => {
  it('registers the command with its options', async () => {
    const { command } = await runService(createVueProject(), { _: ['User'] })

    expect(command.name).to.equal('generate:service')
    expect(command.options.usage).to.equal('vue-cli-service generate:service [options] [name]')
    expect(Object.keys(command.options.options)).to.deep.equal(['--path', '--ts', '--test', '--blank', '--force', '--dry-run'])
  })

  for (const vue of [2, 3]) {
    describe(`Vue ${vue}`, () => {
      it('generates the service in src/services/, its file name in kebab-case', async () => {
        const dir = createVueProject(vue)
        const { output, exitCode } = await runService(dir, { _: ['UserProfile'] })

        expect(generated(dir)).to.deep.equal(['src/services/user-profile.service.js'])
        expect(read(dir, 'src/services/user-profile.service.js')).to.equal(vuegService({ name: 'UserProfile' }))
        expect(read(dir, 'src/services/user-profile.service.js')).to.include('const BASE_URL = "/api/user-profile"')
        expect(output.log).to.deep.equal(['> Service written: src/services/user-profile.service.js'])
        expect(exitCode).to.equal(undefined)
      })

      it('takes --ts and --test, which are not Vue 3 only here', async () => {
        const dir = createVueProject(vue)
        const { output, exitCode } = await runService(dir, { _: ['User'], ts: true, test: true })

        expect(generated(dir)).to.deep.equal(['src/services/user.service.spec.ts', 'src/services/user.service.ts'])
        expect(read(dir, 'src/services/user.service.ts')).to.equal(vuegService({ name: 'User', ts: true }))
        expect(output.error).to.deep.equal([])
        expect(exitCode).to.equal(undefined)
      })
    })
  }

  it('generates the service in the sub-folders of the name', async () => {
    const dir = createVueProject()
    await runService(dir, { _: ['admin/User'] })

    expect(generated(dir)).to.deep.equal(['src/services/admin/user.service.js'])
  })

  it('generates the service in --path, inside src/', async () => {
    const dir = createVueProject()
    await runService(dir, { _: ['User'], path: 'api' })

    expect(generated(dir)).to.deep.equal(['src/api/user.service.js'])
  })

  it('accepts the name of the file: user.service, user.service.ts', async () => {
    const dir = createVueProject()
    await runService(dir, { _: ['user.service'] })
    await runService(dir, { _: ['account.service.ts'] })

    expect(generated(dir)).to.deep.equal(['src/services/account.service.js', 'src/services/user.service.js'])
  })

  it('generates an empty module with --blank', async () => {
    const dir = createVueProject()
    await runService(dir, { _: ['User'], blank: true })

    expect(read(dir, 'src/services/user.service.js')).to.equal(vuegService({ name: 'User', blank: true }))
  })

  it('prints the service without writing it with --dry-run', async () => {
    const dir = createVueProject()
    const { output } = await runService(dir, { _: ['User'], 'dry-run': true })

    expect(generated(dir)).to.deep.equal([])
    expect(output.log[0]).to.equal('> Dry run, nothing written: src/services/user.service.js\n')
    expect(output.log[1]).to.include('const BASE_URL = "/api/user"')
  })

  it('reads "--ts User" as --ts and the name', async () => {
    const dir = createVueProject()
    await runService(dir, { ts: 'User' })

    expect(generated(dir)).to.deep.equal(['src/services/user.service.ts'])
  })

  it('asks for the name when it is not given', async () => {
    const dir = createVueProject()
    await runService(dir, {}, ['User'])

    expect(generated(dir)).to.deep.equal(['src/services/user.service.js'])
  })

  it('generates nothing when the question is cancelled', async () => {
    const dir = createVueProject()
    const { output } = await runService(dir, {}, [undefined])

    expect(generated(dir)).to.deep.equal([])
    expect(output.log).to.deep.equal(['Cancelled: no service generated'])
  })

  describe('an existing service', () => {
    it('is overwritten after confirming', async () => {
      const dir = createVueProject()
      await runService(dir, { _: ['User'], blank: true })
      const { output } = await runService(dir, { _: ['User'] }, [true])

      expect(output.warn).to.deep.equal(['src/services/user.service.js exists!'])
      expect(read(dir, 'src/services/user.service.js')).to.equal(vuegService({ name: 'User' }))
    })

    it('is kept when declined', async () => {
      const dir = createVueProject()
      await runService(dir, { _: ['User'], blank: true })
      await runService(dir, { _: ['User'] }, [false])

      expect(read(dir, 'src/services/user.service.js')).to.equal(vuegService({ name: 'User', blank: true }))
    })

    it('is overwritten without asking with --force', async () => {
      const dir = createVueProject()
      await runService(dir, { _: ['User'], blank: true })
      const { output } = await runService(dir, { _: ['User'], force: true })

      expect(output.warn).to.deep.equal([])
      expect(read(dir, 'src/services/user.service.js')).to.equal(vuegService({ name: 'User' }))
    })

    it('names its existing test', async () => {
      const dir = createVueProject()
      await runService(dir, { _: ['User'], test: true })
      fs.rmSync(path.join(dir, 'src', 'services', 'user.service.js'))
      const { output } = await runService(dir, { _: ['User'], test: true }, [false])

      expect(output.warn).to.deep.equal(['src/services/user.service.spec.js exists!'])
      expect(generated(dir)).to.deep.equal(['src/services/user.service.spec.js'])
    })
  })

  describe('errors', () => {
    const errors = [
      { label: 'an invalid name', args: { _: ['1user'] }, message: 'Invalid service name "1user": letters, digits, - and _ only, starting with a letter' },
      { label: '.. in the name', args: { _: ['../User'] }, message: 'Invalid service path "../User": . and .. are not allowed' },
      { label: 'a component option', args: { _: ['User'], style: 'scss' }, message: 'Unknown option --style, see "vue-cli-service help generate:service"' },
      { label: '--path without a value', args: { _: ['User'], path: true }, message: '--path needs a folder inside src/, e.g. --path api' }
    ]

    for (const { label, args, message } of errors) {
      it(`refuses ${label}`, async () => {
        const dir = createVueProject()
        const { output, exitCode } = await runService(dir, args)

        expect(output.error).to.deep.equal([message])
        expect(exitCode).to.equal(1)
        expect(generated(dir)).to.deep.equal([])
      })
    }

    it('refuses a --path outside src/ with vueg\'s message', async () => {
      const dir = createVueProject()
      const { output, exitCode } = await runService(dir, { _: ['User'], path: '../lib' })

      expect(output.error).to.deep.equal([vueg.errorMessage({ errno: 0x0005, path: '../lib' })])
      expect(exitCode).to.equal(1)
    })
  })
})
