import './styles.css';

const key = 'hxwl-11-noise-records';
const seed = [
  { id: crypto.randomUUID(), location: '老城菜市口', at: '2026-06-05T07:40', db: 76, source: '叫卖与卸货', feeling: '嘈杂' },
  { id: crypto.randomUUID(), location: '滨河步道', at: '2026-06-05T12:30', db: 58, source: '人流', feeling: '可接受' },
  { id: crypto.randomUUID(), location: '高架桥下', at: '2026-06-05T18:20', db: 84, source: '车流', feeling: '刺耳' },
  { id: crypto.randomUUID(), location: '社区广场', at: '2026-06-06T20:10', db: 71, source: '音箱', feeling: '偏吵' },
  { id: crypto.randomUUID(), location: '图书馆外', at: '2026-06-06T15:00', db: 49, source: '环境声', feeling: '安静' }
];

let records = JSON.parse(localStorage.getItem(key) || 'null') || seed;
let editingId = null;

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="top">
      <div>
        <p>hxwl-11 · port 5111</p>
        <h1>城市噪声切片</h1>
      </div>
      <button id="reset">载入示例</button>
    </header>

    <section class="summary" id="summary"></section>

    <section class="workspace">
      <form id="form" class="panel">
        <h2>新增观测</h2>
        <input name="location" placeholder="街区或地点" required />
        <input name="at" type="datetime-local" required />
        <input name="db" type="number" min="20" max="130" placeholder="分贝dB" required />
        <input name="source" placeholder="噪声来源" required />
        <select name="feeling" required>
          <option value="">主观感受</option>
          <option>安静</option><option>可接受</option><option>偏吵</option><option>嘈杂</option><option>刺耳</option>
        </select>
        <button class="primary">保存</button>
      </form>

      <section class="panel wide">
        <div class="panelHead">
          <h2>日内分贝曲线</h2>
          <input id="dayFilter" type="date" />
        </div>
        <div class="chart" id="daily"></div>
      </section>
    </section>

    <section class="cards">
      <div class="panel"><h2>地点平均噪声</h2><div class="chart small" id="locations"></div></div>
      <div class="panel"><h2>高噪声记录</h2><div id="hotList"></div></div>
    </section>

    <section class="panel">
      <div class="panelHead"><h2>记录列表</h2><input id="search" placeholder="搜索地点或来源" /></div>
      <div class="tableWrap"><table><thead><tr><th>时间</th><th>地点</th><th>分贝</th><th>来源</th><th>感受</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    </section>
  </main>
`;

const form = document.querySelector('#form');
const search = document.querySelector('#search');
const dayFilter = document.querySelector('#dayFilter');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const item = { ...data, db: Number(data.db), id: editingId || crypto.randomUUID() };
  records = editingId ? records.map((record) => (record.id === editingId ? item : record)) : [item, ...records];
  editingId = null;
  form.reset();
  save();
  render();
});
search.addEventListener('input', render);
dayFilter.addEventListener('change', render);
document.querySelector('#reset').addEventListener('click', () => {
  records = seed;
  save();
  render();
});

function save() {
  localStorage.setItem(key, JSON.stringify(records));
}

function render() {
  if (!dayFilter.value && records[0]) dayFilter.value = records[0].at.slice(0, 10);
  const filtered = records.filter((record) => [record.location, record.source, record.feeling].join(' ').includes(search.value.trim()));
  const dayRecords = filtered.filter((record) => record.at.startsWith(dayFilter.value)).sort((a, b) => a.at.localeCompare(b.at));
  document.querySelector('#summary').innerHTML = [
    ['观测数', records.length],
    ['平均分贝', `${average(records.map((record) => record.db)).toFixed(1)}dB`],
    ['最高分贝', `${Math.max(...records.map((record) => record.db), 0)}dB`],
    ['高噪声占比', `${Math.round(records.filter((record) => record.db >= 75).length / Math.max(records.length, 1) * 100)}%`]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');
  drawLine('#daily', dayRecords.map((record) => ({ label: record.at.slice(11, 16), value: record.db })), 'dB');
  drawBars('#locations', grouped(filtered), 'dB');
  document.querySelector('#hotList').innerHTML = filtered.filter((record) => record.db >= 70).sort((a, b) => b.db - a.db).slice(0, 6).map((record) => `<div class="hot"><strong>${record.db}dB</strong><span>${record.location}</span><em>${record.source}</em></div>`).join('') || '<p class="empty">暂无高噪声记录</p>';
  document.querySelector('#rows').innerHTML = filtered.sort((a, b) => b.at.localeCompare(a.at)).map((record) => `<tr><td>${record.at.replace('T', ' ')}</td><td>${record.location}</td><td>${record.db}dB</td><td>${record.source}</td><td>${record.feeling}</td><td><button data-edit="${record.id}">编辑</button><button data-del="${record.id}">删除</button></td></tr>`).join('');
  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => {
    records = records.filter((record) => record.id !== button.dataset.del);
    save();
    render();
  }));
  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
    const record = records.find((item) => item.id === button.dataset.edit);
    editingId = record.id;
    Object.entries(record).forEach(([name, value]) => {
      if (form.elements[name]) form.elements[name].value = value;
    });
  }));
}

function grouped(data) {
  const map = new Map();
  data.forEach((record) => map.set(record.location, [...(map.get(record.location) || []), record.db]));
  return [...map.entries()].map(([label, values]) => ({ label, value: average(values) })).sort((a, b) => b.value - a.value);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function drawLine(selector, data, unit) {
  const el = document.querySelector(selector);
  if (!data.length) return (el.innerHTML = '<p class="empty">暂无数据</p>');
  const max = Math.max(...data.map((item) => item.value), 1);
  const min = Math.min(...data.map((item) => item.value), 0);
  const span = Math.max(max - min, 1);
  const points = data.map((item, index) => `${42 + index * (420 / Math.max(data.length - 1, 1))},${178 - ((item.value - min) / span) * 132}`).join(' ');
  el.innerHTML = `<svg viewBox="0 0 500 220"><polyline points="${points}" fill="none" stroke="#d94636" stroke-width="4" stroke-linecap="round"/>${data.map((item, index) => `<circle cx="${42 + index * (420 / Math.max(data.length - 1, 1))}" cy="${178 - ((item.value - min) / span) * 132}" r="5"/><text x="${42 + index * (420 / Math.max(data.length - 1, 1))}" y="205">${item.label}</text><text x="${42 + index * (420 / Math.max(data.length - 1, 1))}" y="${166 - ((item.value - min) / span) * 132}">${item.value}${unit}</text>`).join('')}</svg>`;
}

function drawBars(selector, data, unit) {
  const el = document.querySelector(selector);
  if (!data.length) return (el.innerHTML = '<p class="empty">暂无数据</p>');
  const max = Math.max(...data.map((item) => item.value), 1);
  el.innerHTML = `<svg viewBox="0 0 500 220">${data.map((item, index) => `<text x="18" y="${44 + index * 42}">${item.label}</text><rect x="150" y="${24 + index * 42}" width="${(item.value / max) * 300}" height="22" rx="4"/><text x="${160 + (item.value / max) * 300}" y="${42 + index * 42}">${Math.round(item.value)}${unit}</text>`).join('')}</svg>`;
}

render();
