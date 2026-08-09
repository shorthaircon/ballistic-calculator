import { calculateAngles, CHARGES, parseDistance } from './ballistics.js';

const targetPanels = [...document.querySelectorAll('.target-panel')];
const appStatus = document.querySelector('#app-status');

function createResultRows(list) {
  for (const { charge } of CHARGES) {
    const row = document.createElement('li');
    row.className = 'result-card';
    row.dataset.charge = String(charge);

    const lamp = document.createElement('span');
    lamp.className = 'charge-status-lamp';
    lamp.setAttribute('aria-hidden', 'true');

    const number = document.createElement('span');
    number.className = 'charge-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(charge).padStart(2, '0');

    const value = document.createElement('span');
    value.className = 'result-value';

    row.append(lamp, number, value);
    list.append(row);
  }
}

function clearError(input, error) {
  input.removeAttribute('aria-invalid');
  error.textContent = '';
}

function showEmptyState(panel) {
  panel.querySelector('.empty-state').hidden = false;
  panel.querySelector('.results-list').hidden = true;
}

function showError(panel, input, error) {
  input.setAttribute('aria-invalid', 'true');
  error.textContent = '請輸入 0～30 km 之間的有效距離。';
  showEmptyState(panel);
}

function renderResults(panel, distance) {
  const results = calculateAngles(distance);
  const resultCards = [...panel.querySelectorAll('.result-card')];

  for (const card of resultCards) {
    const charge = Number(card.dataset.charge);
    const result = results.find((item) => item.charge === charge);
    const value = card.querySelector('.result-value');

    card.classList.toggle('is-unavailable', !result.available);
    if (result.available) {
      value.textContent = `${result.displayAngle}°`;
      value.setAttribute('aria-label', `${charge} 發裝藥，${result.displayAngle} 度`);
    } else {
      value.textContent = '不可用';
      value.setAttribute('aria-label', `${charge} 發裝藥不可用，超過 60 度`);
    }
  }

  panel.querySelector('.empty-state').hidden = true;
  panel.querySelector('.results-list').hidden = false;
}

function updateTarget(panel) {
  const input = panel.querySelector('.distance-input');
  const error = panel.querySelector('.error-message');
  const parsed = parseDistance(input.value);

  if (parsed.state === 'empty') {
    clearError(input, error);
    showEmptyState(panel);
    return;
  }

  if (parsed.state === 'invalid') {
    showError(panel, input, error);
    return;
  }

  clearError(input, error);
  renderResults(panel, parsed.distance);
}

for (const panel of targetPanels) {
  const input = panel.querySelector('.distance-input');
  const clearButton = panel.querySelector('[data-clear-distance]');
  const list = panel.querySelector('.results-list');
  createResultRows(list);
  input.value = '';
  input.addEventListener('input', () => updateTarget(panel));
  clearButton.addEventListener('mousedown', (event) => event.preventDefault());
  clearButton.addEventListener('click', () => {
    input.value = '';
    updateTarget(panel);
    input.focus({ preventScroll: true });
  });
  showEmptyState(panel);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./sw.js');
      appStatus.textContent = '已啟用離線功能 · 不會儲存資料';
    } catch {
      appStatus.textContent = '本機計算 · 離線功能尚未啟用';
    }
  });
}
