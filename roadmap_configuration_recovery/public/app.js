const form = document.querySelector('#recovery');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
form.addEventListener('submit', async event => {
  event.preventDefault();
  result.textContent = '';
  status.textContent = 'Verifying evidence…';
  try {
    const file = form.elements.file.files[0];
    if (!file || file.size > 2_000_000) throw new Error('Choose a JSON file under 2 MB.');
    const payload = JSON.parse(await file.text());
    const response = await fetch('/api/configuration-recovery', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${form.elements.token.value}`},
      body: JSON.stringify(payload),
    });
    const report = await response.json();
    if (!response.ok) throw new Error(report.error || 'Verification failed.');
    result.textContent = JSON.stringify(report, null, 2);
    status.textContent = 'Evidence assessed. No configuration or incident state was changed.';
  } catch (error) {
    status.textContent = error.message;
  }
});
