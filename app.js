import { calculateAngles, CHARGES, parseDistance } from './ballistics.js';

const targetPanels = [...document.querySelectorAll('.target-panel')];
const appStatus = document.querySelector('#app-status');
const keypadLayer = document.querySelector('#keypad-layer');
const keypadDisplay = document.querySelector('#keypad-display');
const keypadTitle = document.querySelector('#keypad-title');
let activeInput = null;

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

function syncKeypadDisplay() {
  keypadDisplay.textContent = activeInput?.value || '0.00';
}

function openKeypad(input) {
  activeInput = input;
  const targetNumber = input.closest('.target-panel').dataset.target;
  keypadTitle.textContent = `輸入目標 ${targetNumber} 距離`;
  keypadLayer.hidden = false;
  document.body.classList.add('keypad-open');
  input.setAttribute('aria-expanded', 'true');
  syncKeypadDisplay();
  requestAnimationFrame(() => {
    input.scrollIntoView({ block: 'center' });
  });
}

function closeKeypad() {
  if (activeInput) activeInput.setAttribute('aria-expanded', 'false');
  keypadLayer.hidden = true;
  document.body.classList.remove('keypad-open');
}

function setActiveValue(value) {
  if (!activeInput) return;
  activeInput.value = value;
  activeInput.dispatchEvent(new Event('input', { bubbles: true }));
  syncKeypadDisplay();
}

function pressKey(key) {
  if (!activeInput) return;
  const current = activeInput.value;

  if (/^\d$/.test(key)) {
    if (current.length >= 6) return;
    setActiveValue(current === '0' ? key : `${current}${key}`);
    return;
  }

  if (key === 'decimal') {
    if (!current.includes('.') && !current.includes(',')) {
      setActiveValue(current ? `${current}.` : '0.');
    }
    return;
  }

  if (key === 'backspace') {
    setActiveValue(current.slice(0, -1));
    return;
  }

  if (key === 'clear') {
    setActiveValue('');
    return;
  }

  if (key === 'done') closeKeypad();
}

for (const panel of targetPanels) {
  const input = panel.querySelector('.distance-input');
  const inputControl = panel.querySelector('.distance-field__control');
  const clearButton = panel.querySelector('[data-clear-distance]');
  const list = panel.querySelector('.results-list');
  createResultRows(list);
  input.value = '';
  input.addEventListener('input', () => updateTarget(panel));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openKeypad(input);
    }
  });
  inputControl.addEventListener('click', () => openKeypad(input));
  clearButton.addEventListener('mousedown', (event) => event.preventDefault());
  clearButton.addEventListener('click', () => {
    input.value = '';
    updateTarget(panel);
    input.focus({ preventScroll: true });
    openKeypad(input);
  });
  showEmptyState(panel);
}

keypadLayer.querySelector('[data-keypad-close]').addEventListener('click', closeKeypad);

for (const button of keypadLayer.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', (event) => event.preventDefault());
  button.addEventListener('click', () => pressKey(button.dataset.key));
}

document.addEventListener('keydown', (event) => {
  if (keypadLayer.hidden || !activeInput) return;

  if (/^\d$/.test(event.key)) {
    event.preventDefault();
    pressKey(event.key);
  } else if (event.key === '.' || event.key === ',') {
    event.preventDefault();
    pressKey('decimal');
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    pressKey('backspace');
  } else if (event.key === 'Delete') {
    event.preventDefault();
    pressKey('clear');
  } else if (event.key === 'Enter') {
    event.preventDefault();
    pressKey('done');
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeKeypad();
  }
});

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
