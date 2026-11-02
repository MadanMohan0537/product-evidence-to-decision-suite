import {existsSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, normalize, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'catalog.json');
const checkOnly = process.argv.includes('--check');

const AREA_ORDER = ['product_management', 'ai_engineering', 'data_analytics'];
const AREA_LABEL = {
  product_management: 'Product management',
  ai_engineering: 'AI engineering',
  data_analytics: 'Data analytics',
};
const TIER_ORDER = ['starter', 'advanced', 'connected'];
const TIER_LABEL = {
  starter: 'Starter',
  advanced: 'Advanced',
  connected: 'Connected workflow',
};

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const projects = catalog.projects;
const byFolder = new Map(projects.filter(project => project.folder).map(project => [project.folder, project]));

function numericId(project) {
  return typeof project.id === 'number' ? project.id : Number.MAX_SAFE_INTEGER;
}

function linkTo(fromFolder, project) {
  if (!project?.folder) return null;
  const href = fromFolder ? join('..', project.folder, 'README.md') : `${project.folder}/`;
  return `[${project.name}](${href.replaceAll('\\', '/')})`;
}

function resolveProject(key) {
  return byFolder.get(key) ?? projects.find(project => project.id === key) ?? null;
}

function describeList(fromFolder, keys) {
  const items = [];
  const seen = new Set();
  for (const key of keys) {
    const project = resolveProject(key);
    if (!project || seen.has(project.id)) continue;
    seen.add(project.id);
    if (project.status === 'built' && project.folder) items.push(linkTo(fromFolder, project));
    else items.push(`${project.name} *(planned, not in the repo)*`);
  }
  return items.length ? items.join('; ') : 'None in this catalog.';
}

function linkedKeys(project, field) {
  const own = project[field] ?? [];
  const inverse = [];
  for (const other of projects) {
    const values = other[field] ?? [];
    const pointsHere = (project.folder && values.includes(project.folder)) || values.includes(project.id);
    if (!pointsHere) continue;
    inverse.push(other.folder ?? other.id);
  }
  return [...own, ...inverse].filter(key => key !== project.folder && key !== project.id);
}

function hubSentence(project) {
  if (project.folder === 'experiment-data-quality-auditor') {
    return 'This is the connected Worker. It imports projects 1–6 and the engines behind projects 8–56. Imported folders numbered 57 and above are not part of that Worker.';
  }
  if (project.connection === 'wired') {
    return `Imported by the ${linkTo(project.folder, byFolder.get('experiment-data-quality-auditor'))}.`;
  }
  return 'Not imported by the Project 7 Worker. Links in this section are intended portfolio handoffs, not runtime imports.';
}

function ioBlock(project) {
  const tier = TIER_LABEL[project.tier] ?? project.tier;
  return [
    '<!-- catalog:io:start -->',
    `**Input → output:** ${project.input} → ${project.output}`,
    '',
    `**Quick start:** \`${project.quick_start}\``,
    '',
    `**Track:** ${project.track} · ${tier} · ${project.status}`,
    '<!-- catalog:io:end -->',
  ].join('\n');
}

function connectsBlock(project) {
  const upstream = project.depends_on ?? [];
  const downstream = project.feeds_into ?? [];
  const related = linkedKeys(project, 'related');
  return [
    '<!-- catalog:connects:start -->',
    '## How this connects',
    '',
    `**Input → output:** ${project.input} → ${project.output}`,
    '',
    `**Upstream:** ${describeList(project.folder, upstream)}`,
    '',
    `**Downstream:** ${describeList(project.folder, downstream)}`,
    '',
    `**Related:** ${describeList(project.folder, related)}`,
    '',
    `**Track:** ${project.track} · ${TIER_LABEL[project.tier] ?? project.tier}.`,
    '',
    `**Project 7:** ${hubSentence(project)}`,
    '<!-- catalog:connects:end -->',
  ].join('\n');
}

function insertIo(text, block) {
  if (text.includes('<!-- catalog:io:start -->')) {
    return text.replace(/<!-- catalog:io:start -->[\s\S]*?<!-- catalog:io:end -->/, block);
  }
  if (text.startsWith('<div')) {
    const end = text.indexOf('</div>');
    if (end !== -1) {
      const at = end + '</div>'.length;
      return `${text.slice(0, at)}\n\n${block}\n${text.slice(at)}`;
    }
  }
  const lines = text.split('\n');
  const heading = lines.findIndex(line => line.startsWith('#'));
  if (heading === -1) return `${block}\n\n${text}`;
  lines.splice(heading + 1, 0, '', block, '');
  return lines.join('\n');
}

