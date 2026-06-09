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
      <div class="topButtons">
        <button id="reportBtn">生成报告</button>
        <button id="reset">载入示例</button>
      </div>
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

    <section class="panel import-panel">
      <div class="panelHead">
        <h2>数据导入</h2>
        <span class="import-hint">支持 CSV、JSON 格式</span>
      </div>
      <div id="importArea" class="import-area">
        <input type="file" id="fileInput" accept=".csv,.json" hidden />
        <div class="import-drop" id="importDrop">
          <p class="import-icon">📁</p>
          <p>点击选择文件或拖拽到此处</p>
          <p class="import-tip">字段：地点、时间、分贝、来源、主观感受</p>
        </div>
      </div>
      <div id="importPreview" class="import-preview hidden">
        <div class="preview-summary">
          <div class="preview-stat"><span>识别字段</span><strong id="fieldCount">0</strong></div>
          <div class="preview-stat"><span>可导入行数</span><strong id="validCount">0</strong></div>
          <div class="preview-stat"><span>错误行数</span><strong id="errorCount">0</strong></div>
        </div>
        <div class="preview-fields" id="fieldMapping"></div>
        <div class="preview-errors" id="errorSummary"></div>
        <div class="preview-table-wrap">
          <h3>数据预览</h3>
          <div class="tableWrap">
            <table><thead id="previewHead"></thead><tbody id="previewBody"></tbody></table>
          </div>
        </div>
        <div class="preview-actions">
          <button id="cancelImport" class="secondary">取消</button>
          <button id="confirmImport" class="primary">确认导入</button>
        </div>
      </div>
    </section>

    <section class="cards">
      <div class="panel"><h2>地点平均噪声</h2><div class="chart small" id="locations"></div></div>
      <div class="panel"><h2>高噪声记录</h2><div id="hotList"></div></div>
    </section>

    <section class="panel">
      <div class="panelHead"><h2>记录列表</h2><input id="search" placeholder="搜索地点或来源" /></div>
      <div class="tableWrap"><table><thead><tr><th>时间</th><th>地点</th><th>分贝</th><th>来源</th><th>感受</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    </section>

    <section class="panel report-panel hidden" id="reportPanel">
      <div class="panelHead">
        <h2>噪声观测报告</h2>
        <div class="reportActions">
          <button id="closeReport" class="secondary">关闭</button>
          <button id="printReport" class="primary">打印报告</button>
        </div>
      </div>

      <div class="report-filter">
        <div class="date-range">
          <label>开始日期：<input type="date" id="reportStartDate" /></label>
          <label>结束日期：<input type="date" id="reportEndDate" /></label>
          <button id="generateReport" class="primary">生成</button>
        </div>
      </div>

      <div class="report-content" id="reportContent">
        <div class="report-empty">
          <p>请选择日期范围后点击"生成"按钮</p>
        </div>
      </div>
    </section>

    <div class="location-detail-overlay hidden" id="locationDetailOverlay">
      <div class="location-detail-panel" id="locationDetailPanel">
        <div class="location-detail-header">
          <h2 id="locationDetailTitle">地点详情</h2>
          <button class="location-detail-close" id="locationDetailClose">&times;</button>
        </div>
        <div class="location-detail-stats" id="locationDetailStats"></div>
        <div class="location-detail-chart">
          <h3>分贝变化趋势</h3>
          <div class="chart" id="locationDetailChart"></div>
        </div>
        <div class="location-detail-records">
          <h3>历史记录</h3>
          <div class="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>分贝</th>
                  <th>来源</th>
                  <th>感受</th>
                </tr>
              </thead>
              <tbody id="locationDetailRows"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
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
  document.querySelector('#rows').innerHTML = filtered.sort((a, b) => b.at.localeCompare(a.at)).map((record) => `<tr><td>${record.at.replace('T', ' ')}</td><td><span class="location-link" data-location="${record.location}">${record.location}</span></td><td>${record.db}dB</td><td>${record.source}</td><td>${record.feeling}</td><td><button data-edit="${record.id}">编辑</button><button data-del="${record.id}">删除</button></td></tr>`).join('');
  document.querySelectorAll('.location-link').forEach((link) => {
    link.addEventListener('click', () => openLocationDetail(link.dataset.location));
  });
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
  el.innerHTML = `<svg viewBox="0 0 500 220">${data.map((item, index) => `<g class="location-bar" data-location="${item.label}" style="cursor: pointer;"><text x="18" y="${44 + index * 42}" fill="#d94636" text-decoration="underline">${item.label}</text><rect x="150" y="${24 + index * 42}" width="${(item.value / max) * 300}" height="22" rx="4"/><text x="${160 + (item.value / max) * 300}" y="${42 + index * 42}">${Math.round(item.value)}${unit}</text></g>`).join('')}</svg>`;
  el.querySelectorAll('.location-bar').forEach((g) => {
    g.addEventListener('click', () => openLocationDetail(g.dataset.location));
  });
}

