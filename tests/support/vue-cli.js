// Fake Vue CLI APIs and a temporary project, to run the plugin like vue add / vue-cli-service do
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const prompts = require('prompts')

const root = path.join(__dirname, '..', '..')

// Undone after each test: temporary projects, stubbed methods
const cleanups = []

// Mocha root hooks (loaded by .mocharc.json)
const mochaHooks = {
  afterEach() {
    while (cleanups.length) {
      cleanups.pop()()
    }
  }
}

// A temporary project with this package.json, removed after the test
function createProject(pkg = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'component-generator-'))
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2))
  cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}

// Entry of a Vue CLI project, for each Vue version
const mainJs = {
  2: "import Vue from 'vue'\nimport App from './App.vue'\n\nnew Vue({\n  render: h => h(App),\n}).$mount('#app')\n",
  3: "import { createApp } from 'vue'\nimport App from './App.vue'\n\ncreateApp(App).mount('#app')\n"
}

// A temporary Vue CLI project of this Vue version (vue in its dependencies, src/main.js, src/App.vue)
function createVueProject(vue = 3, pkg = { dependencies: { vue: vue === 2 ? '^2.6.14' : '^3.2.13' } }) {
  const dir = createProject(pkg)
  fs.mkdirSync(path.join(dir, 'src'))
  fs.writeFileSync(path.join(dir, 'src', 'main.js'), mainJs[vue])
  fs.writeFileSync(path.join(dir, 'src', 'App.vue'), '<template>\n  <div id="app"></div>\n</template>\n')
  return dir
}

// src/router/index.js of a Vue CLI 5 project, for each Vue version
const routers = {
  2: `import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
`,
  3: `import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
`
}

// Add the router of a Vue CLI project of this Vue version, returns its content
function addRouter(dir, vue = 3) {
  fs.mkdirSync(path.join(dir, 'src', 'router'))
  fs.writeFileSync(path.join(dir, 'src', 'router', 'index.js'), routers[vue])
  return routers[vue]
}

// Replace object[method] until the end of the test; returns the arguments of each call
function stub(object, method) {
  const original = object[method]
  const calls = []
  object[method] = (...args) => { calls.push(args) }
  cleanups.push(() => { object[method] = original })
  return calls
}

// Every file under dir, as { 'relative/path': content }
function readTree(dir) {
  const files = {}
  for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) {
      const file = path.join(entry.parentPath, entry.name)
      files[path.relative(dir, file).split(path.sep).join('/')] = fs.readFileSync(file, 'utf8')
    }
  }
  return files
}

// The questions vue add asks for this project's package.json
function installQuestions(pkg = {}) {
  return require(path.join(root, 'prompts.js'))(pkg)
}

// The fields vue add merges into the project's package.json, for these answers
function runGenerator(answers) {
  const extended = []
  require(path.join(root, 'generator'))({ extendPackage: (fields) => extended.push(fields) }, answers, {})
  return extended
}

// Run a command of the plugin (generate:component by default) for the project, from cwd (the project by default),
// like vue-cli-service does; promptAnswers are injected in the prompts (name, override).
// Returns the command, what it printed (log, warn, error: the lines) and its exit code
async function runCommand(dir, args = {}, promptAnswers = [], { cwd = dir, name = 'generate:component' } = {}) {
  const commands = {}
  const api = {
    registerCommand: (name, options, fn) => (commands[name] = { name, options, fn }),
    service: { context: dir, pkg: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) }
  }
  require(path.join(root, 'index.js'))(api)
  const command = commands[name]

  const output = { log: stub(console, 'log'), warn: stub(console, 'warn'), error: stub(console, 'error') }
  const previous = { cwd: process.cwd(), exitCode: process.exitCode }
  process.chdir(cwd)
  process.exitCode = undefined
  try {
    prompts.inject(promptAnswers)
    await command.fn({ _: [], ...args })
    return { command, output: lines(output), exitCode: process.exitCode }
  } finally {
    process.chdir(previous.cwd)
    process.exitCode = previous.exitCode
  }
}

// What each console method printed, one line per call
function lines(output) {
  return Object.fromEntries(Object.entries(output).map(([method, calls]) => [method, calls.map((args) => args.join(' '))]))
}

module.exports = { mochaHooks, createProject, createVueProject, addRouter, stub, readTree, installQuestions, runGenerator, runCommand }
