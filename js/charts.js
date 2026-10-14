/* ============================================================
   ГРАФИКИ — Chart.js
   ============================================================ */
import { state, ASSETS_DEF } from './config.js';
import { fetchCryptoHistory, fetchMoexHistory } from './api.js';
import { calcRSI, calcMACD } from './indicators.js';

let mainChart, rsiChart, macdChart;

// Настройка глобальных параметров Chart.js
if (window.Chart) {
  Chart.defaults.color = '#7d8590';
  Chart.defaults.font.family = "-apple-system, 'SF Pro Text', sans-serif";
  Chart.defaults.font.size = 10;
}

// ============================================================
// ГЛАВНЫЙ ГРАФИК
// ============================================================
export async function renderMainChart() {
  const canvas = document.getElementById('mainChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const days = state.chartPeriod;
  const datasets = [];
  const colors = { btc: '#f7931a', eth: '#627eea', sber: '#21a038' };

  for (const id of state.activeChartAssets) {
    const asset = ASSETS_DEF.find(a => a.id === id);
    if (!asset) continue;
    try {
      const data = asset.type === 'crypto'
        ? await fetchCryptoHistory(asset.cgId, days)
        : await fetchMoexHistory(asset.symbol, days);
      if (!data || !data.length) continue;
      const base = data[0].p;
      datasets.push({
        label: asset.symbol,
        data: data.map(d => ((d.p / base - 1) * 100)),
        borderColor: colors[id] || asset.color,
        backgroundColor: 'transparent',
        borderWidth: 2, tension: 0.3, pointRadius: 0,
        _labels: data.map(d => new Date(d.t).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }))
      });
    } catch (e) { console.warn(e); }
  }
  if (!datasets.length) return;

  if (mainChart) mainChart.destroy();
  mainChart = new Chart(ctx, {
    type: 'line',
    data: { labels: datasets[0]._labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { boxWidth: 10, padding: 10, font: { size: 10 } } },
        tooltip: {
          backgroundColor: '#131a26', borderColor: '#1f2a3a', borderWidth: 1, padding: 8,
          callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(1)}%` }
        }
      },
      scales: {
        x: { grid: { color: '#1f2a3a' }, ticks: { maxTicksLimit: 4, font: { size: 9 } } },
        y: { grid: { color: '#1f2a3a' }, ticks: { font: { size: 9 }, callback: (v) => v.toFixed(0) + '%' } }
      }
    }
  });
}

// ============================================================
// RSI ГРАФИК
// ============================================================
export async function renderRSIChart() {
  const canvas = document.getElementById('rsiChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btc = ASSETS_DEF.find(a => a.id === 'btc');
  let hist = state.history['btc'];
  if (!hist || hist.length < 20) {
    hist = (await fetchCryptoHistory(btc.cgId, 90)).map(h => h.p);
    state.history['btc'] = hist;
  }
  const arr = calcRSI(hist, 14);
  if (!arr) return;
  const labels = hist.slice(hist.length - arr.length).map((_, i) => i + 1);
  const last = arr[arr.length - 1];

  const sigEl = document.getElementById('rsiSignal');
  if (sigEl) {
    if (last < 30) { sigEl.className = 'signal-badge signal-buy'; sigEl.textContent = 'BUY'; }
    else if (last > 70) { sigEl.className = 'signal-badge signal-sell'; sigEl.textContent = 'SELL'; }
    else { sigEl.className = 'signal-badge signal-neutral'; sigEl.textContent = last.toFixed(0); }
  }

  if (rsiChart) rsiChart.destroy();
  rsiChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { data: arr, borderColor: '#2962ff', borderWidth: 1.5, pointRadius: 0, tension: 0.3 },
        { data: labels.map(() => 70), borderColor: 'rgba(239,83,80,0.4)', borderWidth: 1, borderDash: [3,3], pointRadius: 0 },
        { data: labels.map(() => 30), borderColor: 'rgba(38,166,154,0.4)', borderWidth: 1, borderDash: [3,3], pointRadius: 0 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { min: 0, max: 100, grid: { color: '#1f2a3a' }, ticks: { font: { size: 9 }, stepSize: 25 } }
      }
    }
  });
}

// ============================================================
// MACD ГРАФИК
// ============================================================
export async function renderMACDChart() {
  const canvas = document.getElementById('macdChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btc = ASSETS_DEF.find(a => a.id === 'btc');
  let hist = state.history['btc'];
  if (!hist || hist.length < 40) {
    hist = (await fetchCryptoHistory(btc.cgId, 120)).map(h => h.p);
    state.history['btc'] = hist;
  }
  const macd = calcMACD(hist);
  if (!macd) return;
  const labels = hist.slice(-macd.hist.length).map((_, i) => i + 1);
  const lastMACD = macd.macd[macd.macd.length - 1];
  const lastSignal = macd.signal[macd.signal.length - 1];

  const sigEl = document.getElementById('macdSignal');
  if (sigEl) {
    if (lastMACD > lastSignal) { sigEl.className = 'signal-badge signal-buy'; sigEl.textContent = 'BUY'; }
    else { sigEl.className = 'signal-badge signal-sell'; sigEl.textContent = 'SELL'; }
  }

  if (macdChart) macdChart.destroy();
  macdChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { type: 'bar', data: macd.hist, backgroundColor: macd.hist.map(h => h >= 0 ? 'rgba(38,166,154,0.4)' : 'rgba(239,83,80,0.4)'), order: 2 },
        { type: 'line', data: macd.macd.slice(-labels.length), borderColor: '#2962ff', borderWidth: 1.5, pointRadius: 0, tension: 0.3, order: 0 },
        { type: 'line', data: macd.signal.slice(-labels.length), borderColor: '#ffb300', borderWidth: 1.5, pointRadius: 0, tension: 0.3, order: 1 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { grid: { color: '#1f2a3a' }, ticks: { font: { size: 9 } } }
      }
    }
  });
}