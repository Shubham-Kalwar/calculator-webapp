// Initialize default theme
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const clickSound = document.getElementById('clickSound');
const display = document.getElementById('display');
const historyList = document.getElementById('historyList');

let expression = '';
let history = [];
let isResultShown = false;

// Unit converter data
const unitData = {
  length: {
    units: {
      meter: 1,
      kilometer: 0.001,
      centimeter: 100,
      millimeter: 1000,
      mile: 0.000621371,
      yard: 1.09361,
      foot: 3.28084,
      inch: 39.3701
    },
    defaultFrom: 'meter',
    defaultTo: 'kilometer'
  },
  weight: {
    units: {
      kilogram: 1,
      gram: 1000,
      milligram: 1e6,
      pound: 2.20462,
      ounce: 35.274
    },
    defaultFrom: 'kilogram',
    defaultTo: 'pound'
  },
  temperature: {
    units: {
      celsius: 'celsius',
      fahrenheit: 'fahrenheit',
      kelvin: 'kelvin'
    },
    defaultFrom: 'celsius',
    defaultTo: 'fahrenheit'
  }
};

const unitCategory = document.getElementById('unitCategory');
const unitFrom = document.getElementById('unitFrom');
const unitTo = document.getElementById('unitTo');
const unitInput = document.getElementById('unitInput');
const convertBtn = document.getElementById('convertBtn');
const conversionResult = document.getElementById('conversionResult');

// Helper functions for temperature conversion
function temperatureConvert(value, from, to) {
  if (from === to) return value;
  if (from === 'celsius') {
    if (to === 'fahrenheit') return (value * 9/5) + 32;
    if (to === 'kelvin') return value + 273.15;
  }
  if (from === 'fahrenheit') {
    if (to === 'celsius') return (value - 32) * 5/9;
    if (to === 'kelvin') return (value - 32) * 5/9 + 273.15;
  }
  if (from === 'kelvin') {
    if (to === 'celsius') return value - 273.15;
    if (to === 'fahrenheit') return (value - 273.15) * 9/5 + 32;
  }
}

// Initialize theme from localStorage
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  body.classList.remove('light', 'dark');
  body.classList.add(savedTheme);
  themeToggle.checked = savedTheme === 'dark';
  themeLabel.textContent = savedTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
  themeToggle.setAttribute('aria-checked', themeToggle.checked);
}

// Toggle theme and save to localStorage
themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    body.classList.replace('light', 'dark');
    themeLabel.textContent = 'Dark Mode';
    themeToggle.setAttribute('aria-checked', 'true');
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.replace('dark', 'light');
    themeLabel.textContent = 'Light Mode';
    themeToggle.setAttribute('aria-checked', 'false');
    localStorage.setItem('theme', 'light');
  }
  playClickSound();
});

// Plays a click sound if available
function playClickSound() {
  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play();
  }
}

// Update the calculator display safely
function updateDisplay(text) {
  display.value = text || '0';
}

// Add to history and update history UI
function addToHistory(expr, result) {
  history.unshift({ expr, result });
  if (history.length > 20) history.pop();
  renderHistory();
  saveHistory();
}

// Render history list to UI
function renderHistory() {
  historyList.innerHTML = '';
  history.forEach(({expr, result}, index) => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.textContent = `${expr} = ${result}`;
    li.setAttribute('aria-label', `History item: ${expr} equals ${result}`);
    li.addEventListener('click', () => {
      expression = result.toString();
      updateDisplay(expression);
    });
    historyList.appendChild(li);
  });
}

// Save history to localStorage
function saveHistory() {
  localStorage.setItem('calcHistory', JSON.stringify(history));
}

// Load history from localStorage
function loadHistory() {
  const saved = localStorage.getItem('calcHistory');
  if (saved) {
    history = JSON.parse(saved);
    renderHistory();
  }
}

