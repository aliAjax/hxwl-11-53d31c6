import './styles.css';

const key = 'hxwl-11-noise-records';
const thresholdKey = 'hxwl-11-noise-thresholds';
const monitoringPointsKey = 'hxwl-11-monitoring-points';
const alarmsKey = 'hxwl-11-noise-alarms';
const alarmConfigKey = 'hxwl-11-alarm-config';
const filterViewsKey = 'hxwl-11-filter-views';

const seed = [
  { id: crypto.randomUUID(), location: '老城菜市口', at: '2026-06-05T07:40', db: 76, source: '叫卖与卸货', feeling: '嘈杂', monitoringPointId: null },
  { id: crypto.randomUUID(), location: '滨河步道', at: '2026-06-05T12:30', db: 58, source: '人流', feeling: '可接受', monitoringPointId: null },
  { id: crypto.randomUUID(), location: '高架桥下', at: '2026-06-05T18:20', db: 84, source: '车流', feeling: '刺耳', monitoringPointId: null },
  { id: crypto.randomUUID(), location: '社区广场', at: '2026-06-06T20:10', db: 71, source: '音箱', feeling: '偏吵', monitoringPointId: null },
  { id: crypto.randomUUID(), location: '图书馆外', at: '2026-06-06T15:00', db: 49, source: '环境声', feeling: '安静', monitoringPointId: null }
];

const defaultMonitoringPoints = [
  { id: crypto.randomUUID(), name: '老城菜市口', district: '老城区', latitude: 30.6598, longitude: 104.0633, type: 'commercial', notes: '传统菜市场，早市高峰时段噪声较大' },
  { id: crypto.randomUUID(), name: '滨河步道', district: '河滨区', latitude: 30.6586, longitude: 104.0657, type: 'park', notes: '沿河休闲步道，主要为人流活动噪声' },
  { id: crypto.randomUUID(), name: '高架桥下', district: '交通区', latitude: 30.6612, longitude: 104.0601, type: 'traffic', notes: '城市主干道高架桥下方，车流噪声严重' },
  { id: crypto.randomUUID(), name: '社区广场', district: '居民区', latitude: 30.6575, longitude: 104.0620, type: 'residential', notes: '居民小区中心广场，晚间广场舞活动频繁' },
  { id: crypto.randomUUID(), name: '图书馆外', district: '文化区', latitude: 30.6569, longitude: 104.0645, type: 'school', notes: '市图书馆外围，需要保持安静的区域' }
];

const pointTypes = [
  { value: 'traffic', label: '交通主干道', colorClass: 'point-type-traffic' },
  { value: 'residential', label: '居民区', colorClass: 'point-type-residential' },
  { value: 'commercial', label: '商业区', colorClass: 'point-type-commercial' },
  { value: 'park', label: '公园/绿地', colorClass: 'point-type-park' },
  { value: 'school', label: '学校/医院', colorClass: 'point-type-school' },
  { value: 'other', label: '其他', colorClass: 'point-type-other' }
];

const defaultThresholds = {
  highNoise: 75,
  harsh: 85,
  lowReference: 50
};

const defaultAlarmConfig = {
  multipleExceedThreshold: 3,
  nightStartHour: 22,
  nightEndHour: 6,
  nightNoiseThreshold: 65
};

let records = JSON.parse(localStorage.getItem(key) || 'null') || seed;
let monitoringPoints = JSON.parse(localStorage.getItem(monitoringPointsKey) || 'null') || defaultMonitoringPoints;
let thresholds = JSON.parse(localStorage.getItem(thresholdKey) || 'null') || { ...defaultThresholds };
let alarms = JSON.parse(localStorage.getItem(alarmsKey) || 'null') || [];
let alarmConfig = JSON.parse(localStorage.getItem(alarmConfigKey) || 'null') || { ...defaultAlarmConfig };
let editingId = null;
let editingPointId = null;
let useManualLocation = false;
let selectedMonitoringPointFilter = '';
let alarmStatusFilter = 'all';
let alarmTypeFilter = 'all';

let currentFilters = {
  dateStart: '',
  dateEnd: '',
  locations: [],
  sources: [],
  feelings: [],
  dbMin: '',
  dbMax: '',
  highNoiseStatus: 'all'
};

let filterViews = JSON.parse(localStorage.getItem(filterViewsKey) || 'null') || [];
let activeViewId = null;

function migrateData() {
  records = records.map(record => {
    if (record.monitoringPointId === undefined) {
      return { ...record, monitoringPointId: null };
    }
    return record;
  });

  const locationToPointMap = new Map();
  monitoringPoints.forEach(point => {
    locationToPointMap.set(point.name, point.id);
  });

  records = records.map(record => {
    if (!record.monitoringPointId && locationToPointMap.has(record.location)) {
      return { ...record, monitoringPointId: locationToPointMap.get(record.location) };
    }
    return record;
  });

  save();
}

