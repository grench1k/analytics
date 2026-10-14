/* ============================================================
   UI — рендер карточек, таблиц, портфеля, модалки
   ============================================================ */
import { state, ANALYST_FORECASTS, ASSETS_DEF, savePortfolio } from './config.js';
import { fmt, fmtRub, fmtChange, formatPrice, fetchCryptoHistory, fetchMoexHistory } from './api.js';
import { calcRSI, rsiSignal } from './indicators.js';

// ============================================================
// РЕКОМЕНДАЦИИ
// ============================================================
export function renderRecommendations() {
  const grid = document.getElementById('recGrid');
  if (!grid) return;

  const ranked = Object.entries(ANALYST_FORECASTS)
    .map(([id, f]) => ({
      id, ...f,
      asset: state.assets.find(a => a.id === id) || ASSETS_DEF.find(a => a.id === id)
    }))
    .filter(r => r.asset)
    .sort((a, b) => b.upside - a.upside);

  if (!ranked.length) {
    grid.innerHTML = '<div style="color:var(--text-dim);padding:20px;text-align:center;font-size:13px;">Загрузка...</div>';
    return;
  }

  grid.innerHTML = ranked.slice(0, 8).map((r, i) => {
    const isPos = r.upside >= 0;
    return `
      <div class="rec-card" onclick="openModal('${r.id}')">
        <div class="rec-asset-header">
          <div style="flex:1;min-width:0;">
            <div class="rec-asset-name">
              <span class="rec-rank">${i + 1}</span>
              ${r.asset.name}
            </div>
            <div class="rec-asset-type">${r.source}</div>
          </div>
          <div>
            <div class="rec-potential ${isPos ? '' : 'negative'}">${isPos ? '+' : ''}${r.upside.toFixed(0)}%</div>
            <div style="font-size:10px;color:var(--text-dim);text-align:right;">${r.horizon}</div>
          </div>
        </div>
        <div class="rec-details">${r.thesis.slice(0, 90)}...</div>
        <div class="rec-bar-wrap"><div class="rec-bar ${isPos ? '' : 'negative'}" style="width:${Math.min(Math.abs(r.upside), 100)}%"></div></div>
      </div>
    `;
  }).join('');

  const upd = document.getElementById('recUpdate');
  if (upd) upd.textContent = new Date().toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
}

// ============================================================
// РАСПРЕДЕЛЕНИЕ
// ============================================================
export function renderAllocation() {
  const grid = document.getElementById('allocGrid');
  if (!grid) return;
  const alloc = [
    { label: 'ОФЗ', pct: 45, color: 'var(--green)' },
    { label: 'Акции РФ', pct: 27, color: 'var(--blue)' },
    { label: 'Крипто', pct: 13, color: 'var(--orange)' },
    { label: 'Кэш', pct: 15, color: 'var(--text-dim)' }
  ];
  grid.innerHTML = alloc.map(a => `
    <div class="alloc-item">
      <div class="alloc-pct" style="color:${a.color}">${a.pct}%</div>
      <div class="alloc-label">${a.label}</div>
    </div>
  `).join('');
}

// ============================================================
// КАРТОЧКИ АКТИВОВ
// ============================================================
export function renderCards() {
  const grid = document.getElementById('cardsGrid');
  if (!grid) return;
  const list = state.filter === 'all'
    ? state.assets.slice(0, 6)
    : state.assets.filter(a => a.type === state.filter);

  if (!list.length) {
    grid.innerHTML = '<div style="color:var(--text-dim);padding:20px;font-size:13px;">Загрузка...</div>';
    return;
  }

  grid.innerHTML = list.map(a => {
    const up = a.change >= 0;
    const typeLabel = { stocks: 'Акция', bonds: 'Облигация', crypto: 'Крипто' }[a.type] || '';
    const forecast = ANALYST_FORECASTS[a.id];
    const badge = forecast
      ? `<div style="margin-top:6px;font-size:11px;font-weight:700;color:${forecast.upside >= 0 ? 'var(--green)' : 'var(--red)'};">Прогноз: ${forecast.upside >= 0 ? '+' : ''}${forecast.upside.toFixed(0)}% за ${forecast.horizon}</div>`
      : '';
    return `
      <div class="card" onclick="openModal('${a.id}')">
        <div class="card-header">
          <div class="asset-name">
            <div class="asset-icon" style="background:${a.color}">${a.symbol.slice(0,3)}</div>
            <div>${a.name}<div class="asset-symbol">${a.symbol} · ${typeLabel}</div></div>
          </div>
        </div>
        <div class="price">${formatPrice(a)}</div>
        <span class="change ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${fmtChange(a.change)}</span>
        ${badge}
        <div class="meta"><span>Кап: <strong>${a.cap}</strong></span></div>
      </div>
    `;
  }).join('');
}