function openLocationDetail(location) {
  const locationRecords = records
    .filter((record) => record.location === location)
    .sort((a, b) => a.at.localeCompare(b.at));

  if (!locationRecords.length) return;

  const stats = calculateLocationStats(locationRecords);
  const mainSource = getMainSource(locationRecords.map((r) => r.source));

  document.querySelector('#locationDetailTitle').textContent = `${location} · 噪声详情`;

  document.querySelector('#locationDetailStats').innerHTML = `
    <div class="stat-card">
      <span class="stat-label">观测次数</span>
      <strong class="stat-value">${stats.count}</strong>
    </div>
    <div class="stat-card">
      <span class="stat-label">平均分贝</span>
      <strong class="stat-value">${stats.avgDb.toFixed(1)}dB</strong>
    </div>
    <div class="stat-card">
      <span class="stat-label">最高分贝</span>
      <strong class="stat-value">${stats.maxDb}dB</strong>
    </div>
    <div class="stat-card">
      <span class="stat-label">主要噪声来源</span>
      <strong class="stat-value">${mainSource}</strong>
    </div>
  `;

  const chartData = locationRecords.map((record) => ({
    label: record.at.slice(5, 16).replace('T', ' '),
    value: record.db
  }));
  drawLine('#locationDetailChart', chartData, 'dB');

  document.querySelector('#locationDetailRows').innerHTML = locationRecords
    .slice()
    .reverse()
    .map((record) => `
      <tr>
        <td>${record.at.replace('T', ' ')}</td>
        <td>${record.db}dB</td>
        <td>${record.source}</td>
        <td>${record.feeling}</td>
      </tr>
    `).join('');

  document.querySelector('#locationDetailOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLocationDetail() {
  document.querySelector('#locationDetailOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function calculateLocationStats(locationRecords) {
  const dbs = locationRecords.map((r) => r.db);
  return {
    count: locationRecords.length,
    avgDb: average(dbs),
    maxDb: Math.max(...dbs)
  };
}

function getMainSource(sources) {
  const countMap = new Map();
  sources.forEach((source) => {
    countMap.set(source, (countMap.get(source) || 0) + 1);
  });
  let maxCount = 0;
  let mainSource = sources[0] || '未知';
  countMap.forEach((count, source) => {
    if (count > maxCount) {
      maxCount = count;
      mainSource = source;
    }
  });
  return mainSource;
}

document.querySelector('#locationDetailClose').addEventListener('click', closeLocationDetail);
document.querySelector('#locationDetailOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'locationDetailOverlay') {
    closeLocationDetail();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.querySelector('#locationDetailOverlay').classList.contains('hidden')) {
    closeLocationDetail();
  }
});

let importData = null;
const fileInput = document.querySelector('#fileInput');
const importDrop = document.querySelector('#importDrop');
const importArea = document.querySelector('#importArea');
const importPreview = document.querySelector('#importPreview');
const cancelImportBtn = document.querySelector('#cancelImport');
const confirmImportBtn = document.querySelector('#confirmImport');

const fieldMappingConfig = {
  location: ['地点', 'location', 'place', '地址', '位置', '街区'],
  at: ['时间', 'at', 'datetime', 'date', 'timestamp', '观测时间', '记录时间'],
  db: ['分贝', 'db', 'noise', '声级', '音量', '噪声值'],
  source: ['来源', 'source', 'origin', '噪声源', '噪声来源'],
  feeling: ['主观感受', 'feeling', '感受', '评价', '主观评价']
};

const validFeelings = ['安静', '可接受', '偏吵', '嘈杂', '刺耳'];

importDrop.addEventListener('click', () => fileInput.click());
importDrop.addEventListener('dragover', (e) => {
  e.preventDefault();
  importDrop.classList.add('dragover');
});
importDrop.addEventListener('dragleave', () => importDrop.classList.remove('dragover'));
importDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  importDrop.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});
cancelImportBtn.addEventListener('click', resetImport);
confirmImportBtn.addEventListener('click', confirmImport);