function insertConnects(text, block) {
  if (text.includes('<!-- catalog:connects:start -->')) {
    return text.replace(/<!-- catalog:connects:start -->[\s\S]*?<!-- catalog:connects:end -->/, block);
  }
  return `${text.replace(/\s*$/, '')}\n\n${block}\n`;
}

function replaceMarker(text, name, body) {
  const start = `<!-- catalog:${name}:start -->`;
  const end = `<!-- catalog:${name}:end -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(text)) {
    throw new Error(`README.md is missing ${start}`);
  }
  return text.replace(pattern, `${start}\n${body.trim()}\n${end}`);
}

function mermaidLabel(project) {
  return `${project.id} ${project.name.replaceAll('"', "'").replaceAll('&', 'and').replaceAll('[', '(').replaceAll(']', ')')}`;
}

function row(project) {
  const name = project.folder ? `[${project.name}](${project.folder}/)` : `${project.name} *(planned)*`;
  const id = typeof project.id === 'number' ? String(project.id) : '—';
  const quick = `\`${project.quick_start}\``;
  return `| ${id} | ${name} | ${project.input} → ${project.output} | ${quick} | ${project.track} |`;
}

function sectionTable(area, tier, status) {
  const rows = projects
    .filter(project => project.area === area && project.tier === tier && project.status === status)
    .sort((a, b) => numericId(a) - numericId(b) || String(a.name).localeCompare(String(b.name)));
  if (!rows.length) return '';
  return [
    `| # | Project | Input → output | Quick start | Track |`,
    `|---:|---|---|---|---|`,
    ...rows.map(row),
  ].join('\n');
}

function counts() {
  const lines = ['| Area | Built | Planned in this catalog |', '|---|---:|---:|'];
  for (const area of AREA_ORDER) {
    const built = projects.filter(project => project.area === area && project.status === 'built').length;
    const planned = projects.filter(project => project.area === area && project.status === 'planned').length;
    lines.push(`| ${AREA_LABEL[area]} | ${built} | ${planned} |`);
  }
  const built = projects.filter(project => project.status === 'built').length;
  const planned = projects.filter(project => project.status === 'planned').length;
  lines.push(`| **Catalog total** | **${built}** | **${planned}** |`);
  return lines.join('\n');
}

function mermaid(area) {
  const subset = projects.filter(project => project.area === area && project.status === 'built');
  const ids = new Map(subset.map(project => [project.folder, `n${project.id}`]));
  const lines = ['```mermaid', 'flowchart LR'];
  for (const tier of TIER_ORDER) {
    const group = subset.filter(project => project.tier === tier);
    if (!group.length) continue;
    lines.push(`  subgraph ${area}_${tier} [${AREA_LABEL[area]} · ${TIER_LABEL[tier]}]`);
    for (const project of group) {
      lines.push(`    ${ids.get(project.folder)}["${mermaidLabel(project)}"]`);
    }
    lines.push('  end');
  }
  for (const project of subset) {
    for (const target of project.feeds_into ?? []) {
      if (!ids.has(target)) continue;
      const arrow = project.connection === 'planned' || byFolder.get(target).connection === 'planned' ? '-.->' : '-->';
      lines.push(`  ${ids.get(project.folder)} ${arrow} ${ids.get(target)}`);
    }
  }
  lines.push('```');
  return lines.join('\n');
}

function crossMermaid() {
  const lines = ['```mermaid', 'flowchart LR'];
  const seen = new Set();
  for (const project of projects) {
    if (project.status !== 'built') continue;
    for (const target of project.feeds_into ?? []) {
      const other = byFolder.get(target);
      if (!other || other.area === project.area) continue;
      const left = `x${project.id}`;
      const right = `x${other.id}`;
      if (!seen.has(left)) {
        lines.push(`  ${left}["${mermaidLabel(project)}"]`);
        seen.add(left);
      }
      if (!seen.has(right)) {
        lines.push(`  ${right}["${mermaidLabel(other)}"]`);
        seen.add(right);
      }
      const arrow = project.connection === 'planned' || other.connection === 'planned' ? '-.->' : '-->';
      lines.push(`  ${left} ${arrow} ${right}`);
    }
  }
  lines.push('```');
  return lines.join('\n');
}