// ============================================================
// ТАБЛИЦА РЫНКОВ
// ============================================================
export async function renderTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;

  const list = state.filter === 'all'
    ? state.assets
    : state.assets.filter(a => a.type === state.filter);

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:20px;">Загрузка...</td></tr>';
    return;
  }

  const rows = await Promise.all(list.map(async (a) => {
    let rsi = null;
    try {
      let hist = state.history[a.id];
      if (!hist) {
        hist = a.type === 'crypto'
          ? (await fetchCryptoHistory(a.cgId, 90)).map(h => h.p)
          : (await fetchMoexHistory(a.symbol, 90)).map(h => h.p);
        state.history[a.id] = hist;
      }
      if (hist && hist.length > 20) {
        const arr = calcRSI(hist, 14);
        rsi = arr ? arr[arr.length - 1] : null;
      }
    } catch (e) {}

    const up = a.change >= 0;
    const f = ANALYST_FORECASTS[a.id];
    const forecastHtml = f
      ? `<span style="color:${f.upside >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:700;">${f.upside >= 0 ? '+' : ''}${f.upside.toFixed(0)}%</span>`
      : '<span style="color:var(--text-dim);">—</span>';

    return `
      <tr onclick="openModal('${a.id}')">
        <td>
          <div class="coin-cell">
            <div class="asset-icon" style="background:${a.color}">${a.symbol.slice(0,3)}</div>
            <div>${a.name}<div style="font-size:10px;color:var(--text-dim);font-weight:400;">${a.symbol}</div></div>
          </div>
        </td>
        <td style="font-weight:600;">${formatPrice(a)}</td>
        <td style="color:${up ? 'var(--green)' : 'var(--red)'};font-weight:600;">${fmtChange(a.change)}</td>
        <td class="hide-xs">${rsi !== null ? rsi.toFixed(1) : '—'}</td>
        <td>${forecastHtml}</td>
      </tr>
    `;
  }));

  tbody.innerHTML = rows.join('');
}

// ============================================================
// ПОРТФЕЛЬ
// ============================================================
export function updatePortfolioSelector() {
  const sel = document.getElementById('pfAssetSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Выберите актив...</option>' +
    state.assets.map(a => `<option value="${a.id}">${a.name} (${a.symbol})</option>`).join('');
}

export function addPosition() {
  const id = document.getElementById('pfAssetSelect')?.value;
  const qty = parseFloat(document.getElementById('pfQty')?.value);
  const entryPrice = parseFloat(document.getElementById('pfPrice')?.value);

  if (!id || !qty || qty <= 0 || !entryPrice || entryPrice <= 0) {
    alert('Заполните все поля');
    return;
  }
  const asset = state.assets.find(a => a.id === id);
  if (!asset) return;

  const existing = state.portfolio.find(p => p.id === id);
  if (existing) {
    const totalQty = existing.qty + qty;
    existing.entryPrice = (existing.entryPrice * existing.qty + entryPrice * qty) / totalQty;
    existing.qty = totalQty;
  } else {
    state.portfolio.push({
      id, qty, entryPrice,
      name: asset.name, symbol: asset.symbol,
      type: asset.type, color: asset.color
    });
  }

  document.getElementById('pfQty').value = '';
  document.getElementById('pfPrice').value = '';
  savePortfolio();
  renderPortfolio();
}

export function removePosition(id) {
  state.portfolio = state.portfolio.filter(p => p.id !== id);
  savePortfolio();
  renderPortfolio();
}

export function renderPortfolio() {
  const tbody = document.getElementById('pfBody');
  if (!tbody) return;

  if (!state.portfolio.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:20px;font-size:12px;">Портфель пуст</td></tr>';
    ['pfTotalValue', 'pfInvested'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '$0.00';
    });
    ['pfPnl', 'pfPnlPct'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = id === 'pfPnl' ? '$0.00' : '0.00%'; el.style.color = ''; }
    });
    return;
  }

  let totalValue = 0, invested = 0;

  tbody.innerHTML = state.portfolio.map(p => {
    const currentPrice = state.prices[p.id] || 0;
    const value = currentPrice * p.qty;
    const cost = p.entryPrice * p.qty;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    totalValue += value;
    invested += cost;

    return `
      <tr>
        <td>
          <div class="coin-cell">
            <div class="asset-icon" style="background:${p.color}">${p.symbol.slice(0,3)}</div>
            <div>${p.symbol}</div>
          </div>
        </td>
        <td>${p.qty}</td>
        <td>${p.entryPrice.toFixed(2)}</td>
        <td>${currentPrice.toFixed(2)}</td>
        <td class="hide-xs">${value.toFixed(0)}</td>
        <td class="${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">
          ${pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}<br>
          <span style="font-size:10px;">${pnlPct.toFixed(1)}%</span>
        </td>
        <td><button class="btn btn-red" onclick="removePosition('${p.id}')">✕</button></td>
      </tr>
    `;
  }).join('');

  const totalPnl = totalValue - invested;
  const totalPnlPct = invested > 0 ? (totalPnl / invested) * 100 : 0;

  const setTxt = (id, txt, color) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = txt; if (color) el.style.color = color; }
  };

  setTxt('pfTotalValue', '$' + totalValue.toFixed(2));
  setTxt('pfInvested', '$' + invested.toFixed(2));
  setTxt('pfPnl', (totalPnl >= 0 ? '+' : '') + '$' + totalPnl.toFixed(2), totalPnl >= 0 ? 'var(--green)' : 'var(--red)');
  setTxt('pfPnlPct', (totalPnlPct >= 0 ? '+' : '') + totalPnlPct.toFixed(2) + '%', totalPnlPct >= 0 ? 'var(--green)' : 'var(--red)');
}