// Calculator button handling
document.querySelector('.buttons-grid').addEventListener('click', e => {
  if (!e.target.classList.contains('button')) return;
  const action = e.target.dataset.action;
  const value = e.target.dataset.value;

  playClickSound();

  if (action === 'number' || action === 'decimal') {
    if (isResultShown) {
      expression = value;
      isResultShown = false;
    } else {
      expression += value;
    }
    updateDisplay(expression);
  }

  else if (action === 'operator' || action === 'paren') {
    if (isResultShown) isResultShown = false;
    expression += value;
    updateDisplay(expression);
  }

  else if (action === 'sci') {
    // Insert function name with opening parenthesis for user
    expression += value + '(';
    updateDisplay(expression);
  }

  else if (action === 'clear') {
    expression = '';
    updateDisplay('');
  }

  else if (action === 'backspace') {
    if (!isResultShown && expression.length > 0) {
      expression = expression.slice(0, -1);
      updateDisplay(expression);
    }
  }

  else if (action === 'equal') {
    try {
      // Use mathjs to parse and evaluate the expression
      let result = math.evaluate(expression);
      if (typeof result === 'function') {
        throw new Error('Invalid result');
      }
      if (typeof result === 'number' && !Number.isFinite(result)) {
        throw new Error('Math error');
      }
      result = +result.toPrecision(12);
      addToHistory(expression, result);
      expression = result.toString();
      updateDisplay(expression);
      isResultShown = true;
    } catch (err) {
      updateDisplay('Error');
      expression = '';
      isResultShown = true;
    }
  }
});

// Keyboard support for calculator
window.addEventListener('keydown', e => {
  const allowedKeys = '0123456789+-*/().^';
  if (allowedKeys.includes(e.key)) {
    document.querySelector(`.button[data-action="number"][data-value="${e.key}"], 
      .button[data-action="operator"][data-value="${e.key}"], 
      .button[data-action="paren"][data-value="${e.key}"], 
      .button[data-action="decimal"][data-value="${e.key}"], 
      .button[data-action="sci"][data-value="${e.key}"]`)?.click() || (function() {
        expression += e.key;
        updateDisplay(expression);
      })();
    e.preventDefault();
  }
  if (e.key === 'Enter' || e.key === '=') {
    document.querySelector('.button.equal').click();
    e.preventDefault();
  }
  if (e.key === 'Backspace') {
    document.querySelector('.button.backspace').click();
    e.preventDefault();
  }
  if (e.key.toLowerCase() === 'c') {
    document.querySelector('.button.clear').click();
    e.preventDefault();
  }
});

// Initialize unit converter selects
function populateUnits(category) {
  unitFrom.innerHTML = '';
  unitTo.innerHTML = '';
  const units = unitData[category].units;
  for (const unit in units) {
    const optionFrom = document.createElement('option');
    optionFrom.value = unit;
    optionFrom.textContent = unit;
    if(unit === unitData[category].defaultFrom) optionFrom.selected = true;
    unitFrom.appendChild(optionFrom);
    const optionTo = optionFrom.cloneNode(true);
    if(unit === unitData[category].defaultTo) optionTo.selected = true;
    unitTo.appendChild(optionTo);
  }
  conversionResult.textContent = '';
}
unitCategory.addEventListener('change', () => {
  populateUnits(unitCategory.value);
  unitInput.value = '';
  conversionResult.textContent = '';
});
convertBtn.addEventListener('click', () => {
  const fromUnit = unitFrom.value;
  const toUnit = unitTo.value;
  let value = parseFloat(unitInput.value);
  if (isNaN(value)) {
    conversionResult.textContent = 'Please enter a valid number.';
    return;
  }
  let result;
  if (unitCategory.value === 'temperature') {
    result = temperatureConvert(value, fromUnit, toUnit);
  } else {
    // Convert input to base unit
    const baseValue = value / unitData[unitCategory.value].units[fromUnit];
    result = baseValue * unitData[unitCategory.value].units[toUnit];
  }
  conversionResult.textContent = `${value} ${fromUnit} = ${result.toFixed(6)} ${toUnit}`;
});

// Accessibility: Keyboard navigation for history items
historyList.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const selected = document.activeElement;
    if (selected && selected.tagName === 'LI') {
      expression = selected.textContent.split('=')[1].trim();
      updateDisplay(expression);
    }
  }
});

// Initialization on page load
window.onload = () => {
  loadTheme();
  loadHistory();
  populateUnits(unitCategory.value);
  updateDisplay('');
};
