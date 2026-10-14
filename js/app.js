/* ============================================================
   APP — точка входа, навигация, события
   ============================================================ */
import { state, ASSETS_DEF } from './config.js';
import { loadAllPrices, fetchCryptoHistory, fmt } from './api.js';
import {
  renderRecommendations, renderAllocation, renderCards, renderTable,
  renderPortfolio, updatePortfolioSelector, addPosition, removePosition,
  openModal, closeModal, quickAddToPortfolio
} from './ui.js';
import { renderMainChart, renderRSIChart, renderMACDChart } from './charts.js';

// Экспорт в window для inline-обработчиков (onclick в HTML)
window.openModal = openModal;
window.closeModal = closeModal;
window.quickAddToPortfolio = quickAddToPortfolio;
window.removePosition = removePosition;

// ============================================================
// СТАТИСТИКА (главная)
// ============================================================
function updateStats() {
  const imoex = document.getElementById('imoex');
  const btcPrice = document.getElementById('btcPrice');
  const keyRate = document.getElementById('keyRate');
  const fearIndex = document.getElementById('fearIndex');

  if (imoex) imoex.textContent = (2500 + Math.random() * 100).toFixed(0);
  if (btcPrice) btcPrice.textContent = state.prices['btc'] ? '$' + (state.prices['btc'] / 1000).toFixed(1) + 'k' : '—';
  if (keyRate) keyRate.textContent = '14,5%';
  if (fearIndex) fearIndex.textContent = '64';
}

// ============================================================
// ЗАГРУЗКА ДАННЫХ
// ============================================================
async function loadData() {
  await loadAllPrices();
  updatePortfolioSelector();

  const lastUpdate = document.getElementById('lastUpdate');
  if (lastUpdate) lastUpdate.textContent = new Date().toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });

  updateStats();
}

// ============================================================
// ОБНОВИТЬ ВСЁ
// ============================================================
async function refreshAll() {
  await loadData();
  renderRecommendations();
  renderAllocation();
  renderCards();
  renderTable();
  renderPortfolio();
  renderMainChart();
  renderRSIChart();
  renderMACDChart();
}

// ============================================================
// НАВИГАЦИЯ МЕЖДУ СТРАНИЦАМИ
// ============================================================
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href === path) item.classList.add('active');
    else item.classList.remove('active');
  });
}

// ============================================================
// СОБЫТИЯ
// ============================================================
function bindEvents() {
  // Табы
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filter = tab.dataset.tab;
      renderCards();
      renderTable();
    });
  });

  // Периоды графика
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.chartPeriod = parseInt(btn.dataset.period);
      renderMainChart();
    });
  });

  // Портфель
  const addBtn = document.getElementById('pfAddBtn');
  if (addBtn) addBtn.addEventListener('click', addPosition);

  const select = document.getElementById('pfAssetSelect');
  if (select) {
    select.addEventListener('change', (e) => {
      const asset = state.assets.find(a => a.id === e.target.value);
      if (asset) document.getElementById('pfPrice').value = asset.price.toFixed(4);
    });
  }

  // Кнопка "Обновить"
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = '⏳ Загрузка...';
      await refreshAll();
      refreshBtn.textContent = '🔄 Обновить';
    });
  }
}

// ============================================================
// СТАРТ
// ============================================================
async function init() {
  setActiveNav();
  bindEvents();
  await refreshAll();

  // Автообновление раз в минуту
  setInterval(async () => {
    await loadData();
    renderCards();
    renderTable();
    renderPortfolio();
  }, 60000);
}

document.addEventListener('DOMContentLoaded', init);