// ============================================================
// МОДАЛЬНОЕ ОКНО
// ============================================================
export function openModal(assetId) {
  const f = ANALYST_FORECASTS[assetId];
  const asset = state.assets.find(a => a.id === assetId) || ASSETS_DEF.find(a => a.id === assetId);
  if (!f || !asset) return;

  const isPos = f.upside >= 0;
  const verdictClass = f.verdict === 'buy' ? 'verdict-buy' : f.verdict === 'avoid' ? 'verdict-avoid' : 'verdict-hold';
  const verdictLabel = f.verdict === 'buy' ? '✅ ПОКУПАТЬ' : f.verdict === 'avoid' ? '❌ ИЗБЕГАТЬ' : '⏸ УДЕРЖИВАТЬ';
  const currentPrice = state.prices[assetId] || asset.price;

  const modal = document.getElementById('modalContent');
  if (!modal) return;

  modal.innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-header">
      <div class="asset-icon" style="background:${asset.color}">${asset.symbol.slice(0,3)}</div>
      <div>
        <div class="modal-title">${asset.name}</div>
        <div class="modal-subtitle">${asset.symbol} · ${f.source}</div>
      </div>
    </div>

    <div class="${verdictClass} verdict-badge">${verdictLabel}</div>

    <div class="modal-section">
      <div class="modal-section-title">Прогноз</div>
      <div class="forecast-grid">
        <div class="forecast-item">
          <div class="forecast-label">Текущая</div>
          <div class="forecast-value" style="font-size:13px;">${formatPrice({ ...asset, price: currentPrice })}</div>
        </div>
        <div class="forecast-item">
          <div class="forecast-label">Целевая</div>
          <div class="forecast-value" style="font-size:13px;">${asset.type === 'crypto' ? fmt(f.targetPrice) : fmtRub(f.targetPrice)}</div>
        </div>
        <div class="forecast-item">
          <div class="forecast-label">Потенциал</div>
          <div class="forecast-value ${isPos ? 'green' : 'red'}">${isPos ? '+' : ''}${f.upside.toFixed(1)}%</div>
        </div>
        <div class="forecast-item">
          <div class="forecast-label">Горизонт</div>
          <div class="forecast-value" style="font-size:13px;">${f.horizon}</div>
        </div>
        ${f.targetYield ? `
        <div class="forecast-item">
          <div class="forecast-label">К погаш.</div>
          <div class="forecast-value green">${f.targetYield}%</div>
        </div>` : ''}
        <div class="forecast-item">
          <div class="forecast-label">Доля</div>
          <div class="forecast-value" style="font-size:13px;color:var(--blue);">${f.allocation}</div>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Обоснование</div>
      <div class="analyst-quote">${f.thesis}</div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Риски</div>
      <ul class="risk-list">${f.risks.map(r => `<li>${r}</li>`).join('')}</ul>
    </div>

    <div class="modal-section" style="margin-bottom:0;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${f.verdict === 'buy' ? `<button class="btn btn-green" style="flex:1;" onclick="quickAddToPortfolio('${assetId}')">➕ В портфель</button>` : ''}
        <button class="btn" style="flex:1;background:var(--bg-hover);color:var(--text);" onclick="closeModal()">Закрыть</button>
      </div>
    </div>
  `;

  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

export function quickAddToPortfolio(assetId) {
  closeModal();
  const sel = document.getElementById('pfAssetSelect');
  if (sel) {
    sel.value = assetId;
    sel.dispatchEvent(new Event('change'));
    document.getElementById('pfQty')?.focus();
    const section = document.querySelector('.chart-section');
    if (section) window.scrollTo({ top: section.offsetTop - 60, behavior: 'smooth' });
  }
}