const reportBtn = document.querySelector('#reportBtn');
const reportPanel = document.querySelector('#reportPanel');
const closeReport = document.querySelector('#closeReport');
const printReport = document.querySelector('#printReport');
const generateReport = document.querySelector('#generateReport');
const reportStartDate = document.querySelector('#reportStartDate');
const reportEndDate = document.querySelector('#reportEndDate');
const reportContent = document.querySelector('#reportContent');

reportBtn.addEventListener('click', () => {
  reportPanel.classList.remove('hidden');
  const dates = records.map(r => r.at.slice(0, 10)).sort();
  if (dates.length) {
    reportStartDate.value = dates[0];
    reportEndDate.value = dates[dates.length - 1];
  }
  reportPanel.scrollIntoView({ behavior: 'smooth' });
});

closeReport.addEventListener('click', () => {
  reportPanel.classList.add('hidden');
});

printReport.addEventListener('click', () => {
  window.print();
});

generateReport.addEventListener('click', () => {
  const start = reportStartDate.value;
  const end = reportEndDate.value;
  if (!start || !end) {
    alert('请选择开始和结束日期');
    return;
  }
  if (start > end) {
    alert('开始日期不能晚于结束日期');
    return;
  }
  renderReport(start, end);
});

function filterRecordsByDateRange(startDate, endDate) {
  return records.filter(record => {
    const date = record.at.slice(0, 10);
    return date >= startDate && date <= endDate;
  });
}

function calculateReportStats(filtered) {
  if (!filtered.length) return null;

  const dbs = filtered.map(r => r.db);
  const avgDb = average(dbs);
  const maxDb = Math.max(...dbs);
  const highNoiseCount = filtered.filter(r => r.db >= 75).length;
  const highNoiseRatio = (highNoiseCount / filtered.length * 100).toFixed(1);

  const locationStats = {};
  filtered.forEach(r => {
    if (!locationStats[r.location]) {
      locationStats[r.location] = { count: 0, totalDb: 0, maxDb: 0, highNoiseCount: 0 };
    }
    locationStats[r.location].count++;
    locationStats[r.location].totalDb += r.db;
    locationStats[r.location].maxDb = Math.max(locationStats[r.location].maxDb, r.db);
    if (r.db >= 75) locationStats[r.location].highNoiseCount++;
  });

  const locationRanking = Object.entries(locationStats)
    .map(([location, stats]) => ({
      location,
      count: stats.count,
      avgDb: (stats.totalDb / stats.count).toFixed(1),
      maxDb: stats.maxDb,
      highNoiseCount: stats.highNoiseCount
    }))
    .sort((a, b) => parseFloat(b.avgDb) - parseFloat(a.avgDb));

  const highNoiseRecords = filtered
    .filter(r => r.db >= 75)
    .sort((a, b) => b.db - a.db);

  return {
    count: filtered.length,
    avgDb: avgDb.toFixed(1),
    maxDb,
    highNoiseCount,
    highNoiseRatio,
    locationRanking,
    highNoiseRecords,
    startDate: reportStartDate.value,
    endDate: reportEndDate.value
  };
}

