
const display = document.getElementById('displayValue');
const expression = document.getElementById('expression');
const opIndicator = document.getElementById('opIndicator');
 
let state = {
    current: '0',
    previous: null,
    operator: null,
    shouldResetDisplay: false,
    justCalculated: false,
  };
 
  function updateDisplay(val, isError = false) {
    display.classList.toggle('error', isError);
    display.textContent = val;
  }
 
  function flashDisplay() {
    display.classList.add('flash');
    setTimeout(() => display.classList.remove('flash'), 200);
  }
 
  function updateExpression() {
    if (state.previous !== null && state.operator) {
      expression.textContent = `${format(state.previous)} ${state.operator}`;
    } else {
      expression.textContent = '';
    }
    opIndicator.textContent = state.operator ? `OP: ${state.operator}` : '';
    opIndicator.classList.toggle('active', !!state.operator);
  }
 
  function format(num) {
    if (isNaN(num) || !isFinite(num)) return num;
    const n = parseFloat(num);
    if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-6 && n !== 0)) {
      return n.toExponential(4);
    }
    // Limit decimal places to avoid floating-point noise
    const str = parseFloat(n.toPrecision(12)).toString();
    return str;
  }
 
  function inputDigit(digit) {
    if (state.shouldResetDisplay || state.justCalculated) {
      state.current = digit;
      state.shouldResetDisplay = false;
      state.justCalculated = false;
    } else {
      state.current = state.current === '0' ? digit : state.current + digit;
      if (state.current.replace('-', '').length > 15) return; // cap length
    }
    updateDisplay(state.current);
    updateExpression();
  }
 
  function inputDecimal() {
    if (state.shouldResetDisplay || state.justCalculated) {
      state.current = '0.';
      state.shouldResetDisplay = false;
      state.justCalculated = false;
    } else if (!state.current.includes('.')) {
      state.current += '.';
    }
    updateDisplay(state.current);
    updateExpression();
  }
 
  function inputOperator(op) {
    const cur = parseFloat(state.current);
 
    // Chain operations
    if (state.operator && !state.shouldResetDisplay && !state.justCalculated) {
      const result = calculate(parseFloat(state.previous), cur, state.operator);
      if (result === null) return;
      state.previous = format(result);
      state.current = format(result);
      updateDisplay(state.current);
    } else {
      state.previous = state.current;
    }
 
    state.operator = op;
    state.shouldResetDisplay = true;
    state.justCalculated = false;
    updateExpression();
  }
 
  function calculate(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷':
        if (b === 0) {
          updateDisplay('Cannot ÷ 0', true);
          expression.textContent = '';
          opIndicator.textContent = '';
          state = { current: '0', previous: null, operator: null, shouldResetDisplay: true, justCalculated: false };
          return null;
        }
        return a / b;
    }
    return b;
  }
 
  function doEquals() {
    if (!state.operator || state.previous === null) return;
 
    const a = parseFloat(state.previous);
    const b = parseFloat(state.current);
    const result = calculate(a, b, state.operator);
    if (result === null) return;
 
    const formatted = format(result);
    expression.textContent = `${format(a)} ${state.operator} ${format(b)} =`;
    flashDisplay();
    state.current = formatted;
    state.previous = null;
    state.operator = null;
    state.justCalculated = true;
    state.shouldResetDisplay = false;
    opIndicator.textContent = '';
    opIndicator.classList.remove('active');
    updateDisplay(formatted);
  }
 
  function doPercent() {
    const val = parseFloat(state.current);
    if (state.operator && state.previous !== null) {
      // e.g. 200 + 5% → 200 + (200 * 5/100) = 210
      const base = parseFloat(state.previous);
      state.current = format(base * val / 100);
    } else {
      state.current = format(val / 100);
    }
    state.shouldResetDisplay = false;
    state.justCalculated = false;
    updateDisplay(state.current);
    updateExpression();
  }
 
  function doBackspace() {
    if (state.shouldResetDisplay || state.justCalculated) return;
    if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith('-'))) {
      state.current = '0';
    } else {
      state.current = state.current.slice(0, -1);
    }
    updateDisplay(state.current);
  }
 
  function doClear() {
    state = { current: '0', previous: null, operator: null, shouldResetDisplay: false, justCalculated: false };
    updateDisplay('0');
    expression.textContent = '';
    opIndicator.textContent = '';
    opIndicator.classList.remove('active');
  }
 
  // Button clicks
  document.querySelector('.buttons').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const { action, value } = btn.dataset;
 
    switch (action) {
      case 'digit':    inputDigit(value); break;
      case 'decimal':  inputDecimal(); break;
      case 'operator': inputOperator(value); break;
      case 'equals':   doEquals(); break;
      case 'clear':    doClear(); break;
      case 'backspace':doBackspace(); break;
      case 'percent':  doPercent(); break;
    }
  });
 
  // Keyboard support
  document.addEventListener('keydown', e => {
    if (e.key >= '0' && e.key <= '9') { e.preventDefault(); inputDigit(e.key); }
    else if (e.key === '.') { e.preventDefault(); inputDecimal(); }
    else if (e.key === '+') { e.preventDefault(); inputOperator('+'); }
    else if (e.key === '-') { e.preventDefault(); inputOperator('−'); }
    else if (e.key === '*') { e.preventDefault(); inputOperator('×'); }
    else if (e.key === '/') { e.preventDefault(); inputOperator('÷'); }
    else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); doEquals(); }
    else if (e.key === 'Escape') { e.preventDefault(); doClear(); }
    else if (e.key === 'Backspace') { e.preventDefault(); doBackspace(); }
    else if (e.key === '%') { e.preventDefault(); doPercent(); }
 
    // Visual feedback on keyboard press
    const keyMap = {
      '0': '[data-value="0"]', '1': '[data-value="1"]', '2': '[data-value="2"]',
      '3': '[data-value="3"]', '4': '[data-value="4"]', '5': '[data-value="5"]',
      '6': '[data-value="6"]', '7': '[data-value="7"]', '8': '[data-value="8"]',
      '9': '[data-value="9"]', '+': '[data-value="+"]', '-': '[data-value="−"]',
      '*': '[data-value="×"]', '/': '[data-value="÷"]', '.': '[data-action="decimal"]',
      'Enter': '[data-action="equals"]', '=': '[data-action="equals"]',
      'Escape': '[data-action="clear"]', 'Backspace': '[data-action="backspace"]',
    };
    const sel = keyMap[e.key];
    if (sel) {
      const btn = document.querySelector(sel);
      if (btn) {
        btn.style.transform = 'scale(0.92)';
        setTimeout(() => btn.style.transform = '', 120);
      }
    }
  });