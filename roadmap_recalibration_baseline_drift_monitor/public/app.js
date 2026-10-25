const form = document.querySelector('#assessment');
const message = document.querySelector('#message');
const results = document.querySelector('#results');
const metrics = document.querySelector('#metrics');
const checks = document.querySelector('#checks');
const report = document.querySelector('#report');

function element(name, text, className) {
  const node = document.createElement(name);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  message.textContent = 'Assessing configuration evidence…';
  results.hidden = true;
  try {
    const file = form.elements.file.files[0];
    if (!file || file.size > 2_000_000) throw new Error('Choose a JSON file under 2 MB.');
    const payload = JSON.parse(await file.text());
    const response = await fetch('/api/roadmap-recalibration-baseline-drift', {
      method: 'POST',
      headers: {'Authorization': `Bearer ${form.elements.token.value}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Assessment failed.');
    metrics.replaceChildren();
    const values = {Status: result.status, Snapshots: result.summary.snapshots, Aligned: result.summary.alignedSnapshots, Drifted: result.summary.driftSnapshots, Consumers: result.summary.driftedConsumers.length};
    for (const [label, value] of Object.entries(values)) {
      const tile = element('div', undefined, 'metric');
      tile.append(element('strong', String(value)), element('span', label));
      metrics.append(tile);
    }
    checks.replaceChildren(...result.checks.map(item => {
      const card = element('article', undefined, `check${item.passed ? '' : ' fail'}`);
      card.append(element('strong', `${item.passed ? 'Pass' : 'Review'} · ${item.id}`), element('p', item.detail, 'muted'));
      return card;
    }));
    report.textContent = JSON.stringify(result, null, 2);
    results.hidden = false;
    message.textContent = 'Assessment complete. No configuration or product state was changed.';
  } catch (error) {
    message.textContent = error.message;
  }
});