migrateData();

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="top">
      <div>
        <p>hxwl-11 · port 5111</p>
        <h1>城市噪声切片</h1>
      </div>
      <div class="topButtons">
        <button id="alarmCenterBtn">告警中心</button>
        <button id="monitoringPointsBtn">监测点管理</button>
        <button id="thresholdBtn">阈值设置</button>
        <button id="reportBtn">生成报告</button>
        <button id="reset">载入示例</button>
      </div>
    </header>

    <section class="filter-panel" id="filterPanel">
      <div class="filter-header">
        <div class="filter-title">
          <h2>多维筛选</h2>
          <span class="filter-count" id="filterCount">0 个筛选条件</span>
        </div>
        <div class="filter-actions">
          <div class="view-selector">
            <select id="viewSelector">
              <option value="">选择常用视图</option>
            </select>
            <button id="saveViewBtn" class="secondary">保存视图</button>
            <button id="deleteViewBtn" class="secondary" disabled>删除视图</button>
          </div>
          <button id="resetFiltersBtn" class="secondary">重置筛选</button>
          <button id="toggleFilterBtn" class="primary">展开筛选</button>
        </div>
      </div>
      <div class="filter-body hidden" id="filterBody">
        <div class="filter-grid">
          <div class="filter-group">
            <label>日期范围</label>
            <div class="filter-date-range">
              <input type="date" id="filterDateStart" />
              <span class="filter-separator">至</span>
              <input type="date" id="filterDateEnd" />
            </div>
          </div>
          <div class="filter-group">
            <label>地点</label>
            <select id="filterLocation" multiple size="3"></select>
          </div>
          <div class="filter-group">
            <label>噪声来源</label>
            <select id="filterSource" multiple size="3"></select>
          </div>
          <div class="filter-group">
            <label>主观感受</label>
            <select id="filterFeeling" multiple size="3">
              <option value="安静">安静</option>
              <option value="可接受">可接受</option>
              <option value="偏吵">偏吵</option>
              <option value="嘈杂">嘈杂</option>
              <option value="刺耳">刺耳</option>
            </select>
          </div>
          <div class="filter-group">
            <label>分贝区间</label>
            <div class="filter-db-range">
              <input type="number" id="filterDbMin" min="20" max="130" placeholder="最小值" />
              <span class="filter-separator">-</span>
              <input type="number" id="filterDbMax" min="20" max="130" placeholder="最大值" />
              <span class="filter-unit">dB</span>
            </div>
          </div>
          <div class="filter-group">
            <label>高噪声状态</label>
            <select id="filterHighNoise">
              <option value="all">全部</option>
              <option value="high">仅高噪声</option>
              <option value="normal">仅正常噪声</option>
            </select>
          </div>
        </div>
        <div class="filter-active-tags" id="activeFilterTags"></div>
      </div>
    </section>

    <section class="summary" id="summary"></section>

    <section class="workspace">
      <form id="form" class="panel">
        <h2>新增观测</h2>
        <div id="locationInputContainer">
          <div class="location-input-group" id="monitoringPointSelectGroup">
            <select name="monitoringPointId" id="monitoringPointSelect">
              <option value="">选择监测点</option>
            </select>
            <button type="button" class="location-toggle-btn" id="toggleManualLocation">手动输入</button>
          </div>
          <div class="location-input-group hidden" id="manualLocationGroup">
            <input name="location" placeholder="街区或地点" />
            <button type="button" class="location-toggle-btn" id="toggleSelectLocation">选择监测点</button>
          </div>
        </div>
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
          <div class="filter-section">
            <select id="monitoringPointFilter">
              <option value="">全部监测点</option>
            </select>
            <input id="dayFilter" type="date" />
          </div>
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
      <div class="tableWrap"><table><thead><tr><th>时间</th><th>监测点</th><th>地点</th><th>分贝</th><th>来源</th><th>感受</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
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

    <div class="threshold-overlay hidden" id="thresholdOverlay">
      <div class="threshold-panel">
        <div class="threshold-header">
          <h2>噪声阈值设置</h2>
          <button class="threshold-close" id="thresholdClose">&times;</button>
        </div>
        <div class="threshold-content">
          <div class="threshold-item">
            <label>
              <span class="threshold-label">高噪声阈值</span>
              <span class="threshold-desc">高于此值判定为高噪声，影响占比统计和记录筛选</span>
            </label>
            <div class="threshold-input-group">
              <input type="range" id="highNoiseRange" min="60" max="90" step="1" />
              <input type="number" id="highNoiseInput" min="20" max="130" />
              <span class="threshold-unit">dB</span>
            </div>
            <div class="threshold-indicator high-noise"></div>
          </div>
          <div class="threshold-item">
            <label>
              <span class="threshold-label">刺耳阈值</span>
              <span class="threshold-desc">高于此值标记为刺耳，图表和列表中特别高亮</span>
            </label>
            <div class="threshold-input-group">
              <input type="range" id="harshRange" min="70" max="120" step="1" />
              <input type="number" id="harshInput" min="20" max="130" />
              <span class="threshold-unit">dB</span>
            </div>
            <div class="threshold-indicator harsh"></div>
          </div>
          <div class="threshold-item">
            <label>
              <span class="threshold-label">低噪声参考线</span>
              <span class="threshold-desc">图表中的参考线，低于此值为安静环境</span>
            </label>
            <div class="threshold-input-group">
              <input type="range" id="lowReferenceRange" min="20" max="70" step="1" />
              <input type="number" id="lowReferenceInput" min="20" max="130" />
              <span class="threshold-unit">dB</span>
            </div>
            <div class="threshold-indicator low-noise"></div>
          </div>
          <div class="threshold-preview">
            <h4>当前配置预览</h4>
            <div class="threshold-preview-bars">
              <div class="preview-bar">
                <span class="preview-bar-label">安静</span>
                <div class="preview-bar-track">
                  <div class="preview-bar-fill low" id="previewLow"></div>
                </div>
                <span class="preview-bar-value" id="previewLowValue">0-50dB</span>
              </div>
              <div class="preview-bar">
                <span class="preview-bar-label">正常</span>
                <div class="preview-bar-track">
                  <div class="preview-bar-fill normal" id="previewNormal"></div>
                </div>
                <span class="preview-bar-value" id="previewNormalValue">50-75dB</span>
              </div>
              <div class="preview-bar">
                <span class="preview-bar-label">高噪声</span>
                <div class="preview-bar-track">
                  <div class="preview-bar-fill high" id="previewHigh"></div>
                </div>
                <span class="preview-bar-value" id="previewHighValue">75-85dB</span>
              </div>
              <div class="preview-bar">
                <span class="preview-bar-label">刺耳</span>
                <div class="preview-bar-track">
                  <div class="preview-bar-fill harsh" id="previewHarsh"></div>
                </div>
                <span class="preview-bar-value" id="previewHarshValue">85dB+</span>
              </div>
            </div>
          </div>
        </div>
        <div class="threshold-actions">
          <button class="secondary" id="resetThresholds">恢复默认</button>
          <button class="primary" id="saveThresholds">保存设置</button>
        </div>
      </div>
    </div>

    <div class="monitoring-point-overlay hidden" id="monitoringPointOverlay">
      <div class="monitoring-point-panel">
        <div class="monitoring-point-header">
          <h2 id="monitoringPointTitle">固定监测点管理</h2>
          <button class="monitoring-point-close" id="monitoringPointClose">&times;</button>
        </div>
        <div class="monitoring-point-content">
          <form id="monitoringPointForm" class="monitoring-point-form">
            <div>
              <label>名称 <span style="color:#d94636">*</span></label>
              <input name="name" placeholder="监测点名称" required />
            </div>
            <div>
              <label>街区 <span style="color:#d94636">*</span></label>
              <input name="district" placeholder="所属街区" required />
            </div>
            <div>
              <label>纬度 <span style="color:#d94636">*</span></label>
              <input name="latitude" type="number" step="0.0001" placeholder="-90 到 90" min="-90" max="90" required />
            </div>
            <div>
              <label>经度 <span style="color:#d94636">*</span></label>
              <input name="longitude" type="number" step="0.0001" placeholder="-180 到 180" min="-180" max="180" required />
            </div>
            <div>
              <label>点位类型 <span style="color:#d94636">*</span></label>
              <select name="type" required>
                <option value="">请选择类型</option>
                <option value="traffic">交通主干道</option>
                <option value="residential">居民区</option>
                <option value="commercial">商业区</option>
                <option value="park">公园/绿地</option>
                <option value="school">学校/医院</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label>备注</label>
              <input name="notes" placeholder="补充说明信息" />
            </div>
            <div class="form-actions">
              <button type="button" class="secondary" id="cancelPointEdit">取消</button>
              <button type="submit" class="primary">保存监测点</button>
            </div>
          </form>

          <div class="monitoring-point-list">
            <h3>已有的监测点</h3>
            <div id="monitoringPointsList"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="alarm-center-overlay hidden" id="alarmCenterOverlay">
      <div class="alarm-center-panel">
        <div class="alarm-center-header">
          <h2>噪声告警中心</h2>
          <button class="alarm-center-close" id="alarmCenterClose">&times;</button>
        </div>
        <div class="alarm-center-content">
          <div class="alarm-summary">
            <div class="alarm-stat-card pending">
              <span class="alarm-stat-label">待处理</span>
              <strong class="alarm-stat-value" id="alarmPendingCount">0</strong>
            </div>
            <div class="alarm-stat-card confirmed">
              <span class="alarm-stat-label">已确认</span>
              <strong class="alarm-stat-value" id="alarmConfirmedCount">0</strong>
            </div>
            <div class="alarm-stat-card ignored">
              <span class="alarm-stat-label">已忽略</span>
              <strong class="alarm-stat-value" id="alarmIgnoredCount">0</strong>
            </div>
            <div class="alarm-stat-card total">
              <span class="alarm-stat-label">总计</span>
              <strong class="alarm-stat-value" id="alarmTotalCount">0</strong>
            </div>
          </div>

          <div class="alarm-filters">
            <div class="filter-group">
              <label>状态筛选：</label>
              <select id="alarmStatusFilter">
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="confirmed">已确认</option>
                <option value="ignored">已忽略</option>
              </select>
            </div>
            <div class="filter-group">
              <label>类型筛选：</label>
              <select id="alarmTypeFilter">
                <option value="all">全部类型</option>
                <option value="single">单条超阈值</option>
                <option value="multiple">日内多次超标</option>
                <option value="nighttime">夜间高噪声</option>
              </select>
            </div>
            <button class="secondary" id="recalculateAlarmsBtn">重新计算告警</button>
          </div>

          <div class="alarm-rules-config">
            <h3>告警规则配置</h3>
            <div class="rules-grid">
              <div class="rule-item">
                <label>日内多次超标阈值</label>
                <input type="number" id="multipleExceedThreshold" min="2" max="10" />
                <span class="rule-desc">同一地点一天内超过此次数即告警</span>
              </div>
              <div class="rule-item">
                <label>夜间开始时间</label>
                <input type="number" id="nightStartHour" min="0" max="23" />
                <span class="rule-desc">夜间时段开始（小时，24小时制）</span>
              </div>
              <div class="rule-item">
                <label>夜间结束时间</label>
                <input type="number" id="nightEndHour" min="0" max="23" />
                <span class="rule-desc">夜间时段结束（小时，24小时制）</span>
              </div>
              <div class="rule-item">
                <label>夜间噪声阈值</label>
                <input type="number" id="nightNoiseThreshold" min="20" max="130" />
                <span class="rule-desc">夜间时段超过此值即告警（dB）</span>
              </div>
            </div>
            <div class="alarm-config-actions">
              <button class="secondary" id="resetAlarmConfig">恢复默认</button>
              <button class="primary" id="saveAlarmConfig">保存配置</button>
            </div>
          </div>

          <div class="alarm-list-section">
            <h3>告警列表</h3>
            <div id="alarmList" class="alarm-list"></div>
          </div>
        </div>
      </div>
    </div>
  </main>
