import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {dirname, join, normalize, relative, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'));
const projects = catalog.projects;
const failures = [];
const fail = message => failures.push(message);

const folders = new Map();
const ids = new Set();
for (const project of projects) {
  if (ids.has(project.id)) fail(`duplicate id ${project.id}`);
  ids.add(project.id);
  for (const field of ['name', 'area', 'tier', 'track', 'input', 'output', 'quick_start', 'status', 'connection']) {
    if (!project[field]) fail(`${project.id} is missing ${field}`);
  }
  for (const field of ['feeds_into', 'depends_on', 'related']) {
    if (!Array.isArray(project[field])) fail(`${project.id} field ${field} must be an array`);
  }
  if (project.status === 'built') {
    if (!project.folder) fail(`${project.id} is built without a folder`);
    if (folders.has(project.folder)) fail(`duplicate folder ${project.folder}`);
    folders.set(project.folder, project);
    const readme = join(root, project.folder, 'README.md');
    if (!existsSync(readme)) fail(`missing ${project.folder}/README.md`);
    else {
      const text = readFileSync(readme, 'utf8');
      if (!text.includes('## How this connects')) fail(`${project.folder} README is missing How this connects`);
      if (!text.includes(`**Input → output:** ${project.input} → ${project.output}`)) {
        fail(`${project.folder} README is missing its input/output line`);
      }
    }
  } else if (project.status === 'planned') {
    if (project.folder) fail(`planned project ${project.id} must not have a folder`);
    if (project.connection !== 'planned') fail(`planned project ${project.id} must use connection planned`);
  } else {
    fail(`${project.id} has unknown status ${project.status}`);
  }
}

const inverse = new Map();
for (const project of projects) {
  for (const target of project.feeds_into ?? []) {
    if (!folders.has(target)) fail(`${project.id} feeds missing folder ${target}`);
    const list = inverse.get(target) ?? [];
    list.push(project.folder);
    inverse.set(target, list);
  }
  for (const target of project.depends_on ?? []) {
    if (!folders.has(target)) fail(`${project.id} depends on missing folder ${target}`);
  }
  for (const target of project.related ?? []) {
    const known = folders.has(target) || projects.some(item => item.id === target);
    if (!known) fail(`${project.id} related target is unknown: ${target}`);
  }
}
for (const project of projects) {
  if (!project.folder) continue;
  const expected = (inverse.get(project.folder) ?? []).slice().sort();
  const actual = (project.depends_on ?? []).slice().sort();
  if (expected.join('|') !== actual.join('|')) {
    fail(`${project.folder} depends_on ${actual.join(', ') || '∅'} does not match feeds_into inverse ${expected.join(', ') || '∅'}`);
  }
}

for (const entry of readdirSync(root, {withFileTypes: true})) {
  if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
  const readme = join(root, entry.name, 'README.md');
  if (existsSync(readme) && !folders.has(entry.name)) fail(`folder ${entry.name} has a README but is not in the catalog`);
}

const importedFolders = new Set(projects.filter(project => typeof project.id === 'number' && project.id >= 57).map(project => project.folder));
function walkImportedLicenses(directory, top) {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkImportedLicenses(path, top ?? entry.name);
    else if (top && importedFolders.has(top) && (/^license(\.|$)/i.test(entry.name) || entry.name === 'COPYING')) {
      fail(`imported folder has a license file: ${relative(root, path)}`);
    }
  }
}
walkImportedLicenses(root, null);

function stripFence(text) {
  return text.replace(/```[\s\S]*?```/g, '');
}

function checkLinks(path, text) {
  const body = stripFence(text);
  const expressions = [...body.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g), ...body.matchAll(/href="([^"]+)"/g)];
  for (const match of expressions) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith('#') || /^[a-z]+:/i.test(raw)) continue;
    const [href] = raw.split('#');
    if (!href) continue;
    const target = normalize(resolve(dirname(path), decodeURIComponent(href)));
    if (!target.startsWith(root)) {
      fail(`${relative(root, path)} links outside the repo: ${raw}`);
      continue;
    }
    if (!existsSync(target)) fail(`${relative(root, path)} has a broken relative link: ${raw}`);
  }
}

function walkMarkdown(directory) {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkMarkdown(path);
    else if (entry.name.endsWith('.md')) checkLinks(path, readFileSync(path, 'utf8'));
  }
}
walkMarkdown(root);

const readme = readFileSync(join(root, 'README.md'), 'utf8');
for (const project of projects.filter(project => project.status === 'planned')) {
  if (readme.includes(`](${project.id}/)`)) fail(`README links to planned id ${project.id} as a folder`);
}

const generated = spawnSync(process.execPath, [join(root, 'scripts', 'generate-catalog.mjs'), '--check'], {cwd: root, encoding: 'utf8'});
if (generated.status !== 0) {
  fail(generated.stderr || generated.stdout || 'catalog generator check failed');
}

if (failures.length) {
  console.error(`Catalog check failed with ${failures.length} problem(s):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log(`Catalog check passed for ${projects.length} catalog rows and ${folders.size} folders.`);
