const { expect } = require('chai')
const fs = require('node:fs')
const path = require('node:path')
const { createVueProject, addRouter, readTree, runCommand } = require('./support/vue-cli')

const vueg = { 2: require('vueg-vue2'), 3: require('vueg-vue3') }

const runView = (dir, args = {}, promptAnswers = []) => runCommand(dir, args, promptAnswers, { name: 'generate:view' })

// The files generated in src/views/
const views = (dir) => Object.keys(readTree(dir)).filter((file) => file.startsWith('src/views/')).sort()

const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8')
const router = (dir) => read(dir, 'src/router/index.js')

// The view and the router vueg generates in a new project with a router, with these options
function vuegView(vue, options) {
  const dir = createVueProject(vue)
  addRouter(dir, vue)
  const log = console.log
  console.log = () => {}
  try {
    const { file } = vueg[vue].view({ ...options, cwd: dir })
    return { view: fs.readFileSync(file, 'utf8'), router: router(dir) }
  } finally {
    console.log = log
  }
}

describe('generate:view', () => {
  it('registers the command with its options', async () => {
    const dir = createVueProject()
    addRouter(dir)
    const { command } = await runView(dir, { _: ['Profile'] })

    expect(command.name).to.equal('generate:view')
    expect(command.options.usage).to.equal('vue-cli-service generate:view [options] [name]')
    expect(Object.keys(command.options.options)).to.deep.equal([
      '--path', '--route', '--no-route', '--style', '--scoped', '--module', '--props', '--emits', '--ts', '--options',
      '--template', '--test', '--story', '--blank', '--no-template', '--force', '--dry-run'
    ])
  })

  for (const vue of [2, 3]) {
    describe(`Vue ${vue}`, () => {
      it('generates the view in src/views/ and adds its route', async () => {
        const dir = createVueProject(vue)
        addRouter(dir, vue)
        const { output, exitCode } = await runView(dir, { _: ['admin/user-profile'] })

        const expected = vuegView(vue, { name: 'UserProfile', path: 'admin' })
        expect(views(dir)).to.deep.equal(['src/views/admin/UserProfile.vue'])
        expect(read(dir, 'src/views/admin/UserProfile.vue')).to.equal(expected.view)
        expect(router(dir)).to.equal(expected.router)
        expect(router(dir)).to.include("component: () => import('../views/admin/UserProfile.vue')")
        expect(output.log).to.include('> Route /admin/user-profile added to src/router/index.js')
        expect(exitCode).to.equal(undefined)
      })

      it('passes the component options to vueg', async () => {
        const dir = createVueProject(vue)
        addRouter(dir, vue)
        await runView(dir, { _: ['Profile'], style: 'scss', props: 'id', blank: true, path: 'users', route: '/users/:id' })

        const expected = vuegView(vue, { name: 'Profile', path: 'users', style: 'scss', props: ['id'], blank: true, route: '/users/:id' })
        expect(read(dir, 'src/views/users/Profile.vue')).to.equal(expected.view)
        expect(router(dir)).to.equal(expected.router)
        expect(router(dir)).to.include("path: '/users/:id'")
      })
    })
  }

  it('writes the view\'s test and story next to it, in Vue 3', async () => {
    const dir = createVueProject(3)
    addRouter(dir, 3)
    const { output, exitCode } = await runView(dir, { _: ['admin/user-profile'], test: true, story: true, template: 'pug' })

    expect(views(dir)).to.deep.equal([
      'src/views/admin/UserProfile.spec.js', 'src/views/admin/UserProfile.stories.js', 'src/views/admin/UserProfile.vue'
    ])
    expect(read(dir, 'src/views/admin/UserProfile.vue')).to.include('<template lang="pug">')
    expect(output.log).to.include('> Route /admin/user-profile added to src/router/index.js')
    expect(exitCode).to.equal(undefined)
  })

  it('leaves the router as is with --no-route', async () => {
    const dir = createVueProject()
    const before = addRouter(dir)
    const { exitCode } = await runView(dir, { _: ['Profile'], route: false })

    expect(views(dir)).to.deep.equal(['src/views/Profile.vue'])
    expect(router(dir)).to.equal(before)
    expect(exitCode).to.equal(undefined)
  })

  it('generates a view without a router with --no-route', async () => {
    const dir = createVueProject()
    await runView(dir, { _: ['Profile'], route: false })

    expect(views(dir)).to.deep.equal(['src/views/Profile.vue'])
  })

  it('prints the view and its route, and writes nothing with --dry-run', async () => {
    const dir = createVueProject()
    const before = addRouter(dir)
    const { output } = await runView(dir, { _: ['Profile'], 'dry-run': true })

    expect(views(dir)).to.deep.equal([])
    expect(router(dir)).to.equal(before)
    expect(output.log.join('\n')).to.include('<script setup>').and.include('/profile')
  })

  it('generates the prompted view', async () => {
    const dir = createVueProject()
    addRouter(dir)
    await runView(dir, {}, ['admin/Users'])

    expect(views(dir)).to.deep.equal(['src/views/admin/Users.vue'])
  })

  it('stops quietly when the name prompt is cancelled', async () => {
    const dir = createVueProject()
    addRouter(dir)
    const { output, exitCode } = await runView(dir, {}, [new Error('cancelled')])

    expect(views(dir)).to.deep.equal([])
    expect(output.log).to.deep.equal(['Cancelled: no view generated'])
    expect(exitCode).to.equal(undefined)
  })

  describe('existing view', () => {
    // A generated Profile view and its route, the view edited by the user
    async function existingView() {
      const dir = createVueProject()
      addRouter(dir)
      await runView(dir, { _: ['Profile'] })
      fs.writeFileSync(path.join(dir, 'src', 'views', 'Profile.vue'), 'edited')
      return dir
    }

    // vueg checks the route first: an existing view usually has its route too
    for (const { label, args, error } of [
      { label: 'its route exists', args: {}, error: 'Route "/profile" already exists in src/router/index.js: use --route or --no-route' },
      { label: 'it exists (--no-route)', args: { route: false }, error: 'Component already exists, use --force to overwrite it' }
    ]) {
      it(`is not overwritten without --force, and not asked: ${label}`, async () => {
        const dir = await existingView()
        const routerBefore = router(dir)
        const { output, exitCode } = await runView(dir, { _: ['Profile'], ...args })

        expect(output.warn).to.deep.equal([])
        expect(output.error).to.deep.equal([error])
        expect(exitCode).to.equal(1)
        expect(read(dir, 'src/views/Profile.vue')).to.equal('edited')
        expect(router(dir)).to.equal(routerBefore)
      })
    }

    it('is overwritten with --force --no-route', async () => {
      const dir = await existingView()
      const routerBefore = router(dir)
      const { exitCode } = await runView(dir, { _: ['Profile'], force: true, route: false })

      expect(read(dir, 'src/views/Profile.vue')).to.not.equal('edited')
      expect(router(dir)).to.equal(routerBefore)
      expect(exitCode).to.equal(undefined)
    })
  })

  const errors = [
    { label: 'a project without router (vueg\'s message)', router: false, args: { _: ['Profile'] }, error: /^No router found/ },
    { label: 'an existing route (vueg\'s message)', args: { _: ['Profile'], route: '/about' }, error: /^Route "\/about" already exists/ },
    { label: 'an existing route name (vueg\'s message)', args: { _: ['Home'] }, error: 'A route named "home" already exists in src/router/index.js: use --no-route' },
    { label: 'a route without /', args: { _: ['Profile'], route: 'profile' }, error: /--route needs a path starting with "\/"/ },
    { label: '--route without a path', args: { _: ['Profile'], route: true }, error: '--route needs a path starting with "/", e.g. --route /admin/users' },
    { label: '--path without a folder', args: { _: ['Profile'], path: true }, error: '--path needs a folder inside src/views/, e.g. --path admin' },
    { label: 'a path outside src/views/ (vueg\'s message)', args: { _: ['Profile'], path: '../components' }, error: /^Path "\.\.\/components" must be a folder inside src\/views\// },
    { label: 'an invalid name', args: { _: ['1home'] }, error: 'Invalid view name "1home": letters, digits, - and _ only, starting with a letter' },
    { label: 'an unknown option', args: { _: ['Profile'], color: 'red' }, error: 'Unknown option --color, see "vue-cli-service help generate:view"' }
  ]

  for (const { label, router: withRouter = true, args, error } of errors) {
    it(`refuses ${label} and changes nothing`, async () => {
      const dir = createVueProject()
      const before = withRouter ? addRouter(dir) : null
      const { output, exitCode } = await runView(dir, args)

      expect(output.error).to.have.lengthOf(1)
      if (error instanceof RegExp) {
        expect(output.error[0]).to.match(error)
      } else {
        expect(output.error[0]).to.equal(error)
      }
      expect(exitCode).to.equal(1)
      expect(views(dir)).to.deep.equal([])
      if (withRouter) {
        expect(router(dir)).to.equal(before)
      }
    })
  }

  it('is the only command with --route', async () => {
    const dir = createVueProject()
    const { output } = await runCommand(dir, { _: ['Card'], route: '/card' })

    expect(output.error).to.deep.equal(['Unknown option --route, see "vue-cli-service help generate:component"'])
  })
})
