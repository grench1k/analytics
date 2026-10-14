/* ============================================================
   ТЕХНИЧЕСКИЕ ИНДИКАТОРЫ
   ============================================================ */

// RSI — Relative Strength Index
export function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  const arr = [];
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  arr.push(100 - 100 / (1 + rs));
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0, loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    arr.push(100 - 100 / (1 + rs));
  }
  return arr;
}

// EMA — Exponential Moving Average
export function calcEMA(prices, period) {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const ema = [prices.slice(0, period).reduce((a, b) => a + b, 0) / period];
  for (let i = period; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[ema.length - 1] * (1 - k));
  }
  return ema;
}

// MACD
export function calcMACD(prices, fast = 12, slow = 26, signal = 9) {
  if (prices.length < slow + signal) return null;
  const emaFast = calcEMA(prices, fast);
  const emaSlow = calcEMA(prices, slow);
  const macdLine = [];
  for (let i = 0; i < emaSlow.length; i++) {
    const fastIdx = i + (slow - fast);
    if (fastIdx < emaFast.length) macdLine.push(emaFast[fastIdx] - emaSlow[i]);
  }
  const signalLine = calcEMA(macdLine, signal);
  const hist = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdIdx = i + (macdLine.length - signalLine.length);
    hist.push(macdLine[macdIdx] - signalLine[i]);
  }
  return { macd: macdLine, signal: signalLine, hist };
}

// Классификация сигнала RSI
export function rsiSignal(rsi) {
  if (rsi === null || rsi === undefined) return { cls: 'neutral', text: 'НЕТ ДАННЫХ' };
  if (rsi < 30) return { cls: 'buy', text: 'ПЕРЕПРОДАН' };
  if (rsi > 70) return { cls: 'sell', text: 'ПЕРЕКУПЛЕН' };
  return { cls: 'neutral', text: 'НЕЙТРАЛЬНО' };
}