function renderReport(startDate, endDate) {
  const filtered = filterRecordsByDateRange(startDate, endDate);
  const stats = calculateReportStats(filtered);

  if (!stats) {
    reportContent.innerHTML = `
      <div class="report-empty">
        <p>所选日期范围内没有观测记录</p>
      </div>
    `;
    return;
  }

  reportContent.innerHTML = `
    <div class="report-page" id="reportPage">
      <div class="report-header">
        <h1>噪声观测报告</h1>
        <p class="report-date">报告时间：${new Date().toLocaleString('zh-CN')}</p>
        <p class="report-date">统计范围：${stats.startDate} 至 ${stats.endDate}</p>
      </div>

      <div class="report-summary">
        <div class="report-summary-item">
          <span class="report-label">观测数</span>
          <span class="report-value">${stats.count}</span>
        </div>
        <div class="report-summary-item">
          <span class="report-label">平均分贝</span>
          <span class="report-value">${stats.avgDb}dB</span>
        </div>
        <div class="report-summary-item">
          <span class="report-label">最高分贝</span>
          <span class="report-value">${stats.maxDb}dB</span>
        </div>
        <div class="report-summary-item">
          <span class="report-label">高噪声占比</span>
          <span class="report-value">${stats.highNoiseRatio}%</span>
        </div>
      </div>

      <div class="report-section">
        <h3>一、概要说明</h3>
        <p>本次报告统计了 <strong>${stats.startDate}</strong> 至 <strong>${stats.endDate}</strong> 期间的噪声观测数据，共包含 <strong>${stats.count}</strong> 条有效记录。</p>
        <p>期间平均噪声为 <strong>${stats.avgDb}dB</strong>，最高噪声达到 <strong>${stats.maxDb}dB</strong>，高噪声（≥75dB）记录共 <strong>${stats.highNoiseCount}</strong> 条，占比 <strong>${stats.highNoiseRatio}%</strong>。</p>
      </div>

      <div class="report-section">
        <h3>二、地点排行</h3>
        <p>按平均噪声从高到低排列：</p>
        <div class="tableWrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>地点</th>
                <th>观测次数</th>
                <th>平均分贝</th>
                <th>最高分贝</th>
                <th>高噪声次数</th>
              </tr>
            </thead>
            <tbody>
              ${stats.locationRanking.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.location}</td>
                  <td>${item.count}</td>
                  <td>${item.avgDb}dB</td>
                  <td>${item.maxDb}dB</td>
                  <td>${item.highNoiseCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="report-section">
        <h3>三、高噪声明细</h3>
        <p>噪声≥75dB的记录明细（共${stats.highNoiseRecords.length}条）：</p>
        ${stats.highNoiseRecords.length ? `
          <div class="tableWrap">
            <table class="report-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>时间</th>
                  <th>地点</th>
                  <th>分贝</th>
                  <th>来源</th>
                  <th>主观感受</th>
                </tr>
              </thead>
              <tbody>
                ${stats.highNoiseRecords.map((record, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${record.at.replace('T', ' ')}</td>
                    <td>${record.location}</td>
                    <td><strong>${record.db}dB</strong></td>
                    <td>${record.source}</td>
                    <td>${record.feeling}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="empty">该期间无高噪声记录。</p>'}
      </div>

      <div class="report-footer">
        <p>报告生成系统：城市噪声观测平台 hxwl-11</p>
        <p>本报告由系统自动生成，仅供参考。</p>
      </div>
    </div>
  `;
}

function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'json'].includes(ext)) {
    alert('仅支持 CSV 或 JSON 格式文件');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      let rawData;
      if (ext === 'json') {
        rawData = JSON.parse(content);
        if (!Array.isArray(rawData)) rawData = [rawData];
      } else {
        rawData = parseCSV(content);
      }
      processImportData(rawData);
    } catch (err) {
      alert('文件解析失败：' + err.message);
    }
  };
  reader.readAsText(file);
}

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((header, i) => obj[header] = values[i] || '');
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function mapFields(rawRecord) {
  const mapping = {};
  const detectedFields = {};
  Object.keys(rawRecord).forEach(key => {
    const lowerKey = key.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(fieldMappingConfig)) {
      if (aliases.some(alias => lowerKey === alias.toLowerCase() || lowerKey.includes(alias.toLowerCase()))) {
        mapping[field] = key;
        detectedFields[field] = key;
        break;
      }
    }
  });
  return { mapping, detectedFields };
}

function validateRecord(record, mapping, lineNum) {
  const errors = [];
  const result = { id: crypto.randomUUID() };

  const requiredFields = ['location', 'at', 'db', 'source', 'feeling'];
  requiredFields.forEach(field => {
    if (!mapping[field]) {
      errors.push(`缺少字段"${fieldMappingConfig[field][0]}"`);
      return;
    }
    const rawValue = record[mapping[field]];
    if (rawValue === undefined || rawValue === null || rawValue.toString().trim() === '') {
      errors.push(`"${fieldMappingConfig[field][0]}"不能为空`);
      return;
    }
    result[field] = rawValue.toString().trim();
  });

  if (errors.length) return { valid: false, errors, lineNum };

  const dbNum = Number(result.db);
  if (isNaN(dbNum) || dbNum < 20 || dbNum > 130) {
    errors.push(`分贝值"${result.db}"必须在20-130之间`);
  } else {
    result.db = dbNum;
  }

  if (!validFeelings.includes(result.feeling)) {
    errors.push(`主观感受"${result.feeling}"必须是：${validFeelings.join('、')}`);
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/;
  if (!datePattern.test(result.at)) {
    errors.push(`时间格式"${result.at}"不正确，应为YYYY-MM-DD HH:MM格式`);
  } else {
    result.at = result.at.replace(' ', 'T');
  }

  return { valid: errors.length === 0, errors, record: result, lineNum };
}

function processImportData(rawData) {
  if (!rawData.length) {
    alert('文件中没有数据');
    return;
  }

  const allFields = new Set();
  rawData.forEach(record => Object.keys(record).forEach(key => allFields.add(key)));
  const { mapping, detectedFields } = mapFields(Object.fromEntries([...allFields].map(k => [k, ''])));
  const validRecords = [];
  const errorRecords = [];
  const allDetectedFields = { ...detectedFields };

  rawData.forEach((record, index) => {
    const recordMapping = buildRecordMapping(record);
    Object.entries(recordMapping).forEach(([field, key]) => {
      if (!allDetectedFields[field]) allDetectedFields[field] = key;
    });
    const result = validateRecord(record, recordMapping, index + 2);
    if (result.valid) {
      validRecords.push(result.record);
    } else {
      errorRecords.push(result);
    }
  });

  importData = { validRecords, errorRecords, detectedFields: allDetectedFields, mapping, rawData };
  showPreview();
}

function buildRecordMapping(record) {
  const recordKeys = Object.keys(record);
  const mapping = {};
  for (const [field, aliases] of Object.entries(fieldMappingConfig)) {
    for (const alias of aliases) {
      const lowerAlias = alias.toLowerCase();
      const match = recordKeys.find(k => {
        const lowerKey = k.toLowerCase().trim();
        return lowerKey === lowerAlias || lowerKey.includes(lowerAlias);
      });
      if (match) {
        mapping[field] = match;
        break;
      }
    }
  }
  return mapping;
}

function showPreview() {
  importArea.classList.add('hidden');
  importPreview.classList.remove('hidden');

  document.querySelector('#fieldCount').textContent = Object.keys(importData.detectedFields).length;
  document.querySelector('#validCount').textContent = importData.validRecords.length;
  document.querySelector('#errorCount').textContent = importData.errorRecords.length;

  const fieldMappingEl = document.querySelector('#fieldMapping');
  fieldMappingEl.innerHTML = `
    <h3>字段识别结果</h3>
    <div class="field-list">
      ${Object.entries(fieldMappingConfig).map(([field, aliases]) => {
        const mapped = importData.detectedFields[field];
        return `<div class="field-item ${mapped ? 'mapped' : 'unmapped'}">
          <span class="field-name">${aliases[0]}</span>
          <span class="field-arrow">→</span>
          <span class="field-source">${mapped || '未识别'}</span>
        </div>`;
      }).join('')}
    </div>
  `;

  const errorSummaryEl = document.querySelector('#errorSummary');
  if (importData.errorRecords.length) {
    const errorPreview = importData.errorRecords.slice(0, 5);
    errorSummaryEl.innerHTML = `
      <h3>错误行摘要</h3>
      <ul class="error-list">
        ${errorPreview.map(err => `<li><strong>第${err.lineNum}行：</strong>${err.errors.join('；')}</li>`).join('')}
        ${importData.errorRecords.length > 5 ? `<li class="more-errors">...还有${importData.errorRecords.length - 5}条错误</li>` : ''}
      </ul>
    `;
  } else {
    errorSummaryEl.innerHTML = '';
  }

  const previewHead = document.querySelector('#previewHead');
  const previewBody = document.querySelector('#previewBody');
  const previewRecords = importData.validRecords.slice(0, 10);

  previewHead.innerHTML = `<tr><th>时间</th><th>地点</th><th>分贝</th><th>来源</th><th>感受</th></tr>`;
  previewBody.innerHTML = previewRecords.map(record => `
    <tr>
      <td>${record.at.replace('T', ' ')}</td>
      <td>${record.location}</td>
      <td>${record.db}dB</td>
      <td>${record.source}</td>
      <td>${record.feeling}</td>
    </tr>
  `).join('');

  if (importData.validRecords.length > 10) {
    previewBody.innerHTML += `<tr><td colspan="5" class="more-rows">...还有${importData.validRecords.length - 10}条记录</td></tr>`;
  }

  document.querySelector('#confirmImport').disabled = importData.validRecords.length === 0;
}

function resetImport() {
  importData = null;
  fileInput.value = '';
  importArea.classList.remove('hidden');
  importPreview.classList.add('hidden');
}

function confirmImport() {
  if (!importData || !importData.validRecords.length) return;
  records = [...importData.validRecords, ...records];
  save();
  render();
  resetImport();
  alert(`成功导入${importData.validRecords.length}条记录`);
}

render();
