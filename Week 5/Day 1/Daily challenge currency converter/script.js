const BASE_URL = 'https://open.er-api.com/v6';

// DOM Elements
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const amountInput = document.getElementById('amount');
const convertBtn = document.getElementById('convert-btn');
const switchBtn = document.getElementById('switch-btn');
const resultDiv = document.getElementById('result');
let exchangeRates = null;

// Initialize application
init();

async function init() {
  await fetchSupportedCurrencies();
  convertCurrency();
}

// 1. Fetch supported currencies and populate dropdowns
async function fetchSupportedCurrencies() {
  try {
    const response = await fetch(`${BASE_URL}/latest/USD`);
    if (!response.ok) throw new Error('Failed to fetch currency list');

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error('Currency data unavailable');
    }

    exchangeRates = data.rates;
    const codes = ['USD', ...Object.keys(exchangeRates).sort()];

    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    codes.forEach((code) => {
      const optionFrom = new Option(code, code);
      const optionTo = new Option(code, code);
      fromSelect.add(optionFrom);
      toSelect.add(optionTo);
    });

    // Set default values
    fromSelect.value = 'USD';
    toSelect.value = 'EUR';
  } catch (error) {
    resultDiv.style.color = 'red';
    resultDiv.textContent = 'Error loading currencies. Please try again later.';
  }
}

// 2. Perform currency conversion
async function convertCurrency() {
  const fromCode = fromSelect.value;
  const toCode = toSelect.value;
  const amount = parseFloat(amountInput.value);

  if (isNaN(amount) || amount <= 0) {
    resultDiv.style.color = 'red';
    resultDiv.textContent = 'Please enter a valid amount';
    return;
  }

  if (!exchangeRates) {
    resultDiv.style.color = 'red';
    resultDiv.textContent = 'Currencies are still loading. Please try again in a moment.';
    return;
  }

  resultDiv.style.color = '#333';
  resultDiv.textContent = 'Converting...';

  try {
    const fromRate = fromCode === 'USD' ? 1 : exchangeRates[fromCode];
    const toRate = toCode === 'USD' ? 1 : exchangeRates[toCode];

    if (fromRate == null || toRate == null) {
      throw new Error('One of the selected currencies is unavailable');
    }

    const convertedAmount = (amount * toRate) / fromRate;

    resultDiv.style.color = '#28a745';
    resultDiv.textContent = `${amount} ${fromCode} = ${convertedAmount.toFixed(2)} ${toCode}`;
  } catch (error) {
    resultDiv.style.color = 'red';
    resultDiv.textContent = 'Conversion failed. Please try again.';
  }
}

// 3. Bonus: Switch button logic
function switchCurrencies() {
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;

  convertCurrency();
}

// Event Listeners
convertBtn.addEventListener('click', convertCurrency);
switchBtn.addEventListener('click', switchCurrencies);