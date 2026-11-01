// Fake Vue CLI APIs and a temporary project, to run the plugin like vue add / vue-cli-service do
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const prompts = require('prompts')

const root = path.join(__dirname, '..', '..')

// A temporary project with this package.json, removed after the test
function createProject(t, pkg = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'component-generator-'))
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
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

// Run generate:component for the project, from cwd (the project by default);
// promptAnswers are injected in the prompts (name, override)
async function runCommand(t, dir, args = {}, promptAnswers = [], cwd = dir) {
  let command
  const api = {
    registerCommand: (name, options, fn) => (command = { name, options, fn }),
    resolve: (file) => path.resolve(dir, file),
    getCwd: () => dir,
    service: { context: dir, pkg: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) }
  }
  require(path.join(root, 'index.js'))(api)

  const previous = process.cwd()
  process.chdir(cwd)
  try {
    prompts.inject(promptAnswers)
    await command.fn({ _: [], ...args })
  } finally {
    process.chdir(previous)
  }
  return command
}

module.exports = { createProject, readTree, installQuestions, runGenerator, runCommand }