`;

const form = document.querySelector('#form');
const search = document.querySelector('#search');
const dayFilter = document.querySelector('#dayFilter');
const monitoringPointFilter = document.querySelector('#monitoringPointFilter');
const monitoringPointSelect = document.querySelector('#monitoringPointSelect');
const monitoringPointForm = document.querySelector('#monitoringPointForm');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  let location = data.location;
  let monitoringPointId = data.monitoringPointId || null;

  if (monitoringPointId) {
    const point = monitoringPoints.find(p => p.id === monitoringPointId);
    if (point) {
      location = point.name;
    }
  }

  if (!location) {
    alert('请选择监测点或输入地点');
    return;
  }

  const item = {
    ...data,
    location,
    monitoringPointId,
    db: Number(data.db),
    id: editingId || crypto.randomUUID()
  };

  records = editingId ? records.map((record) => (record.id === editingId ? item : record)) : [item, ...records];
  editingId = null;
  form.reset();
  useManualLocation = false;
  updateLocationInput();
  save();
  recalculateAlarms();
  render();
});
search.addEventListener('input', render);
dayFilter.addEventListener('change', render);
monitoringPointFilter.addEventListener('change', (e) => {
  selectedMonitoringPointFilter = e.target.value;
  render();
});

document.querySelector('#toggleFilterBtn').addEventListener('click', () => {
  const body = document.querySelector('#filterBody');
  const btn = document.querySelector('#toggleFilterBtn');
  body.classList.toggle('hidden');
  btn.textContent = body.classList.contains('hidden') ? '展开筛选' : '收起筛选';
});

document.querySelector('#resetFiltersBtn').addEventListener('click', resetFilters);
document.querySelector('#saveViewBtn').addEventListener('click', saveCurrentView);
document.querySelector('#deleteViewBtn').addEventListener('click', deleteActiveView);

document.querySelector('#viewSelector').addEventListener('change', (e) => {
  if (e.target.value) {
    loadView(e.target.value);
  } else {
    activeViewId = null;
    updateFilterUI();
  }
});

document.querySelector('#filterDateStart').addEventListener('change', (e) => {
  currentFilters.dateStart = e.target.value;
  activeViewId = null;
  updateFilterUI();
  render();
});

document.querySelector('#filterDateEnd').addEventListener('change', (e) => {
  currentFilters.dateEnd = e.target.value;
  activeViewId = null;
  updateFilterUI();
  render();
});

document.querySelector('#filterLocation').addEventListener('change', (e) => {
  currentFilters.locations = Array.from(e.target.selectedOptions).map(opt => opt.value);
  activeViewId = null;
  updateFilterUI();
  render();
});

document.querySelector('#filterSource').addEventListener('change', (e) => {
  currentFilters.sources = Array.from(e.target.selectedOptions).map(opt => opt.value);
  activeViewId = null;
  updateFilterUI();
  render();
});

document.querySelector('#filterFeeling').addEventListener('change', (e) => {
  currentFilters.feelings = Array.from(e.target.selectedOptions).map(opt => opt.value);
  activeViewId = null;
  updateFilterUI();
  render();
});

document.querySelector('#filterDbMin').addEventListener('input', (e) => {
  currentFilters.dbMin = e.target.value;
  activeViewId = null;
  updateFilterUI();
  render();
});

document.querySelector('#filterDbMax').addEventListener('input', (e) => {
  currentFilters.dbMax = e.target.value;
  activeViewId = null;
  updateFilterUI();
  render();
});

document.querySelector('#filterHighNoise').addEventListener('change', (e) => {
  currentFilters.highNoiseStatus = e.target.value;
  activeViewId = null;
  updateFilterUI();
  render();
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-tag-remove')) {
    const index = parseInt(e.target.dataset.tagIndex);
    removeFilterTag(index);
  }
  if (e.target.id === 'clearAllFilters') {
    resetFilters();
  }
});

document.querySelector('#toggleManualLocation').addEventListener('click', () => {
  useManualLocation = true;
  updateLocationInput();
});

document.querySelector('#toggleSelectLocation').addEventListener('click', () => {
  useManualLocation = false;
  updateLocationInput();
});

document.querySelector('#alarmCenterBtn').addEventListener('click', openAlarmCenter);
document.querySelector('#alarmCenterClose').addEventListener('click', closeAlarmCenter);
document.querySelector('#alarmCenterOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'alarmCenterOverlay') closeAlarmCenter();
});

document.querySelector('#alarmStatusFilter').addEventListener('change', (e) => {
  alarmStatusFilter = e.target.value;
  renderAlarmCenter();
});
document.querySelector('#alarmTypeFilter').addEventListener('change', (e) => {
  alarmTypeFilter = e.target.value;
  renderAlarmCenter();
});
document.querySelector('#recalculateAlarmsBtn').addEventListener('click', () => {
  recalculateAlarms();
  renderAlarmCenter();
});
document.querySelector('#resetAlarmConfig').addEventListener('click', () => {
  alarmConfig = { ...defaultAlarmConfig };
  saveAlarmConfig();
  loadAlarmConfig();
  recalculateAlarms();
  renderAlarmCenter();
});
document.querySelector('#saveAlarmConfig').addEventListener('click', () => {
  const multipleExceedThreshold = parseInt(document.querySelector('#multipleExceedThreshold').value);
  const nightStartHour = parseInt(document.querySelector('#nightStartHour').value);
  const nightEndHour = parseInt(document.querySelector('#nightEndHour').value);
  const nightNoiseThreshold = parseInt(document.querySelector('#nightNoiseThreshold').value);

  if (isNaN(multipleExceedThreshold) || multipleExceedThreshold < 2 || multipleExceedThreshold > 10) {
    alert('日内多次超标阈值必须在2-10之间');
    return;
  }
  if (isNaN(nightStartHour) || nightStartHour < 0 || nightStartHour > 23) {
    alert('夜间开始时间必须在0-23之间');
    return;
  }
  if (isNaN(nightEndHour) || nightEndHour < 0 || nightEndHour > 23) {
    alert('夜间结束时间必须在0-23之间');
    return;
  }
  if (isNaN(nightNoiseThreshold) || nightNoiseThreshold < 20 || nightNoiseThreshold > 130) {
    alert('夜间噪声阈值必须在20-130之间');
    return;
  }

  alarmConfig = { multipleExceedThreshold, nightStartHour, nightEndHour, nightNoiseThreshold };
  saveAlarmConfig();
  recalculateAlarms();
  renderAlarmCenter();
  alert('告警配置已保存');
});

document.querySelector('#monitoringPointsBtn').addEventListener('click', openMonitoringPointPanel);
document.querySelector('#monitoringPointClose').addEventListener('click', closeMonitoringPointPanel);
document.querySelector('#monitoringPointOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'monitoringPointOverlay') closeMonitoringPointPanel();
});

document.querySelector('#cancelPointEdit').addEventListener('click', () => {
  editingPointId = null;
  monitoringPointForm.reset();
});

monitoringPointForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(monitoringPointForm).entries());
  const point = {
    ...data,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    id: editingPointId || crypto.randomUUID()
  };

  if (editingPointId) {
    monitoringPoints = monitoringPoints.map(p => p.id === editingPointId ? point : p);
  } else {
    monitoringPoints = [point, ...monitoringPoints];
  }

  editingPointId = null;
  monitoringPointForm.reset();
  saveMonitoringPoints();
  renderMonitoringPointsList();
  updateMonitoringPointSelects();
  render();
});

document.querySelector('#reset').addEventListener('click', () => {
  records = seed;
  monitoringPoints = defaultMonitoringPoints;
  save();
  saveMonitoringPoints();
  recalculateAlarms();
  updateMonitoringPointSelects();
  render();
});

document.querySelector('#thresholdBtn').addEventListener('click', openThresholdPanel);
document.querySelector('#thresholdClose').addEventListener('click', closeThresholdPanel);
document.querySelector('#thresholdOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'thresholdOverlay') closeThresholdPanel();
});

document.querySelector('#highNoiseRange').addEventListener('input', (e) => {
  document.querySelector('#highNoiseInput').value = e.target.value;
  updateThresholdPreview();
});
document.querySelector('#highNoiseInput').addEventListener('input', (e) => {
  document.querySelector('#highNoiseRange').value = e.target.value;
  updateThresholdPreview();
});

document.querySelector('#harshRange').addEventListener('input', (e) => {
  document.querySelector('#harshInput').value = e.target.value;
  updateThresholdPreview();
});
document.querySelector('#harshInput').addEventListener('input', (e) => {
  document.querySelector('#harshRange').value = e.target.value;
  updateThresholdPreview();
});

document.querySelector('#lowReferenceRange').addEventListener('input', (e) => {
  document.querySelector('#lowReferenceInput').value = e.target.value;
  updateThresholdPreview();
});
document.querySelector('#lowReferenceInput').addEventListener('input', (e) => {
  document.querySelector('#lowReferenceRange').value = e.target.value;
  updateThresholdPreview();
});

document.querySelector('#resetThresholds').addEventListener('click', () => {
  thresholds = { ...defaultThresholds };
  saveThresholds();
  recalculateAlarms();
  document.querySelector('#highNoiseRange').value = thresholds.highNoise;
  document.querySelector('#highNoiseInput').value = thresholds.highNoise;
  document.querySelector('#harshRange').value = thresholds.harsh;
  document.querySelector('#harshInput').value = thresholds.harsh;
  document.querySelector('#lowReferenceRange').value = thresholds.lowReference;
  document.querySelector('#lowReferenceInput').value = thresholds.lowReference;
  updateThresholdPreview();
  render();
});

document.querySelector('#saveThresholds').addEventListener('click', () => {
  const highNoise = parseInt(document.querySelector('#highNoiseInput').value);
  const harsh = parseInt(document.querySelector('#harshInput').value);
  const lowReference = parseInt(document.querySelector('#lowReferenceInput').value);

  if (isNaN(highNoise) || isNaN(harsh) || isNaN(lowReference)) {
    alert('请输入有效的数值');
    return;
  }
  if (lowReference >= highNoise) {
    alert('低噪声参考线必须小于高噪声阈值');
    return;
  }
  if (highNoise >= harsh) {
    alert('高噪声阈值必须小于刺耳阈值');
    return;
  }

  thresholds = { highNoise, harsh, lowReference };
  saveThresholds();
  recalculateAlarms();
  closeThresholdPanel();
  render();
});

function save() {
  localStorage.setItem(key, JSON.stringify(records));
}

function saveThresholds() {
  localStorage.setItem(thresholdKey, JSON.stringify(thresholds));
}

function saveMonitoringPoints() {
  localStorage.setItem(monitoringPointsKey, JSON.stringify(monitoringPoints));
}

function saveAlarms() {
  localStorage.setItem(alarmsKey, JSON.stringify(alarms));
}

function saveAlarmConfig() {
  localStorage.setItem(alarmConfigKey, JSON.stringify(alarmConfig));
}

function saveFilterViews() {
  localStorage.setItem(filterViewsKey, JSON.stringify(filterViews));
}

function getUniqueLocations() {
  return [...new Set(records.map(r => r.location))].sort();
}

function getUniqueSources() {
  return [...new Set(records.map(r => r.source))].sort();
}

function applyFilters(data) {
  return data.filter(record => {
    if (currentFilters.dateStart && record.at.slice(0, 10) < currentFilters.dateStart) {
      return false;
    }
    if (currentFilters.dateEnd && record.at.slice(0, 10) > currentFilters.dateEnd) {
      return false;
    }
    if (currentFilters.locations.length > 0 && !currentFilters.locations.includes(record.location)) {
      return false;
    }
    if (currentFilters.sources.length > 0 && !currentFilters.sources.includes(record.source)) {
      return false;
    }
    if (currentFilters.feelings.length > 0 && !currentFilters.feelings.includes(record.feeling)) {
      return false;
    }
    if (currentFilters.dbMin !== '' && record.db < Number(currentFilters.dbMin)) {
      return false;
    }
    if (currentFilters.dbMax !== '' && record.db > Number(currentFilters.dbMax)) {
      return false;
    }
    if (currentFilters.highNoiseStatus === 'high' && !isHighNoise(record.db)) {
      return false;
    }
    if (currentFilters.highNoiseStatus === 'normal' && isHighNoise(record.db)) {
      return false;
    }
    return true;
  });
}

function countActiveFilters() {
  let count = 0;
  if (currentFilters.dateStart) count++;
  if (currentFilters.dateEnd) count++;
  if (currentFilters.locations.length > 0) count++;
  if (currentFilters.sources.length > 0) count++;
  if (currentFilters.feelings.length > 0) count++;
  if (currentFilters.dbMin !== '') count++;
  if (currentFilters.dbMax !== '') count++;
  if (currentFilters.highNoiseStatus !== 'all') count++;
  return count;
}

function getActiveFilterTags() {
  const tags = [];
  if (currentFilters.dateStart || currentFilters.dateEnd) {
    const start = currentFilters.dateStart || '不限';
    const end = currentFilters.dateEnd || '不限';
    tags.push({ label: `日期: ${start} ~ ${end}`, type: 'date' });
  }
  if (currentFilters.locations.length > 0) {
    tags.push({ label: `地点: ${currentFilters.locations.join(', ')}`, type: 'location', values: currentFilters.locations });
  }
  if (currentFilters.sources.length > 0) {
    tags.push({ label: `来源: ${currentFilters.sources.join(', ')}`, type: 'source', values: currentFilters.sources });
  }
  if (currentFilters.feelings.length > 0) {
    tags.push({ label: `感受: ${currentFilters.feelings.join(', ')}`, type: 'feeling', values: currentFilters.feelings });
  }
  if (currentFilters.dbMin !== '' || currentFilters.dbMax !== '') {
    const min = currentFilters.dbMin || '不限';
    const max = currentFilters.dbMax || '不限';
    tags.push({ label: `分贝: ${min} ~ ${max} dB`, type: 'db' });
  }
  if (currentFilters.highNoiseStatus === 'high') {
    tags.push({ label: '状态: 仅高噪声', type: 'status' });
  } else if (currentFilters.highNoiseStatus === 'normal') {
    tags.push({ label: '状态: 仅正常噪声', type: 'status' });
  }
  return tags;
}

function resetFilters() {
  currentFilters = {
    dateStart: '',
    dateEnd: '',
    locations: [],
    sources: [],
    feelings: [],
    dbMin: '',
    dbMax: '',
    highNoiseStatus: 'all'
  };
  activeViewId = null;
  updateFilterUI();
  render();
}

function updateFilterUI() {
  document.querySelector('#filterDateStart').value = currentFilters.dateStart;
  document.querySelector('#filterDateEnd').value = currentFilters.dateEnd;
  document.querySelector('#filterDbMin').value = currentFilters.dbMin;
  document.querySelector('#filterDbMax').value = currentFilters.dbMax;
  document.querySelector('#filterHighNoise').value = currentFilters.highNoiseStatus;

  const locationSelect = document.querySelector('#filterLocation');
  const locations = getUniqueLocations();
  locationSelect.innerHTML = locations.map(loc => 
    `<option value="${loc}" ${currentFilters.locations.includes(loc) ? 'selected' : ''}>${loc}</option>`
  ).join('');

  const sourceSelect = document.querySelector('#filterSource');
  const sources = getUniqueSources();
  sourceSelect.innerHTML = sources.map(src => 
    `<option value="${src}" ${currentFilters.sources.includes(src) ? 'selected' : ''}>${src}</option>`
  ).join('');

  const feelingSelect = document.querySelector('#filterFeeling');
  Array.from(feelingSelect.options).forEach(option => {
    option.selected = currentFilters.feelings.includes(option.value);
  });

  const filterCount = countActiveFilters();
  document.querySelector('#filterCount').textContent = `${filterCount} 个筛选条件`;

  const tags = getActiveFilterTags();
  const tagsContainer = document.querySelector('#activeFilterTags');
  if (tags.length > 0) {
    tagsContainer.innerHTML = `
      <div class="filter-tags-label">当前筛选：</div>
      <div class="filter-tags-list">
        ${tags.map((tag, index) => `
          <span class="filter-tag">
            ${tag.label}
            <button class="filter-tag-remove" data-tag-index="${index}">&times;</button>
          </span>
        `).join('')}
        <button class="filter-clear-all" id="clearAllFilters">清除全部</button>
      </div>
    `;
  } else {
    tagsContainer.innerHTML = '';
  }

  updateViewSelector();
  document.querySelector('#deleteViewBtn').disabled = !activeViewId;
}

function updateViewSelector() {
  const selector = document.querySelector('#viewSelector');
  selector.innerHTML = '<option value="">选择常用视图</option>' +
    filterViews.map(view => 
      `<option value="${view.id}" ${activeViewId === view.id ? 'selected' : ''}>${view.name}</option>`
    ).join('');
}

function saveCurrentView() {
  const name = prompt('请输入视图名称：');
  if (!name || name.trim() === '') return;

  const newView = {
    id: crypto.randomUUID(),
    name: name.trim(),
    filters: JSON.parse(JSON.stringify(currentFilters)),
    createdAt: new Date().toISOString()
  };

  filterViews.push(newView);
  saveFilterViews();
  activeViewId = newView.id;
  updateFilterUI();
  alert(`视图"${name}"已保存`);
}

function loadView(viewId) {
  const view = filterViews.find(v => v.id === viewId);
  if (!view) return;

  currentFilters = JSON.parse(JSON.stringify(view.filters));
  activeViewId = viewId;
  updateFilterUI();
  render();
}

function deleteActiveView() {
  if (!activeViewId) return;
  const view = filterViews.find(v => v.id === activeViewId);
  if (!view) return;

  if (!confirm(`确定要删除视图"${view.name}"吗？`)) return;

  filterViews = filterViews.filter(v => v.id !== activeViewId);
  saveFilterViews();
  activeViewId = null;
  updateFilterUI();
  alert('视图已删除');
}

function removeFilterTag(index) {
  const tags = getActiveFilterTags();
  if (index >= tags.length) return;

  const tag = tags[index];
  switch (tag.type) {
    case 'date':
      currentFilters.dateStart = '';
      currentFilters.dateEnd = '';
      break;
    case 'location':
      currentFilters.locations = [];
      break;
    case 'source':
      currentFilters.sources = [];
      break;
    case 'feeling':
      currentFilters.feelings = [];
      break;
    case 'db':
      currentFilters.dbMin = '';
      currentFilters.dbMax = '';
      break;
    case 'status':
      currentFilters.highNoiseStatus = 'all';
      break;
  }
  activeViewId = null;
  updateFilterUI();
  render();
}

function isNighttime(datetimeStr) {
  const hour = new Date(datetimeStr).getHours();
  const { nightStartHour, nightEndHour } = alarmConfig;
  if (nightStartHour < nightEndHour) {
    return hour >= nightStartHour && hour < nightEndHour;
  } else {
    return hour >= nightStartHour || hour < nightEndHour;
  }
}

function generateSingleExceedAlarms() {
  const newAlarms = [];
  records.forEach(record => {
    if (record.db >= thresholds.harsh) {
      const alarmId = `single-${record.id}`;
      newAlarms.push({
        id: alarmId,
        type: 'single',
        typeLabel: '单条超阈值',
        status: 'pending',
        recordId: record.id,
        location: record.location,
        at: record.at,
        db: record.db,
        source: record.source,
        threshold: thresholds.harsh,
        message: `记录噪声${record.db}dB超过刺耳阈值${thresholds.harsh}dB`,
        createdAt: new Date().toISOString()
      });
    }
  });
  return newAlarms;
}

function generateMultipleExceedAlarms() {
  const newAlarms = [];
  const locationDayMap = new Map();

  records.forEach(record => {
    if (record.db >= thresholds.highNoise) {
      const day = record.at.slice(0, 10);
      const key = `${record.location}-${day}`;
      if (!locationDayMap.has(key)) {
        locationDayMap.set(key, []);
      }
      locationDayMap.get(key).push(record);
    }
  });

  const { multipleExceedThreshold } = alarmConfig;
  locationDayMap.forEach((dayRecords, key) => {
    if (dayRecords.length >= multipleExceedThreshold) {
      const alarmId = `multiple-${key}`;
      const maxDb = Math.max(...dayRecords.map(r => r.db));
      const location = dayRecords[0].location;
      const day = key.split('-').slice(1, 4).join('-');
      newAlarms.push({
        id: alarmId,
        type: 'multiple',
        typeLabel: '日内多次超标',
        status: 'pending',
        location,
        day,
        recordCount: dayRecords.length,
        maxDb,
        threshold: multipleExceedThreshold,
        noiseThreshold: thresholds.highNoise,
        recordIds: dayRecords.map(r => r.id),
        message: `${location}在${day}共有${dayRecords.length}条记录超过高噪声阈值${thresholds.highNoise}dB，最高${maxDb}dB`,
        createdAt: new Date().toISOString()
      });
    }
  });
  return newAlarms;
}

function generateNighttimeAlarms() {
  const newAlarms = [];
  records.forEach(record => {
    if (isNighttime(record.at) && record.db >= alarmConfig.nightNoiseThreshold) {
      const alarmId = `nighttime-${record.id}`;
      newAlarms.push({
        id: alarmId,
        type: 'nighttime',
        typeLabel: '夜间高噪声',
        status: 'pending',
        recordId: record.id,
        location: record.location,
        at: record.at,
        db: record.db,
        source: record.source,
        threshold: alarmConfig.nightNoiseThreshold,
        nightHours: `${alarmConfig.nightStartHour}:00-${alarmConfig.nightEndHour}:00`,
        message: `夜间时段${record.at.slice(11, 16)}记录噪声${record.db}dB超过夜间阈值${alarmConfig.nightNoiseThreshold}dB`,
        createdAt: new Date().toISOString()
      });
    }
  });
  return newAlarms;
}

function recalculateAlarms() {
  const existingAlarmMap = new Map(alarms.map(alarm => [alarm.id, alarm]));
  const singleAlarms = generateSingleExceedAlarms();
  const multipleAlarms = generateMultipleExceedAlarms();
  const nighttimeAlarms = generateNighttimeAlarms();

  alarms = [
    ...singleAlarms,
    ...multipleAlarms,
    ...nighttimeAlarms
  ].map(alarm => {
    const existing = existingAlarmMap.get(alarm.id);
    if (!existing) return alarm;

    return {
      ...alarm,
      status: existing.status,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt
    };
  });

  saveAlarms();
}

function updateAlarmStatus(alarmId, status) {
  alarms = alarms.map(a =>
    a.id === alarmId ? { ...a, status, updatedAt: new Date().toISOString() } : a
  );
  saveAlarms();
  renderAlarmCenter();
}

function getMonitoringPointById(id) {
  return monitoringPoints.find(p => p.id === id) || null;
}

function getPointTypeInfo(typeValue) {
  return pointTypes.find(t => t.value === typeValue) || pointTypes[pointTypes.length - 1];
}

function updateLocationInput() {
  const selectGroup = document.querySelector('#monitoringPointSelectGroup');
  const manualGroup = document.querySelector('#manualLocationGroup');
  const locationInput = form.elements['location'];
  const pointSelect = form.elements['monitoringPointId'];

  if (useManualLocation) {
    selectGroup.classList.add('hidden');
    manualGroup.classList.remove('hidden');
    locationInput.required = true;
    pointSelect.required = false;
  } else {
    selectGroup.classList.remove('hidden');
    manualGroup.classList.add('hidden');
    locationInput.required = false;
    pointSelect.required = true;
  }
}

function updateMonitoringPointSelects() {
  const options = monitoringPoints
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(p => `<option value="${p.id}">${p.name} (${p.district})</option>`)
    .join('');

  monitoringPointSelect.innerHTML = `<option value="">选择监测点</option>${options}`;
  monitoringPointFilter.innerHTML = `<option value="">全部监测点</option>${options}`;
  if (selectedMonitoringPointFilter && getMonitoringPointById(selectedMonitoringPointFilter)) {
    monitoringPointFilter.value = selectedMonitoringPointFilter;
  } else {
    selectedMonitoringPointFilter = '';
    monitoringPointFilter.value = '';
  }
}

function openMonitoringPointPanel() {
  document.querySelector('#monitoringPointOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  editingPointId = null;
  monitoringPointForm.reset();
  renderMonitoringPointsList();
}

function closeMonitoringPointPanel() {
  document.querySelector('#monitoringPointOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  editingPointId = null;
  monitoringPointForm.reset();
}

function renderMonitoringPointsList() {
  const listEl = document.querySelector('#monitoringPointsList');

  if (!monitoringPoints.length) {
    listEl.innerHTML = '<p class="empty">暂无监测点，请先添加</p>';
    return;
  }

  listEl.innerHTML = monitoringPoints
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(point => {
      const typeInfo = getPointTypeInfo(point.type);
      const recordCount = records.filter(r => r.monitoringPointId === point.id).length;
      const pointRecords = records.filter(r => r.monitoringPointId === point.id);
      const avgDb = pointRecords.length ? average(pointRecords.map(r => r.db)).toFixed(1) : '--';

      return `
        <div class="monitoring-point-item">
          <div class="monitoring-point-info">
            <h4>${point.name}</h4>
            <div class="point-meta">
              <span>📍 ${point.district}</span>
              <span class="point-type-badge ${typeInfo.colorClass}">${typeInfo.label}</span>
              <span>📊 ${recordCount} 条记录</span>
              ${pointRecords.length ? `<span>🔊 平均 ${avgDb}dB</span>` : ''}
            </div>
            <div class="point-coords">
              🗺️ 坐标：${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}
            </div>
            ${point.notes ? `<div class="point-notes">📝 ${point.notes}</div>` : ''}
          </div>
          <div class="monitoring-point-actions">
            <button class="secondary" data-edit-point="${point.id}">编辑</button>
            <button class="secondary" data-del-point="${point.id}">删除</button>
          </div>
        </div>
      `;
    }).join('');

  listEl.querySelectorAll('[data-edit-point]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pointId = btn.dataset.editPoint;
      const point = getMonitoringPointById(pointId);
      if (point) {
        editingPointId = pointId;
        Object.entries(point).forEach(([name, value]) => {
          if (monitoringPointForm.elements[name]) {
            monitoringPointForm.elements[name].value = value;
          }
        });
        monitoringPointForm.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  listEl.querySelectorAll('[data-del-point]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pointId = btn.dataset.delPoint;
      const point = getMonitoringPointById(pointId);
      const relatedRecords = records.filter(r => r.monitoringPointId === pointId);

      let confirmMsg = `确定要删除监测点"${point.name}"吗？`;
      if (relatedRecords.length > 0) {
        confirmMsg += `\n\n该监测点关联了 ${relatedRecords.length} 条观测记录，删除后这些记录将保留但不再关联任何监测点。`;
      }

      if (confirm(confirmMsg)) {
        records = records.map(r => {
          if (r.monitoringPointId === pointId) {
            return { ...r, monitoringPointId: null };
          }
          return r;
        });
        monitoringPoints = monitoringPoints.filter(p => p.id !== pointId);
        save();
        saveMonitoringPoints();
        recalculateAlarms();
        renderMonitoringPointsList();
        updateMonitoringPointSelects();
        render();
      }
    });
  });
}

function getNoiseLevel(db) {
  if (db >= thresholds.harsh) return 'harsh';
  if (db >= thresholds.highNoise) return 'high';
  if (db >= thresholds.lowReference) return 'normal';
  return 'low';
}

function getNoiseColor(db) {
  const level = getNoiseLevel(db);
  const colors = {
    low: '#22c55e',
    normal: '#eab308',
    high: '#f97316',
    harsh: '#d94636'
  };
  return colors[level];
}

function isHighNoise(db) {
  return db >= thresholds.highNoise;
}

function openThresholdPanel() {
  document.querySelector('#thresholdOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.querySelector('#highNoiseRange').value = thresholds.highNoise;
  document.querySelector('#highNoiseInput').value = thresholds.highNoise;
  document.querySelector('#harshRange').value = thresholds.harsh;
  document.querySelector('#harshInput').value = thresholds.harsh;
  document.querySelector('#lowReferenceRange').value = thresholds.lowReference;
  document.querySelector('#lowReferenceInput').value = thresholds.lowReference;
  updateThresholdPreview();
}

function closeThresholdPanel() {
  document.querySelector('#thresholdOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function updateThresholdPreview() {
  const low = parseInt(document.querySelector('#lowReferenceInput').value) || 50;
  const high = parseInt(document.querySelector('#highNoiseInput').value) || 75;
  const harsh = parseInt(document.querySelector('#harshInput').value) || 85;

  const maxDb = 130;
  const lowWidth = (low / maxDb) * 100;
  const normalWidth = ((high - low) / maxDb) * 100;
  const highWidth = ((harsh - high) / maxDb) * 100;
  const harshWidth = ((maxDb - harsh) / maxDb) * 100;

  document.querySelector('#previewLow').style.width = lowWidth + '%';
  document.querySelector('#previewNormal').style.width = normalWidth + '%';
  document.querySelector('#previewHigh').style.width = highWidth + '%';
  document.querySelector('#previewHarsh').style.width = harshWidth + '%';

  document.querySelector('#previewLowValue').textContent = `0-${low}dB`;
  document.querySelector('#previewNormalValue').textContent = `${low}-${high}dB`;
  document.querySelector('#previewHighValue').textContent = `${high}-${harsh}dB`;
  document.querySelector('#previewHarshValue').textContent = `${harsh}dB+`;
}

function render() {
  if (!dayFilter.value && records[0]) dayFilter.value = records[0].at.slice(0, 10);
  updateMonitoringPointSelects();
  updateLocationInput();
  updateFilterUI();

  let filtered = records.filter((record) => [record.location, record.source, record.feeling].join(' ').includes(search.value.trim()));

  if (selectedMonitoringPointFilter) {
    filtered = filtered.filter(record => record.monitoringPointId === selectedMonitoringPointFilter);
  }

  filtered = applyFilters(filtered);

  const dayRecords = filtered.filter((record) => record.at.startsWith(dayFilter.value)).sort((a, b) => a.at.localeCompare(b.at));

  const summaryRecords = filtered;
  document.querySelector('#summary').innerHTML = [
    ['观测数', summaryRecords.length],
    ['平均分贝', `${average(summaryRecords.map((record) => record.db)).toFixed(1)}dB`],
    ['最高分贝', `${Math.max(...summaryRecords.map((record) => record.db), 0)}dB`],
    ['高噪声占比', `${Math.round(summaryRecords.filter((record) => isHighNoise(record.db)).length / Math.max(summaryRecords.length, 1) * 100)}%`]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');

  drawLine('#daily', dayRecords.map((record) => ({ label: record.at.slice(11, 16), value: record.db })), 'dB');
  drawBars('#locations', grouped(filtered), 'dB');

  document.querySelector('#hotList').innerHTML = filtered.filter((record) => isHighNoise(record.db)).sort((a, b) => b.db - a.db).slice(0, 6).map((record) => {
    const level = getNoiseLevel(record.db);
    const point = record.monitoringPointId ? getMonitoringPointById(record.monitoringPointId) : null;
    return `<div class="hot noise-level-${level}"><strong>${record.db}dB</strong><span>${record.location}${point ? ` <span class="point-type-badge ${getPointTypeInfo(point.type).colorClass}" style="font-size:10px;padding:2px 6px;">${getPointTypeInfo(point.type).label}</span>` : ''}</span><em>${record.source}</em></div>`;
  }).join('') || '<p class="empty">暂无高噪声记录</p>';

  document.querySelector('#rows').innerHTML = filtered.sort((a, b) => b.at.localeCompare(a.at)).map((record) => {
    const level = getNoiseLevel(record.db);
    const point = record.monitoringPointId ? getMonitoringPointById(record.monitoringPointId) : null;
    const pointDisplay = point ? `<span class="point-type-badge ${getPointTypeInfo(point.type).colorClass}">${point.name}</span>` : '<span style="color:#999;">未关联</span>';
    return `<tr class="noise-row noise-level-${level}"><td>${record.at.replace('T', ' ')}</td><td>${pointDisplay}</td><td><span class="location-link" data-location="${record.location}">${record.location}</span></td><td><span class="db-badge noise-level-${level}">${record.db}dB</span></td><td>${record.source}</td><td>${record.feeling}</td><td><button data-edit="${record.id}">编辑</button><button data-del="${record.id}">删除</button></td></tr>`;
  }).join('');

  document.querySelectorAll('.location-link').forEach((link) => {
    link.addEventListener('click', () => openLocationDetail(link.dataset.location));
  });
  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => {
    records = records.filter((record) => record.id !== button.dataset.del);
    save();
    recalculateAlarms();
    render();
  }));
  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
    const record = records.find((item) => item.id === button.dataset.edit);
    editingId = record.id;

    if (record.monitoringPointId) {
      useManualLocation = false;
      updateLocationInput();
      form.elements['monitoringPointId'].value = record.monitoringPointId;
      form.elements['location'].value = '';
    } else {
      useManualLocation = true;
      updateLocationInput();
      form.elements['location'].value = record.location;
      form.elements['monitoringPointId'].value = '';
    }

    Object.entries(record).forEach(([name, value]) => {
      if (form.elements[name] && name !== 'location' && name !== 'monitoringPointId') {
        form.elements[name].value = value;
      }
    });
  }));
}

function grouped(data) {
  const map = new Map();
  const pointMap = new Map();

  data.forEach((record) => {
    const key = record.monitoringPointId || `manual:${record.location}`;
    if (!map.has(key)) {
      map.set(key, []);
      pointMap.set(key, {
        label: record.location,
        monitoringPointId: record.monitoringPointId,
        point: record.monitoringPointId ? getMonitoringPointById(record.monitoringPointId) : null
      });
    }
    map.get(key).push(record.db);
  });

  return [...map.entries()].map(([key, values]) => ({
    ...pointMap.get(key),
    value: average(values)
  })).sort((a, b) => b.value - a.value);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function getY(value, min, span) {
  return 178 - ((value - min) / span) * 132;
}

function drawLine(selector, data, unit) {
  const el = document.querySelector(selector);
  if (!data.length) return (el.innerHTML = '<p class="empty">暂无数据</p>');
  const max = Math.max(...data.map((item) => item.value), thresholds.harsh + 10);
  const min = Math.min(...data.map((item) => item.value), thresholds.lowReference - 10);
  const span = Math.max(max - min, 1);

  const lineSegments = data.map((item, index) => {
    if (index === 0) return '';
    const prevItem = data[index - 1];
    const x1 = 42 + (index - 1) * (420 / Math.max(data.length - 1, 1));
    const y1 = getY(prevItem.value, min, span);
    const x2 = 42 + index * (420 / Math.max(data.length - 1, 1));
    const y2 = getY(item.value, min, span);
    const color = getNoiseColor((prevItem.value + item.value) / 2);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  }).join('');

  const referenceLines = [];
  const refYHigh = getY(thresholds.highNoise, min, span);
  if (refYHigh >= 46 && refYHigh <= 178) {
    referenceLines.push(`<line x1="42" y1="${refYHigh}" x2="462" y2="${refYHigh}" stroke="#f97316" stroke-width="1" stroke-dasharray="4,4"/><text x="462" y="${refYHigh - 4}" text-anchor="end" fill="#f97316" font-size="11">高噪声 ${thresholds.highNoise}dB</text>`);
  }
  const refYHarsh = getY(thresholds.harsh, min, span);
  if (refYHarsh >= 46 && refYHarsh <= 178) {
    referenceLines.push(`<line x1="42" y1="${refYHarsh}" x2="462" y2="${refYHarsh}" stroke="#d94636" stroke-width="1" stroke-dasharray="4,4"/><text x="462" y="${refYHarsh - 4}" text-anchor="end" fill="#d94636" font-size="11">刺耳 ${thresholds.harsh}dB</text>`);
  }
  const refYLow = getY(thresholds.lowReference, min, span);
  if (refYLow >= 46 && refYLow <= 178) {
    referenceLines.push(`<line x1="42" y1="${refYLow}" x2="462" y2="${refYLow}" stroke="#22c55e" stroke-width="1" stroke-dasharray="4,4"/><text x="462" y="${refYLow - 4}" text-anchor="end" fill="#22c55e" font-size="11">低参考 ${thresholds.lowReference}dB</text>`);
  }

  el.innerHTML = `<svg viewBox="0 0 500 220">
    ${referenceLines.join('')}
    ${lineSegments}
    ${data.map((item, index) => {
      const x = 42 + index * (420 / Math.max(data.length - 1, 1));
      const y = getY(item.value, min, span);
      const color = getNoiseColor(item.value);
      return `<circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="white" stroke-width="2"/>
              <text x="${x}" y="205">${item.label}</text>
              <text x="${x}" y="${y - 10}" fill="${color}" font-weight="bold">${item.value}${unit}</text>`;
    }).join('')}
  </svg>`;
}

function drawBars(selector, data, unit) {
  const el = document.querySelector(selector);
  if (!data.length) return (el.innerHTML = '<p class="empty">暂无数据</p>');
  const max = Math.max(...data.map((item) => item.value), 1);

  const barHeight = 42;
  const hasPoints = data.some(item => item.point);
  const svgHeight = Math.max(220, data.length * barHeight + 40);

  el.innerHTML = `<svg viewBox="0 0 500 ${svgHeight}" style="min-height: ${svgHeight}px;">${data.map((item, index) => {
    const color = getNoiseColor(item.value);
    const textColor = isHighNoise(item.value) ? color : '#251e1a';
    const barWidth = (item.value / max) * 300;
    const y = 24 + index * barHeight;
    const labelY = 44 + index * barHeight;

    let typeBadge = '';
    if (item.point) {
      const typeInfo = getPointTypeInfo(item.point.type);
      typeBadge = `<rect x="18" y="${labelY - 16}" width="4" height="16" rx="2" fill="${color}"/>`;
    }

    return `
      <g class="location-bar" data-location="${item.label}" style="cursor: pointer;">
        ${typeBadge}
        <text x="${item.point ? 28 : 18}" y="${labelY}" fill="${textColor}" text-decoration="underline" font-size="${hasPoints && item.point ? '12' : '13'}">${item.label}${item.point ? ` · ${getPointTypeInfo(item.point.type).label}` : ''}</text>
        <rect x="150" y="${y}" width="${barWidth}" height="22" rx="4" fill="${color}"/>
        <text x="${160 + barWidth}" y="${y + 18}" fill="${color}" font-weight="bold" font-size="12">${Math.round(item.value)}${unit}</text>
      </g>
    `;
  }).join('')}</svg>`;

  el.querySelectorAll('.location-bar').forEach((g) => {
    g.addEventListener('click', () => openLocationDetail(g.dataset.location));
  });
}

function openLocationDetail(location) {
  const locationRecords = records
    .filter((record) => record.location === location)
    .sort((a, b) => a.at.localeCompare(b.at));

  if (!locationRecords.length) return;

  const firstRecord = locationRecords[0];
  const point = firstRecord.monitoringPointId ? getMonitoringPointById(firstRecord.monitoringPointId) : null;

  const stats = calculateLocationStats(locationRecords);
  const mainSource = getMainSource(locationRecords.map((r) => r.source));

  let title = `${location} · 噪声详情`;
  if (point) {
    const typeInfo = getPointTypeInfo(point.type);
    title = `${point.name} · ${typeInfo.label} · 噪声详情`;
  }
  document.querySelector('#locationDetailTitle').textContent = title;

  let extraStats = '';
  if (point) {
    const typeInfo = getPointTypeInfo(point.type);
    extraStats = `
      <div class="stat-card">
        <span class="stat-label">街区</span>
        <strong class="stat-value">${point.district}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">类型</span>
        <strong class="stat-value"><span class="point-type-badge ${typeInfo.colorClass}">${typeInfo.label}</span></strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">坐标</span>
        <strong class="stat-value" style="font-size:14px;">${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}</strong>
      </div>
    `;
  }

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
    ${extraStats}
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

function openAlarmCenter() {
  document.querySelector('#alarmCenterOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  recalculateAlarms();
  loadAlarmConfig();
  renderAlarmCenter();
}

function closeAlarmCenter() {
  document.querySelector('#alarmCenterOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function loadAlarmConfig() {
  document.querySelector('#multipleExceedThreshold').value = alarmConfig.multipleExceedThreshold;
  document.querySelector('#nightStartHour').value = alarmConfig.nightStartHour;
  document.querySelector('#nightEndHour').value = alarmConfig.nightEndHour;
  document.querySelector('#nightNoiseThreshold').value = alarmConfig.nightNoiseThreshold;
  document.querySelector('#alarmStatusFilter').value = alarmStatusFilter;
  document.querySelector('#alarmTypeFilter').value = alarmTypeFilter;
}

function renderAlarmCenter() {
  const pending = alarms.filter(a => a.status === 'pending').length;
  const confirmed = alarms.filter(a => a.status === 'confirmed').length;
  const ignored = alarms.filter(a => a.status === 'ignored').length;
  
  document.querySelector('#alarmPendingCount').textContent = pending;
  document.querySelector('#alarmConfirmedCount').textContent = confirmed;
  document.querySelector('#alarmIgnoredCount').textContent = ignored;
  document.querySelector('#alarmTotalCount').textContent = alarms.length;
  
  let filteredAlarms = [...alarms];
  
  if (alarmStatusFilter !== 'all') {
    filteredAlarms = filteredAlarms.filter(a => a.status === alarmStatusFilter);
  }
  
  if (alarmTypeFilter !== 'all') {
    filteredAlarms = filteredAlarms.filter(a => a.type === alarmTypeFilter);
  }
  
  filteredAlarms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const alarmListEl = document.querySelector('#alarmList');
  
  if (!filteredAlarms.length) {
    alarmListEl.innerHTML = '<p class="empty">暂无告警记录</p>';
    return;
  }
  
  alarmListEl.innerHTML = filteredAlarms.map(alarm => {
    const statusClass = `alarm-status-${alarm.status}`;
    const typeClass = `alarm-type-${alarm.type}`;
    const statusLabel = {
      pending: '待处理',
      confirmed: '已确认',
      ignored: '已忽略'
    }[alarm.status];
    
    let detailInfo = '';
    if (alarm.type === 'single' || alarm.type === 'nighttime') {
      detailInfo = `
        <div class="alarm-detail">
          <span>时间：${alarm.at.replace('T', ' ')}</span>
          <span>来源：${alarm.source}</span>
          <span>阈值：${alarm.threshold}dB</span>
        </div>
      `;
    } else if (alarm.type === 'multiple') {
      detailInfo = `
        <div class="alarm-detail">
          <span>日期：${alarm.day}</span>
          <span>超标次数：${alarm.recordCount}次</span>
          <span>最高分贝：${alarm.maxDb}dB</span>
          <span>噪声阈值：${alarm.noiseThreshold}dB</span>
        </div>
      `;
    }
    
    return `
      <div class="alarm-item ${statusClass} ${typeClass}">
        <div class="alarm-header">
          <div class="alarm-title">
            <span class="alarm-type-badge">${alarm.typeLabel}</span>
            <span class="alarm-location">${alarm.location}</span>
          </div>
          <span class="alarm-db">${alarm.db || alarm.maxDb}dB</span>
        </div>
        <div class="alarm-message">${alarm.message}</div>
        ${detailInfo}
        <div class="alarm-footer">
          <span class="alarm-status-badge ${statusClass}">${statusLabel}</span>
          <span class="alarm-time">生成于 ${new Date(alarm.createdAt).toLocaleString('zh-CN')}</span>
          <div class="alarm-actions">
            ${alarm.status === 'pending' ? `
              <button class="secondary" data-confirm="${alarm.id}">确认</button>
              <button class="secondary" data-ignore="${alarm.id}">忽略</button>
            ` : alarm.status === 'confirmed' ? `
              <button class="secondary" data-reopen="${alarm.id}">重新打开</button>
            ` : `
              <button class="secondary" data-reopen="${alarm.id}">重新打开</button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  alarmListEl.querySelectorAll('[data-confirm]').forEach(btn => {
    btn.addEventListener('click', () => updateAlarmStatus(btn.dataset.confirm, 'confirmed'));
  });
  alarmListEl.querySelectorAll('[data-ignore]').forEach(btn => {
    btn.addEventListener('click', () => updateAlarmStatus(btn.dataset.ignore, 'ignored'));
  });
  alarmListEl.querySelectorAll('[data-reopen]').forEach(btn => {
    btn.addEventListener('click', () => updateAlarmStatus(btn.dataset.reopen, 'pending'));
  });
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
  if (e.key === 'Escape') {
    if (!document.querySelector('#alarmCenterOverlay').classList.contains('hidden')) {
      closeAlarmCenter();
    } else if (!document.querySelector('#monitoringPointOverlay').classList.contains('hidden')) {
      closeMonitoringPointPanel();
    } else if (!document.querySelector('#thresholdOverlay').classList.contains('hidden')) {
      closeThresholdPanel();
    } else if (!document.querySelector('#locationDetailOverlay').classList.contains('hidden')) {
      closeLocationDetail();
    }
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
  const highNoiseCount = filtered.filter(r => isHighNoise(r.db)).length;
  const highNoiseRatio = (highNoiseCount / filtered.length * 100).toFixed(1);

  const locationStats = {};
  filtered.forEach(r => {
    if (!locationStats[r.location]) {
      locationStats[r.location] = { count: 0, totalDb: 0, maxDb: 0, highNoiseCount: 0 };
    }
    locationStats[r.location].count++;
    locationStats[r.location].totalDb += r.db;
    locationStats[r.location].maxDb = Math.max(locationStats[r.location].maxDb, r.db);
    if (isHighNoise(r.db)) locationStats[r.location].highNoiseCount++;
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
    .filter(r => isHighNoise(r.db))
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
    endDate: reportEndDate.value,
    thresholds: { ...thresholds }
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
        <p>期间平均噪声为 <strong>${stats.avgDb}dB</strong>，最高噪声达到 <strong>${stats.maxDb}dB</strong>，高噪声（≥${stats.thresholds.highNoise}dB）记录共 <strong>${stats.highNoiseCount}</strong> 条，占比 <strong>${stats.highNoiseRatio}%</strong>。</p>
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
        <p>噪声≥${stats.thresholds.highNoise}dB的记录明细（共${stats.highNoiseRecords.length}条）：</p>
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
  const result = { id: crypto.randomUUID(), monitoringPointId: null };

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

  const matchingPoint = monitoringPoints.find(p => p.name === result.location);
  if (matchingPoint) {
    result.monitoringPointId = matchingPoint.id;
  }

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
  recalculateAlarms();
  render();
  resetImport();
  alert(`成功导入${importData.validRecords.length}条记录`);
}

recalculateAlarms();
render();