function tracksMarkdown() {
  const parts = [];
  parts.push('## Tracks');
  parts.push('');
  parts.push('Projects already in the repo are grouped by area and tier. The quick start is the command for that folder. [ROADMAP_50_DAYS.md](ROADMAP_50_DAYS.md) is the separate proposal for projects that are not built yet. Planned rows in this catalog are gaps only; they are not folders.');
  parts.push('');
  parts.push(counts());
  parts.push('');
  parts.push('Solid arrows in the maps are the connected product-management lifecycle already imported by Project 7. Dotted arrows are intended handoffs. Dotted arrows are not Worker imports, and a downstream project does not read the upstream project’s files.');
  parts.push('');
  for (const area of AREA_ORDER) {
    parts.push(`### ${AREA_LABEL[area]}`);
    parts.push('');
    for (const tier of TIER_ORDER) {
      const built = sectionTable(area, tier, 'built');
      const planned = sectionTable(area, tier, 'planned');
      if (!built && !planned) continue;
      parts.push(`#### ${TIER_LABEL[tier]}`);
      parts.push('');
      if (built) {
        parts.push(built);
        parts.push('');
      }
      if (planned) {
        parts.push('Planned. Not built, and not a folder in this repo:');
        parts.push('');
        parts.push(planned);
        parts.push('');
      }
    }
    parts.push(mermaid(area));
    parts.push('');
  }
  parts.push('### Cross-area handoffs');
  parts.push('');
  parts.push(crossMermaid());
  parts.push('');
  return parts.join('\n');
}

function honestMarkdown() {
  const imported = projects.filter(project => typeof project.id === 'number' && project.id >= 57);
  const lines = [
    '## Imported folder status',
    '',
    'These rows cover folders 57 and above. They do not change the Project 1–56 behavior described above.',
    '',
    '| Folder group | Current behavior |',
    '|---|---|',
    `| AI engineering imports (${imported.filter(project => project.area === 'ai_engineering').length} folders) | Standalone code with the tests shipped in that folder. Not imported by the Project 7 Worker. |`,
    `| Product management imports (${imported.filter(project => project.area === 'product_management').length} folders) | Standalone code. Overlapping A/B, discovery, feedback, and roadmap tools are cross-linked in the catalog rather than copied into Project 7. |`,
    `| Data analytics imports (${imported.filter(project => project.area === 'data_analytics').length} folders) | Standalone code. Metric, contract, drift, fairness, and review tools do not replace Projects 2, 5, 8, or 10. |`,
    '| Intended links | Documented in each folder under How this connects and drawn as dotted arrows. Not executed by the connected Worker. |',
    '| Planned catalog rows | Names only. No folder, tests, or UI. The full proposal is ROADMAP_50_DAYS.md. |',
  ];
  return lines.join('\n');
}

function foldersMarkdown() {
  const lines = ['Imported and existing catalog folders:', ''];
  for (const project of projects.filter(project => project.folder).sort((a, b) => numericId(a) - numericId(b))) {
    lines.push(`- \`${project.folder}/\` — ${project.id}. ${project.name} (${project.track}, ${TIER_LABEL[project.tier]})`);
  }
  return lines.join('\n');
}

function updateReadme(text) {
  let next = text;
  next = replaceMarker(next, 'tracks', tracksMarkdown());
  next = replaceMarker(next, 'honest', honestMarkdown());
  next = replaceMarker(next, 'folders', foldersMarkdown());
  return next;
}

function updateProjectReadme(project, text) {
  let next = insertIo(text, ioBlock(project));
  next = insertConnects(next, connectsBlock(project));
  return next.endsWith('\n') ? next : `${next}\n`;
}

const readmePath = join(root, 'README.md');
const originalReadme = readFileSync(readmePath, 'utf8');
const nextReadme = updateReadme(originalReadme);
const projectWrites = [];
for (const project of projects) {
  if (!project.folder) continue;
  const path = join(root, project.folder, 'README.md');
  if (!existsSync(path)) throw new Error(`Missing README for ${project.folder}`);
  const original = readFileSync(path, 'utf8');
  const next = updateProjectReadme(project, original);
  projectWrites.push({path, original, next});
}

if (checkOnly) {
  const drift = [];
  if (nextReadme !== originalReadme) drift.push('README.md');
  for (const file of projectWrites) {
    if (file.next !== file.original) drift.push(relative(root, file.path));
  }
  if (drift.length) {
    console.error(`Catalog drift in ${drift.length} file(s):`);
    for (const file of drift.slice(0, 30)) console.error(`  ${file}`);
    process.exit(1);
  }
  console.log('Catalog markdown matches catalog.json');
} else {
  if (nextReadme !== originalReadme) writeFileSync(readmePath, nextReadme);
  for (const file of projectWrites) {
    if (file.next !== file.original) writeFileSync(file.path, file.next);
  }
  console.log(`Updated README and ${projectWrites.length} project README files from catalog.json`);
}
