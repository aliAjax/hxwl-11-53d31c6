import './styles.css';

const key = 'hxwl-11-noise-records';
const thresholdKey = 'hxwl-11-noise-thresholds';
const monitoringPointsKey = 'hxwl-11-monitoring-points';
const alarmsKey = 'hxwl-11-noise-alarms';
const alarmConfigKey = 'hxwl-11-alarm-config';
const filterViewsKey = 'hxwl-11-filter-views';
const defaultViewKey = 'hxwl-11-default-view';
const patrolTasksKey = 'hxwl-11-patrol-tasks';
const complaintsKey = 'hxwl-11-noise-complaints';
const importBatchesKey = 'hxwl-11-import-batches';

const complaintStatusLabels = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
};

const defaultComplaints = [
  { id: crypto.randomUUID(), location: '老城菜市口', at: '2026-06-04T06:30', source: '叫卖喇叭', description: '早市商贩使用高音喇叭叫卖，严重影响周边居民休息', contact: '13800001111', status: 'pending', monitoringPointId: null, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), location: '社区广场', at: '2026-06-05T21:00', source: '广场舞音箱', description: '晚间广场舞音量过大，持续到22点以后', contact: '13900002222', status: 'processing', monitoringPointId: null, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), location: '高架桥下', at: '2026-06-06T07:15', source: '货车通行', description: '清晨货车经过，鸣笛声刺耳，整栋楼被震醒', contact: '13700003333', status: 'resolved', monitoringPointId: null, createdAt: new Date().toISOString() }
];

const patrolStatusLabels = {
  pending: '待巡查',
  in_progress: '巡查中',
  completed: '已完成',
  cancelled: '已取消'
};

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
  nightNoiseThreshold: 65,
  mergeTimeWindowHours: 2
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
let alarmViewMode = 'list';
const expandedMergedAlarms = new Set();

let currentFilters = {
  dateStart: '',
  dateEnd: '',
  locations: [],
  sources: [],
  feelings: [],
  dbMin: '',
  dbMax: '',
  highNoiseStatus: 'all',
  timePeriod: ''
};

let filterViews = JSON.parse(localStorage.getItem(filterViewsKey) || 'null') || [];
let activeViewId = null;
let defaultViewId = localStorage.getItem(defaultViewKey) || null;

let patrolTasks = JSON.parse(localStorage.getItem(patrolTasksKey) || 'null') || [];
let editingPatrolTaskId = null;
let patrolTaskStatusFilter = 'all';
let patrolTaskPointFilter = '';

let complaints = JSON.parse(localStorage.getItem(complaintsKey) || 'null') || defaultComplaints;
let editingComplaintId = null;
let complaintStatusFilter = 'all';
let complaintLocationFilter = '';

let importBatches = JSON.parse(localStorage.getItem(importBatchesKey) || 'null') || [];

function savePatrolTasks() {
  localStorage.setItem(patrolTasksKey, JSON.stringify(patrolTasks));
}

function saveComplaints() {
  localStorage.setItem(complaintsKey, JSON.stringify(complaints));
}

function toLocalDateTimeInputValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

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
  saveMonitoringPoints();
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
        <button id="complaintBtn">投诉登记</button>
        <button id="patrolTasksBtn">巡查任务</button>
        <button id="healthDashboardBtn">健康看板</button>
        <button id="alarmCenterBtn">告警中心</button>
        <button id="monitoringPointsBtn">监测点管理</button>
        <button id="importBatchesBtn">导入记录</button>
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
            <button id="renameViewBtn" class="secondary" disabled>重命名</button>
            <button id="setDefaultViewBtn" class="secondary" disabled>设为默认</button>
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
          <div class="preview-stat duplicate-stat"><span>疑似重复</span><strong id="duplicateCount">0</strong></div>
        </div>
        <div class="duplicate-option" id="duplicateOption">
          <label class="duplicate-checkbox-label">
            <input type="checkbox" id="skipDuplicates" checked />
            <span>跳过疑似重复记录（时间、地点、分贝、来源完全相同的记录）</span>
          </label>
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
        <div class="location-detail-heatmap">
          <h3>🔥 时段热力分析</h3>
          <p class="heatmap-hint">按早高峰、午间、晚高峰、夜间统计近7天和近30天的最高分贝与超标次数，点击格子查看对应记录</p>
          <div id="locationDetailHeatmap"></div>
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

          <div class="map-view-section" id="mapViewSection">
            <div class="map-view-header">
              <h3>🗺️ 点位分布地图</h3>
              <div class="map-view-stats" id="mapViewStats"></div>
            </div>
            <div class="map-container" id="mapContainer"></div>
            <div class="map-legend" id="mapLegend"></div>
          </div>

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
            <div class="filter-group">
              <label>视图模式：</label>
              <select id="alarmViewModeSelect">
                <option value="list">列表视图</option>
                <option value="merged">合并视图</option>
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
              <div class="rule-item">
                <label>合并时间窗口</label>
                <input type="number" id="mergeTimeWindowHours" min="0.5" max="24" step="0.5" />
                <span class="rule-desc">同地点同日相邻告警时间差 ≤ 此值（小时）才合并</span>
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

    <div class="view-save-overlay hidden" id="viewSaveOverlay">
      <div class="view-save-panel">
        <div class="view-save-header">
          <h2>保存视图</h2>
          <button class="view-save-close" id="viewSaveClose">&times;</button>
        </div>
        <div class="view-save-content">
          <label>视图名称</label>
          <input type="text" id="viewNameInput" placeholder="请输入视图名称" />
          <p class="view-save-tip">保存当前的筛选条件，下次可快速切换</p>
        </div>
        <div class="view-save-actions">
          <button class="secondary" id="cancelSaveView">取消</button>
          <button class="primary" id="confirmSaveView">保存</button>
        </div>
      </div>
    </div>

    <div class="view-save-overlay hidden" id="viewRenameOverlay">
      <div class="view-save-panel">
        <div class="view-save-header">
          <h2>重命名视图</h2>
          <button class="view-save-close" id="viewRenameClose">&times;</button>
        </div>
        <div class="view-save-content">
          <label>视图名称</label>
          <input type="text" id="viewRenameInput" placeholder="请输入新的视图名称" />
          <p class="view-save-tip">修改当前视图的名称</p>
        </div>
        <div class="view-save-actions">
          <button class="secondary" id="cancelRenameView">取消</button>
          <button class="primary" id="confirmRenameView">确定</button>
        </div>
      </div>
    </div>

    <div class="patrol-tasks-overlay hidden" id="patrolTasksOverlay">
      <div class="patrol-tasks-panel">
        <div class="patrol-tasks-header">
          <h2>巡查任务管理</h2>
          <button class="patrol-tasks-close" id="patrolTasksClose">&times;</button>
        </div>
        <div class="patrol-tasks-content">
          <div class="patrol-summary">
            <div class="patrol-stat-card pending">
              <span class="patrol-stat-label">待巡查</span>
              <strong class="patrol-stat-value" id="patrolPendingCount">0</strong>
            </div>
            <div class="patrol-stat-card in-progress">
              <span class="patrol-stat-label">巡查中</span>
              <strong class="patrol-stat-value" id="patrolInProgressCount">0</strong>
            </div>
            <div class="patrol-stat-card completed">
              <span class="patrol-stat-label">已完成</span>
              <strong class="patrol-stat-value" id="patrolCompletedCount">0</strong>
            </div>
            <div class="patrol-stat-card total">
              <span class="patrol-stat-label">总计</span>
              <strong class="patrol-stat-value" id="patrolTotalCount">0</strong>
            </div>
          </div>

          <div class="patrol-filters">
            <div class="filter-group">
              <label>状态筛选：</label>
              <select id="patrolStatusFilter">
                <option value="all">全部状态</option>
                <option value="pending">待巡查</option>
                <option value="in_progress">巡查中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div class="filter-group">
              <label>监测点筛选：</label>
              <select id="patrolPointFilter">
                <option value="">全部监测点</option>
              </select>
            </div>
            <button class="primary" id="newPatrolTaskBtn">+ 新建任务</button>
          </div>

          <div class="patrol-form-section hidden" id="patrolFormSection">
            <h3 id="patrolFormTitle">新建巡查任务</h3>
            <form id="patrolTaskForm" class="patrol-task-form">
              <div class="patrol-form-grid">
                <div>
                  <label>地点 <span style="color:#d94636">*</span></label>
                  <input name="location" id="patrolLocation" placeholder="巡查地点" required />
                </div>
                <div>
                  <label>关联监测点</label>
                  <select name="monitoringPointId" id="patrolMonitoringPoint">
                    <option value="">选择监测点（可选）</option>
                  </select>
                </div>
                <div>
                  <label>计划巡查时间 <span style="color:#d94636">*</span></label>
                  <input name="scheduledAt" type="datetime-local" id="patrolScheduledAt" required />
                </div>
                <div>
                  <label>负责人 <span style="color:#d94636">*</span></label>
                  <input name="assignee" id="patrolAssignee" placeholder="负责人姓名" required />
                </div>
                <div>
                  <label>状态</label>
                  <select name="status" id="patrolStatus">
                    <option value="pending">待巡查</option>
                    <option value="in_progress">巡查中</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
                <div>
                  <label>实际巡查时间</label>
                  <input name="completedAt" type="datetime-local" id="patrolCompletedAt" />
                </div>
                <div class="form-full">
                  <label>备注</label>
                  <textarea name="notes" id="patrolNotes" placeholder="任务说明、噪声源描述、整改建议等" rows="3"></textarea>
                </div>
              </div>
              <div class="patrol-form-actions">
                <button type="button" class="secondary" id="cancelPatrolEdit">取消</button>
                <button type="submit" class="primary">保存任务</button>
              </div>
            </form>
          </div>

          <div class="patrol-list-section">
            <h3>任务列表</h3>
            <div id="patrolTasksList" class="patrol-tasks-list"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="complaint-overlay hidden" id="complaintOverlay">
      <div class="complaint-panel">
        <div class="complaint-header">
          <h2>噪声投诉登记</h2>
          <button class="complaint-close" id="complaintClose">&times;</button>
        </div>
        <div class="complaint-content">
          <div class="complaint-summary">
            <div class="complaint-stat-card pending">
              <span class="complaint-stat-label">待处理</span>
              <strong class="complaint-stat-value" id="complaintPendingCount">0</strong>
            </div>
            <div class="complaint-stat-card processing">
              <span class="complaint-stat-label">处理中</span>
              <strong class="complaint-stat-value" id="complaintProcessingCount">0</strong>
            </div>
            <div class="complaint-stat-card resolved">
              <span class="complaint-stat-label">已解决</span>
              <strong class="complaint-stat-value" id="complaintResolvedCount">0</strong>
            </div>
            <div class="complaint-stat-card closed">
              <span class="complaint-stat-label">已关闭</span>
              <strong class="complaint-stat-value" id="complaintClosedCount">0</strong>
            </div>
            <div class="complaint-stat-card total">
              <span class="complaint-stat-label">总计</span>
              <strong class="complaint-stat-value" id="complaintTotalCount">0</strong>
            </div>
          </div>

          <div class="complaint-filters">
            <div class="filter-group">
              <label>状态筛选：</label>
              <select id="complaintStatusFilterSelect">
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
            <div class="filter-group">
              <label>地点搜索：</label>
              <input type="text" id="complaintLocationSearch" placeholder="输入投诉地点关键词" />
            </div>
            <button class="primary" id="newComplaintBtn">+ 新建投诉</button>
          </div>

          <div class="complaint-form-section hidden" id="complaintFormSection">
            <h3 id="complaintFormTitle">新建噪声投诉</h3>
            <form id="complaintForm" class="complaint-form">
              <div class="complaint-form-grid">
                <div>
                  <label>投诉地点 <span style="color:#d94636">*</span></label>
                  <input name="location" id="complaintLocation" placeholder="噪声发生的地点" required />
                </div>
                <div>
                  <label>发生时间 <span style="color:#d94636">*</span></label>
                  <input name="at" type="datetime-local" id="complaintAt" required />
                </div>
                <div>
                  <label>噪声来源 <span style="color:#d94636">*</span></label>
                  <input name="source" id="complaintSource" placeholder="如：施工、广场舞、交通等" required />
                </div>
                <div>
                  <label>联系方式 <span style="color:#d94636">*</span></label>
                  <input name="contact" id="complaintContact" placeholder="手机号或固话" required />
                </div>
                <div>
                  <label>处理状态</label>
                  <select name="status" id="complaintStatus">
                    <option value="pending">待处理</option>
                    <option value="processing">处理中</option>
                    <option value="resolved">已解决</option>
                    <option value="closed">已关闭</option>
                  </select>
                </div>
                <div class="complaint-point-info hidden" id="complaintPointInfo">
                  <label>关联监测点</label>
                  <div class="complaint-point-badge" id="complaintPointBadge"></div>
                </div>
                <div class="form-full">
                  <label>问题描述 <span style="color:#d94636">*</span></label>
                  <textarea name="description" id="complaintDescription" placeholder="请详细描述噪声情况，如持续时间、影响范围等" rows="3" required></textarea>
                </div>
              </div>
              <div class="complaint-form-actions">
                <button type="button" class="secondary" id="cancelComplaintEdit">取消</button>
                <button type="submit" class="primary">提交投诉</button>
              </div>
            </form>
          </div>

          <div class="complaint-list-section">
            <h3>投诉列表</h3>
            <div id="complaintsList" class="complaints-list"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="health-dashboard-overlay hidden" id="healthDashboardOverlay">
      <div class="health-dashboard-panel">
        <div class="health-dashboard-header">
          <h2>监测点健康看板</h2>
          <button class="health-dashboard-close" id="healthDashboardClose">&times;</button>
        </div>
        <div class="health-dashboard-content">
          <div class="health-summary">
            <div class="health-stat-card normal">
              <span class="health-stat-label">正常</span>
              <strong class="health-stat-value" id="healthNormalCount">0</strong>
            </div>
            <div class="health-stat-card warning">
              <span class="health-stat-label">待补采</span>
              <strong class="health-stat-value" id="healthWarningCount">0</strong>
            </div>
            <div class="health-stat-card nodata">
              <span class="health-stat-label">无记录</span>
              <strong class="health-stat-value" id="healthNoDataCount">0</strong>
            </div>
            <div class="health-stat-card total">
              <span class="health-stat-label">总计</span>
              <strong class="health-stat-value" id="healthTotalCount">0</strong>
            </div>
          </div>
          <div id="healthDashboardList" class="health-dashboard-list"></div>
        </div>
      </div>
    </div>

    <div class="import-batches-overlay hidden" id="importBatchesOverlay">
      <div class="import-batches-panel">
        <div class="import-batches-header">
          <h2>导入记录管理</h2>
          <button class="import-batches-close" id="importBatchesClose">&times;</button>
        </div>
        <div class="import-batches-content">
          <div class="import-batches-summary">
            <div class="import-batches-stat-card total">
              <span class="import-batches-stat-label">总导入批次</span>
              <strong class="import-batches-stat-value" id="importBatchesTotalCount">0</strong>
            </div>
            <div class="import-batches-stat-card active">
              <span class="import-batches-stat-label">有效批次</span>
              <strong class="import-batches-stat-value" id="importBatchesActiveCount">0</strong>
            </div>
            <div class="import-batches-stat-card reverted">
              <span class="import-batches-stat-label">已撤销</span>
              <strong class="import-batches-stat-value" id="importBatchesRevertedCount">0</strong>
            </div>
            <div class="import-batches-stat-card records">
              <span class="import-batches-stat-label">累计导入记录</span>
              <strong class="import-batches-stat-value" id="importBatchesTotalRecords">0</strong>
            </div>
          </div>
          <div class="import-batches-list-section">
            <h3>最近导入批次</h3>
            <div id="importBatchesList" class="import-batches-list"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="confirm-overlay hidden" id="confirmOverlay">
      <div class="confirm-panel">
        <div class="confirm-header">
          <h2 id="confirmTitle">确认</h2>
        </div>
        <div class="confirm-content">
          <p id="confirmMessage">确定要执行此操作吗？</p>
        </div>
        <div class="confirm-actions">
          <button class="secondary" id="confirmCancel">取消</button>
          <button class="primary" id="confirmOk">确定</button>
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
document.querySelector('#renameViewBtn').addEventListener('click', renameActiveView);
document.querySelector('#setDefaultViewBtn').addEventListener('click', toggleDefaultView);
document.querySelector('#deleteViewBtn').addEventListener('click', deleteActiveView);

document.querySelector('#viewSelector').addEventListener('change', (e) => {
  if (e.target.value) {
    loadView(e.target.value);
  } else {
    activeViewId = null;
    updateFilterUI();
  }
});

document.querySelector('#viewSaveClose').addEventListener('click', closeSaveViewDialog);
document.querySelector('#cancelSaveView').addEventListener('click', closeSaveViewDialog);
document.querySelector('#viewSaveOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'viewSaveOverlay') closeSaveViewDialog();
});
document.querySelector('#confirmSaveView').addEventListener('click', doSaveView);
document.querySelector('#viewNameInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSaveView();
});

document.querySelector('#viewRenameClose').addEventListener('click', closeRenameViewDialog);
document.querySelector('#cancelRenameView').addEventListener('click', closeRenameViewDialog);
document.querySelector('#viewRenameOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'viewRenameOverlay') closeRenameViewDialog();
});
document.querySelector('#confirmRenameView').addEventListener('click', doRenameView);
document.querySelector('#viewRenameInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doRenameView();
});

document.querySelector('#confirmCancel').addEventListener('click', closeConfirmDialog);
document.querySelector('#confirmOk').addEventListener('click', handleConfirmOk);
document.querySelector('#confirmOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'confirmOverlay') closeConfirmDialog();
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
document.querySelector('#alarmViewModeSelect').addEventListener('change', (e) => {
  alarmViewMode = e.target.value;
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
  const mergeTimeWindowHours = parseFloat(document.querySelector('#mergeTimeWindowHours').value);

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
  if (isNaN(mergeTimeWindowHours) || mergeTimeWindowHours < 0.5 || mergeTimeWindowHours > 24) {
    alert('合并时间窗口必须在0.5-24小时之间');
    return;
  }

  alarmConfig = { multipleExceedThreshold, nightStartHour, nightEndHour, nightNoiseThreshold, mergeTimeWindowHours };
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

document.querySelector('#importBatchesBtn').addEventListener('click', openImportBatches);
document.querySelector('#importBatchesClose').addEventListener('click', closeImportBatches);
document.querySelector('#importBatchesOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'importBatchesOverlay') closeImportBatches();
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
  complaints = defaultComplaints;
  importBatches = [];
  migrateData();
  saveComplaints();
  saveImportBatches();
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

function saveImportBatches() {
  localStorage.setItem(importBatchesKey, JSON.stringify(importBatches));
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
    if (currentFilters.timePeriod) {
      const hour = new Date(record.at).getHours();
      if (getTimePeriodKey(hour) !== currentFilters.timePeriod) {
        return false;
      }
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
  if (currentFilters.timePeriod) count++;
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
  if (currentFilters.timePeriod) {
    const period = timePeriods.find(p => p.key === currentFilters.timePeriod);
    if (period) {
      tags.push({ label: `时段: ${period.label} (${String(period.startHour).padStart(2, '0')}:00-${period.key === 'night' ? '次日' : ''}${String(period.endHour).padStart(2, '0')}:00)`, type: 'timePeriod' });
    }
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
    highNoiseStatus: 'all',
    timePeriod: ''
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
  document.querySelector('#renameViewBtn').disabled = !activeViewId;
  document.querySelector('#setDefaultViewBtn').disabled = !activeViewId;
  document.querySelector('#setDefaultViewBtn').textContent = 
    activeViewId && defaultViewId === activeViewId ? '取消默认' : '设为默认';
}

function updateViewSelector() {
  const selector = document.querySelector('#viewSelector');
  selector.innerHTML = '<option value="">选择常用视图</option>' +
    filterViews.map(view => {
      const isDefault = view.id === defaultViewId;
      const displayName = isDefault ? `⭐ ${view.name}` : view.name;
      return `<option value="${view.id}" ${activeViewId === view.id ? 'selected' : ''}>${displayName}</option>`;
    }).join('');
}

let confirmCallback = null;

function openSaveViewDialog() {
  document.querySelector('#viewSaveOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.querySelector('#viewNameInput').value = '';
  document.querySelector('#viewNameInput').focus();
}

function closeSaveViewDialog() {
  document.querySelector('#viewSaveOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function saveCurrentView() {
  openSaveViewDialog();
}

function doSaveView() {
  const name = document.querySelector('#viewNameInput').value.trim();
  if (!name) {
    openConfirmDialog('提示', '请输入视图名称', null);
    return;
  }

  const newView = {
    id: crypto.randomUUID(),
    name: name,
    filters: JSON.parse(JSON.stringify(currentFilters)),
    createdAt: new Date().toISOString()
  };

  filterViews.push(newView);
  saveFilterViews();
  activeViewId = newView.id;
  closeSaveViewDialog();
  updateFilterUI();
}

function openConfirmDialog(title, message, callback) {
  document.querySelector('#confirmTitle').textContent = title;
  document.querySelector('#confirmMessage').textContent = message;
  confirmCallback = callback;
  document.querySelector('#confirmOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeConfirmDialog() {
  document.querySelector('#confirmOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  confirmCallback = null;
}

function handleConfirmOk() {
  if (confirmCallback) {
    confirmCallback();
  }
  closeConfirmDialog();
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

  openConfirmDialog('删除视图', `确定要删除视图"${view.name}"吗？`, () => {
    filterViews = filterViews.filter(v => v.id !== activeViewId);
    saveFilterViews();
    if (defaultViewId === activeViewId) {
      defaultViewId = null;
      localStorage.removeItem(defaultViewKey);
    }
    activeViewId = null;
    updateFilterUI();
  });
}

function openRenameViewDialog() {
  if (!activeViewId) return;
  const view = filterViews.find(v => v.id === activeViewId);
  if (!view) return;

  document.querySelector('#viewRenameOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.querySelector('#viewRenameInput').value = view.name;
  document.querySelector('#viewRenameInput').focus();
  document.querySelector('#viewRenameInput').select();
}

function closeRenameViewDialog() {
  document.querySelector('#viewRenameOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function renameActiveView() {
  openRenameViewDialog();
}

function doRenameView() {
  if (!activeViewId) return;
  const name = document.querySelector('#viewRenameInput').value.trim();
  if (!name) {
    openConfirmDialog('提示', '请输入视图名称', null);
    return;
  }

  filterViews = filterViews.map(v => 
    v.id === activeViewId ? { ...v, name, updatedAt: new Date().toISOString() } : v
  );
  saveFilterViews();
  closeRenameViewDialog();
  updateFilterUI();
}

function toggleDefaultView() {
  if (!activeViewId) return;

  if (defaultViewId === activeViewId) {
    defaultViewId = null;
    localStorage.removeItem(defaultViewKey);
  } else {
    defaultViewId = activeViewId;
    localStorage.setItem(defaultViewKey, defaultViewId);
  }
  updateFilterUI();
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
    case 'timePeriod':
      currentFilters.timePeriod = '';
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
      updatedAt: existing.updatedAt,
      patrolTaskId: existing.patrolTaskId || null
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

function setAlarmPatrolTaskId(alarmId, taskId) {
  alarms = alarms.map(a =>
    a.id === alarmId ? { ...a, patrolTaskId: taskId || null, updatedAt: new Date().toISOString() } : a
  );
  saveAlarms();
}

function clearAlarmPatrolTaskId(taskId) {
  let updated = false;
  alarms = alarms.map(a => {
    if (a.patrolTaskId === taskId) {
      updated = true;
      return { ...a, patrolTaskId: null, updatedAt: new Date().toISOString() };
    }
    return a;
  });
  if (updated) saveAlarms();
  return updated;
}

function getAlarmDay(alarm) {
  if (alarm.type === 'multiple' && alarm.day) {
    return alarm.day;
  }
  if (alarm.at) {
    return alarm.at.slice(0, 10);
  }
  return '';
}

function getMergedAlarmStatus(alarmList) {
  if (alarmList.some(a => a.status === 'pending')) return 'pending';
  if (alarmList.some(a => a.status === 'confirmed')) return 'confirmed';
  return 'ignored';
}

function getMergedAlarmTypes(alarmList) {
  return [...new Set(alarmList.map(a => a.type))];
}

function mergeAlarmsByLocationAndDay(alarmList) {
  const timeWindowMs = (alarmConfig.mergeTimeWindowHours || 2) * 60 * 60 * 1000;
  const locationDayGroups = new Map();

  alarmList.forEach(alarm => {
    const day = getAlarmDay(alarm);
    const key = `${alarm.location}__${day}`;
    if (!locationDayGroups.has(key)) {
      locationDayGroups.set(key, []);
    }
    locationDayGroups.get(key).push(alarm);
  });

  const mergedEvents = [];

  locationDayGroups.forEach((groupAlarms, key) => {
    const [location, day] = key.split('__');
    const sortedAlarms = [...groupAlarms].sort((a, b) => {
      const timeA = new Date(a.at || a.day).getTime();
      const timeB = new Date(b.at || b.day).getTime();
      return timeA - timeB;
    });

    const timeWindows = [];
    let currentWindow = [sortedAlarms[0]];

    for (let i = 1; i < sortedAlarms.length; i++) {
      const prevTime = new Date(sortedAlarms[i - 1].at || sortedAlarms[i - 1].day).getTime();
      const currTime = new Date(sortedAlarms[i].at || sortedAlarms[i].day).getTime();

      if (currTime - prevTime <= timeWindowMs) {
        currentWindow.push(sortedAlarms[i]);
      } else {
        timeWindows.push(currentWindow);
        currentWindow = [sortedAlarms[i]];
      }
    }
    timeWindows.push(currentWindow);

    timeWindows.forEach((windowAlarms, windowIndex) => {
      const windowSorted = [...windowAlarms].sort((a, b) => {
        const timeA = new Date(a.at || a.day).getTime();
        const timeB = new Date(b.at || b.day).getTime();
        return timeB - timeA;
      });

      const maxDb = Math.max(...windowAlarms.map(a => a.db || a.maxDb || 0));
      const types = getMergedAlarmTypes(windowAlarms);
      const status = getMergedAlarmStatus(windowAlarms);
      const earliestAt = windowSorted[windowSorted.length - 1].at || windowSorted[windowSorted.length - 1].day;
      const latestAt = windowSorted[0].at || windowSorted[0].day;
      const hasPatrolTask = windowAlarms.some(a => a.patrolTaskId);

      const windowId = timeWindows.length > 1
        ? `merged-${key}-w${windowIndex}`
        : `merged-${key}`;

      mergedEvents.push({
        id: windowId,
        key: timeWindows.length > 1 ? `${key}-w${windowIndex}` : key,
        location,
        day,
        alarms: windowSorted,
        alarmCount: windowSorted.length,
        types,
        status,
        maxDb,
        earliestAt,
        latestAt,
        hasPatrolTask,
        windowIndex: timeWindows.length > 1 ? windowIndex + 1 : null,
        totalWindows: timeWindows.length > 1 ? timeWindows.length : null
      });
    });
  });

  mergedEvents.sort((a, b) => {
    const timeA = new Date(a.latestAt || a.day);
    const timeB = new Date(b.latestAt || b.day);
    return timeB - timeA;
  });

  return mergedEvents;
}

function getAlarmRelatedRecordsInfo(alarm) {
  if (alarm.type === 'multiple') {
    const relatedRecords = records.filter(r => alarm.recordIds?.includes(r.id));
    if (relatedRecords.length) {
      const parts = relatedRecords.slice(0, 3).map(r => {
        return `${r.at.slice(5, 16).replace('T', ' ')} ${r.db}dB ${r.source}`;
      });
      if (relatedRecords.length > 3) parts.push(`...共${relatedRecords.length}条`);
      return parts.join('；');
    }
  } else if (alarm.recordId) {
    const record = records.find(r => r.id === alarm.recordId);
    if (record) {
      return `${record.at.slice(5, 16).replace('T', ' ')} ${record.db}dB ${record.source} ${record.feeling}`;
    }
  }
  return '无关联记录';
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

function isEmptyCoordValue(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

function isValidCoord(latitude, longitude) {
  if (isEmptyCoordValue(latitude) || isEmptyCoordValue(longitude)) return false;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function getPointTypeColor(typeValue) {
  const colorMap = {
    traffic: '#dc2626',
    residential: '#2563eb',
    commercial: '#d97706',
    park: '#059669',
    school: '#7c3aed',
    other: '#4b5563'
  };
  return colorMap[typeValue] || colorMap.other;
}

function getRecent7DaysMaxDb(pointId) {
  if (!pointId) return null;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const pointRecords = records.filter(r => {
    if (r.monitoringPointId !== pointId) return false;
    const recordDate = new Date(r.at);
    return recordDate >= sevenDaysAgo && recordDate <= now;
  });
  if (!pointRecords.length) return null;
  return Math.max(...pointRecords.map(r => r.db));
}

function getPointSizeByDb(maxDb) {
  if (maxDb === null) return 8;
  const minSize = 8;
  const maxSize = 20;
  const minDb = 40;
  const rangeDb = 90;
  const normalized = Math.min(Math.max((maxDb - minDb) / rangeDb, 0), 1);
  return minSize + normalized * (maxSize - minSize);
}

function getStrokeWidthByDb(maxDb) {
  if (maxDb === null) return 1.5;
  if (maxDb >= thresholds.harsh) return 4;
  if (maxDb >= thresholds.highNoise) return 3;
  return 1.5;
}

function getStrokeColorByDb(maxDb) {
  if (maxDb === null) return '#cbd5e1';
  if (maxDb >= thresholds.harsh) return '#dc2626';
  if (maxDb >= thresholds.highNoise) return '#f97316';
  return '#94a3b8';
}

function renderMapView() {
  const container = document.querySelector('#mapContainer');
  const statsEl = document.querySelector('#mapViewStats');
  const legendEl = document.querySelector('#mapLegend');
  if (!container) return;

  const validPoints = monitoringPoints.filter(p => isValidCoord(p.latitude, p.longitude));
  const invalidCount = monitoringPoints.length - validPoints.length;

  if (statsEl) {
    statsEl.innerHTML = `
      <span>共 <strong>${monitoringPoints.length}</strong> 个监测点</span>
      <span>可绘制 <strong style="color:#059669;">${validPoints.length}</strong></span>
      ${invalidCount > 0 ? `<span>坐标异常 <strong style="color:#dc2626;">${invalidCount}</strong></span>` : ''}
    `;
  }

  if (!validPoints.length) {
    container.innerHTML = `
      <div class="map-empty">
        <div class="map-empty-icon">🗺️</div>
        <p class="map-empty-text">暂无有效的监测点坐标数据</p>
        <p class="map-empty-tip">请在上方表单中添加或编辑监测点，填写正确的经纬度</p>
      </div>
    `;
    if (legendEl) legendEl.innerHTML = '';
    return;
  }

  const lats = validPoints.map(p => Number(p.latitude));
  const lngs = validPoints.map(p => Number(p.longitude));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latPadding = Math.max((maxLat - minLat) * 0.15, 0.001);
  const lngPadding = Math.max((maxLng - minLng) * 0.15, 0.001);
  const viewMinLat = minLat - latPadding;
  const viewMaxLat = maxLat + latPadding;
  const viewMinLng = minLng - lngPadding;
  const viewMaxLng = maxLng + lngPadding;

  const svgWidth = 800;
  const svgHeight = 360;
  const padding = 50;
  const plotWidth = svgWidth - padding * 2;
  const plotHeight = svgHeight - padding * 2;

  const latRange = viewMaxLat - viewMinLat;
  const lngRange = viewMaxLng - viewMinLng;

  function coordToSvg(lat, lng) {
    const x = padding + ((Number(lng) - viewMinLng) / lngRange) * plotWidth;
    const y = padding + (1 - (Number(lat) - viewMinLat) / latRange) * plotHeight;
    return { x, y };
  }

  const gridLines = [];
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const y = padding + (i / gridCount) * plotHeight;
    const lat = viewMaxLat - (i / gridCount) * latRange;
    gridLines.push(`<line class="map-grid-line" x1="${padding}" y1="${y}" x2="${svgWidth - padding}" y2="${y}"/>`);
    gridLines.push(`<text class="map-axis-label" x="${padding - 6}" y="${y + 3}" text-anchor="end">${lat.toFixed(3)}°N</text>`);

    const x = padding + (i / gridCount) * plotWidth;
    const lng = viewMinLng + (i / gridCount) * lngRange;
    gridLines.push(`<line class="map-grid-line" x1="${x}" y1="${padding}" x2="${x}" y2="${svgHeight - padding}"/>`);
    gridLines.push(`<text class="map-axis-label" x="${x}" y="${svgHeight - padding + 16}" text-anchor="middle">${lng.toFixed(3)}°E</text>`);
  }

  const pointElements = [];
  validPoints.forEach(point => {
    const { x, y } = coordToSvg(point.latitude, point.longitude);
    const typeInfo = getPointTypeInfo(point.type);
    const fillColor = getPointTypeColor(point.type);
    const maxDb = getRecent7DaysMaxDb(point.id);
    const radius = getPointSizeByDb(maxDb);
    const strokeWidth = getStrokeWidthByDb(maxDb);
    const strokeColor = getStrokeColorByDb(maxDb);

    pointElements.push(`
      <g class="map-point" data-map-point-id="${point.id}" style="cursor:pointer;">
        <circle
          cx="${x}"
          cy="${y}"
          r="${radius}"
          fill="${fillColor}"
          fill-opacity="0.85"
          stroke="${strokeColor}"
          stroke-width="${strokeWidth}"
        />
        <text class="map-point-label" x="${x}" y="${y - radius - 6}" text-anchor="middle">${escapeHtml(point.name)}</text>
        ${maxDb !== null ? `<text class="map-point-db-label" x="${x}" y="${y + radius + 14}" text-anchor="middle">${maxDb}dB</text>` : ''}
      </g>
    `);
  });

  container.innerHTML = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="mapPointShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.2"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="transparent"/>
      ${gridLines.join('')}
      <g filter="url(#mapPointShadow)">
        ${pointElements.join('')}
      </g>
    </svg>
  `;

  if (legendEl) {
    legendEl.innerHTML = `
      <div class="map-legend-group">
        <span class="map-legend-title">点位类型：</span>
        ${pointTypes.map(t => `
          <div class="map-legend-item">
            <span class="map-legend-dot" style="background:${getPointTypeColor(t.value)};"></span>
            <span>${t.label}</span>
          </div>
        `).join('')}
      </div>
      <div class="map-legend-group">
        <span class="map-legend-title">7日最高分贝：</span>
        <div class="map-legend-size">
          <div class="map-legend-size-item">
            <svg width="24" height="24"><circle cx="12" cy="16" r="4" fill="#64748b" stroke="#94a3b8" stroke-width="1.5"/></svg>
            <span>无数据</span>
          </div>
          <div class="map-legend-size-item">
            <svg width="24" height="24"><circle cx="12" cy="15" r="5" fill="#64748b" stroke="#94a3b8" stroke-width="1.5"/></svg>
            <span>~50dB</span>
          </div>
          <div class="map-legend-size-item">
            <svg width="28" height="28"><circle cx="14" cy="16" r="8" fill="#64748b" stroke="#f97316" stroke-width="3"/></svg>
            <span>~75dB</span>
          </div>
          <div class="map-legend-size-item">
            <svg width="32" height="32"><circle cx="16" cy="17" r="11" fill="#64748b" stroke="#dc2626" stroke-width="4"/></svg>
            <span>~90dB+</span>
          </div>
        </div>
      </div>
    `;
  }

  container.querySelectorAll('[data-map-point-id]').forEach(g => {
    g.addEventListener('click', () => {
      const pointId = g.dataset.mapPointId;
      const point = getMonitoringPointById(pointId);
      if (point) {
        closeMonitoringPointPanel();
        openLocationDetail(point.name, point.id);
      }
    });
  });
}

function renderMonitoringPointsList() {
  const listEl = document.querySelector('#monitoringPointsList');

  if (!monitoringPoints.length) {
    listEl.innerHTML = '<p class="empty">暂无监测点，请先添加</p>';
    renderMapView();
    return;
  }

  listEl.innerHTML = monitoringPoints
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(point => {
      const typeInfo = getPointTypeInfo(point.type);
      const recordCount = records.filter(r => r.monitoringPointId === point.id).length;
      const pointRecords = records.filter(r => r.monitoringPointId === point.id);
      const avgDb = pointRecords.length ? average(pointRecords.map(r => r.db)).toFixed(1) : '--';
      const coordValid = isValidCoord(point.latitude, point.longitude);

      return `
        <div class="monitoring-point-item" style="${!coordValid ? 'border-color:#fca5a5;background:#fef2f2;' : ''}">
          <div class="monitoring-point-info">
            <h4>
              ${point.name}
              ${!coordValid ? '<span class="invalid-coord-warning">⚠️ 坐标异常</span>' : ''}
            </h4>
            <div class="point-meta">
              <span>📍 ${point.district}</span>
              <span class="point-type-badge ${typeInfo.colorClass} ${!coordValid ? 'invalid-coord-badge' : ''}">${typeInfo.label}</span>
              <span>📊 ${recordCount} 条记录</span>
              ${pointRecords.length ? `<span>🔊 平均 ${avgDb}dB</span>` : ''}
            </div>
            <div class="point-coords ${!coordValid ? 'invalid' : ''}">
              🗺️ 坐标：${coordValid
                ? `${Number(point.latitude).toFixed(4)}, ${Number(point.longitude).toFixed(4)}`
                : `${isEmptyCoordValue(point.latitude) ? '空' : point.latitude}, ${isEmptyCoordValue(point.longitude) ? '空' : point.longitude} — ${
                    isEmptyCoordValue(point.latitude) || isEmptyCoordValue(point.longitude)
                      ? '经纬度不能为空'
                      : isNaN(Number(point.latitude)) || isNaN(Number(point.longitude))
                        ? '经纬度必须是数字'
                        : (Number(point.latitude) < -90 || Number(point.latitude) > 90)
                          ? '纬度范围必须在 -90 到 90 之间'
                          : '经度范围必须在 -180 到 180 之间'
                  }`}
            </div>
            ${point.notes ? `<div class="point-notes">📝 ${escapeHtml(point.notes)}</div>` : ''}
          </div>
          <div class="monitoring-point-actions">
            <button class="secondary" data-edit-point="${point.id}">编辑</button>
            <button class="secondary" data-del-point="${point.id}">删除</button>
          </div>
        </div>
      `;
    }).join('');

  renderMapView();

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

const timePeriods = [
  { key: 'morning', label: '早高峰', startHour: 7, endHour: 9 },
  { key: 'noon', label: '午间', startHour: 11, endHour: 13 },
  { key: 'evening', label: '晚高峰', startHour: 17, endHour: 19 },
  { key: 'night', label: '夜间', startHour: 22, endHour: 6 }
];

const timeRanges = [
  { key: '7d', label: '近7天', days: 7 },
  { key: '30d', label: '近30天', days: 30 }
];

function getTimePeriodKey(hour) {
  for (const period of timePeriods) {
    if (period.key === 'night') {
      if (hour >= period.startHour || hour < period.endHour) {
        return period.key;
      }
    } else {
      if (hour >= period.startHour && hour < period.endHour) {
        return period.key;
      }
    }
  }
  return null;
}

function getTimePeriodLabel(key) {
  const period = timePeriods.find(p => p.key === key);
  return period ? period.label : key;
}

function getRecordsWithinDays(records, days, pointId = null, location = null) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().slice(0, 16);
  return records.filter(r => {
    if (r.at < cutoffStr) return false;
    if (pointId && r.monitoringPointId !== pointId) return false;
    if (location && !pointId && r.location !== location) return false;
    return true;
  });
}

function computeHeatmapData(pointId = null, location = null) {
  const result = {};
  for (const range of timeRanges) {
    result[range.key] = {};
    for (const period of timePeriods) {
      result[range.key][period.key] = {
        maxDb: null,
        exceedCount: 0,
        recordCount: 0,
        recordIds: []
      };
    }
    const rangeRecords = getRecordsWithinDays(records, range.days, pointId, location);
    rangeRecords.forEach(r => {
      const hour = new Date(r.at).getHours();
      const periodKey = getTimePeriodKey(hour);
      if (!periodKey) return;
      const cell = result[range.key][periodKey];
      cell.recordCount++;
      cell.recordIds.push(r.id);
      if (cell.maxDb === null || r.db > cell.maxDb) {
        cell.maxDb = r.db;
      }
      if (r.db >= thresholds.highNoise) {
        cell.exceedCount++;
      }
    });
  }
  return result;
}

function getHeatmapColor(maxDb, exceedCount) {
  if (maxDb === null) return '#e2e8f0';
  if (exceedCount === 0) {
    if (maxDb >= thresholds.highNoise) return '#fde68a';
    return '#bbf7d0';
  }
  if (maxDb >= thresholds.harsh) return '#fecaca';
  if (maxDb >= thresholds.highNoise) return '#fed7aa';
  if (exceedCount >= 3) return '#fecaca';
  if (exceedCount >= 1) return '#fed7aa';
  return '#bbf7d0';
}

function drawHeatmap(selector, heatmapData, pointId = null, location = null) {
  const el = document.querySelector(selector);
  if (!el) return;

  const cellWidth = 140;
  const cellHeight = 80;
  const headerWidth = 90;
  const headerHeight = 48;
  const padding = 10;

  const totalWidth = headerWidth + timeRanges.length * cellWidth + padding * 2;
  const totalHeight = headerHeight + timePeriods.length * cellHeight + padding * 2;

  let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" style="width:100%;min-height:${totalHeight}px;">`;

  svg += `<text x="${padding}" y="${padding + 20}" fill="#79695e" font-size="13" text-anchor="start" font-weight="600">时段</text>`;
  timeRanges.forEach((range, ri) => {
    const x = headerWidth + padding + ri * cellWidth + cellWidth / 2;
    svg += `<text x="${x}" y="${padding + 20}" fill="#79695e" font-size="13" text-anchor="middle" font-weight="600">${range.label}</text>`;
  });

  svg += `<line x1="${padding}" y1="${headerHeight - 4}" x2="${totalWidth - padding}" y2="${headerHeight - 4}" stroke="#e2e8f0" stroke-width="1"/>`;

  timePeriods.forEach((period, pi) => {
    const y = headerHeight + padding + pi * cellHeight;
    svg += `<text x="${padding + 8}" y="${y + cellHeight / 2 + 5}" fill="#251e1a" font-size="13" text-anchor="start" font-weight="600">${period.label}</text>`;
    svg += `<text x="${padding + 8}" y="${y + cellHeight / 2 + 22}" fill="#94a3b8" font-size="10" text-anchor="start">${period.key === 'night' ? `${String(period.startHour).padStart(2, '0')}:00-${String(period.endHour).padStart(2, '0')}:00` : `${String(period.startHour).padStart(2, '0')}:00-${String(period.endHour).padStart(2, '0')}:00`}</text>`;

    timeRanges.forEach((range, ri) => {
      const x = headerWidth + padding + ri * cellWidth + 8;
      const cell = heatmapData[range.key][period.key];
      const bgColor = getHeatmapColor(cell.maxDb, cell.exceedCount);
      const borderColor = cell.maxDb !== null && cell.maxDb >= thresholds.harsh ? '#dc2626' : '#e2e8f0';
      const isClickable = cell.recordCount > 0;

      svg += `<g class="heatmap-cell" style="${isClickable ? 'cursor:pointer;' : ''}" data-heat-point-id="${pointId || ''}" data-heat-location="${location || ''}" data-heat-range="${range.key}" data-heat-period="${period.key}">`;
      svg += `<rect x="${x}" y="${y}" width="${cellWidth - 16}" height="${cellHeight - 8}" rx="6" ry="6" style="fill:${bgColor};stroke:${borderColor};stroke-width:${cell.maxDb !== null && cell.maxDb >= thresholds.harsh ? 2 : 1};"/>`;

      if (cell.maxDb !== null) {
        const dbColor = cell.maxDb >= thresholds.harsh ? '#dc2626' : (cell.maxDb >= thresholds.highNoise ? '#ea580c' : '#251e1a');
        svg += `<text x="${x + (cellWidth - 16) / 2}" y="${y + 28}" fill="${dbColor}" font-size="18" text-anchor="middle" font-weight="700">${cell.maxDb}dB</text>`;
      } else {
        svg += `<text x="${x + (cellWidth - 16) / 2}" y="${y + 28}" fill="#94a3b8" font-size="14" text-anchor="middle">—</text>`;
      }

      if (cell.exceedCount > 0) {
        const exceedColor = cell.exceedCount >= 3 ? '#dc2626' : '#ea580c';
        svg += `<text x="${x + (cellWidth - 16) / 2}" y="${y + 52}" fill="${exceedColor}" font-size="11" text-anchor="middle" font-weight="600">超标 ${cell.exceedCount} 次</text>`;
      } else if (cell.recordCount > 0) {
        svg += `<text x="${x + (cellWidth - 16) / 2}" y="${y + 52}" fill="#059669" font-size="11" text-anchor="middle">无超标</text>`;
      } else {
        svg += `<text x="${x + (cellWidth - 16) / 2}" y="${y + 52}" fill="#94a3b8" font-size="11" text-anchor="middle">无数据</text>`;
      }

      svg += `</g>`;
    });
  });

  svg += `</svg>`;

  svg += `<div class="heatmap-legend">`;
  svg += `<span class="heatmap-legend-title">图例：</span>`;
  svg += `<span class="heatmap-legend-item"><span style="background:#bbf7d0;"></span>正常</span>`;
  svg += `<span class="heatmap-legend-item"><span style="background:#fde68a;"></span>临界</span>`;
  svg += `<span class="heatmap-legend-item"><span style="background:#fed7aa;"></span>超标</span>`;
  svg += `<span class="heatmap-legend-item"><span style="background:#fecaca;border:2px solid #dc2626;"></span>刺耳</span>`;
  svg += `<span class="heatmap-legend-item"><span style="background:#e2e8f0;"></span>无数据</span>`;
  svg += `</div>`;

  el.innerHTML = svg;

  el.querySelectorAll('.heatmap-cell').forEach(g => {
    const range = g.dataset.heatRange;
    const period = g.dataset.heatPeriod;
    const pId = g.dataset.heatPointId || null;
    const loc = g.dataset.heatLocation || null;
    const cellData = heatmapData[range]?.[period];
    if (cellData && cellData.recordCount > 0) {
      g.addEventListener('click', () => {
        navigateToRecords(range, period, pId, loc);
      });
    }
  });
}

function navigateToRecords(rangeKey, periodKey, pointId, location) {
  const range = timeRanges.find(r => r.key === rangeKey);
  const period = timePeriods.find(p => p.key === periodKey);
  if (!range || !period) return;

  const now = new Date();
  const cutoff = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);
  currentFilters.dateStart = cutoff.toISOString().slice(0, 10);
  currentFilters.dateEnd = now.toISOString().slice(0, 10);
  currentFilters.highNoiseStatus = 'all';
  currentFilters.sources = [];
  currentFilters.feelings = [];
  currentFilters.dbMin = '';
  currentFilters.dbMax = '';
  currentFilters.locations = location ? [location] : [];
  currentFilters.timePeriod = periodKey;
  activeViewId = null;

  if (pointId) {
    selectedMonitoringPointFilter = pointId;
  }

  document.querySelector('#locationDetailOverlay').classList.add('hidden');
  document.querySelector('#healthDashboardOverlay').classList.add('hidden');
  document.querySelector('#monitoringPointOverlay').classList.add('hidden');
  document.body.style.overflow = '';

  updateFilterUI();
  render();

  let preFiltered = records.filter((record) => [record.location, record.source, record.feeling].join(' ').includes(search.value.trim()));
  if (selectedMonitoringPointFilter) {
    preFiltered = preFiltered.filter(record => record.monitoringPointId === selectedMonitoringPointFilter);
  }
  const periodRecords = applyFilters(preFiltered);

  if (periodRecords.length > 0) {
    const rowsEl = document.querySelector('#rows');
    if (rowsEl) {
      rowsEl.scrollIntoView({ behavior: 'smooth' });
    }
    const msg = `${range.label} · ${period.label} · 共 ${periodRecords.length} 条记录`;
    const banner = document.createElement('div');
    banner.className = 'heatmap-filter-banner';
    banner.innerHTML = `<span>🔍 时段筛选：${msg}</span><button class="heatmap-filter-close" id="heatmapFilterClose">&times;</button>`;
    banner.style.cssText = 'position:sticky;top:0;z-index:100;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;';
    const closeBtnStyle = 'background:none;border:none;font-size:20px;cursor:pointer;color:#92400e;line-height:1;padding:0 4px;';
    const filterPanel = document.querySelector('#filterPanel');
    if (filterPanel && !document.querySelector('.heatmap-filter-banner')) {
      filterPanel.insertAdjacentElement('afterend', banner);
      setTimeout(() => {
        const closeBtn = document.querySelector('#heatmapFilterClose');
        if (closeBtn) {
          closeBtn.style.cssText = closeBtnStyle;
          closeBtn.addEventListener('click', () => banner.remove());
        }
      }, 10);
    }
  }
}

function drawCompactHeatmap(containerEl, heatmapData, pointId, location) {
  const cellSize = 28;
  const labelWidth = 52;
  const totalWidth = labelWidth + timeRanges.length * cellSize;
  const totalHeight = timePeriods.length * cellSize + 20;

  let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" style="width:100%;height:${totalHeight}px;">`;

  timeRanges.forEach((range, ri) => {
    svg += `<text x="${labelWidth + ri * cellSize + cellSize / 2}" y="14" fill="#79695e" font-size="10" text-anchor="middle">${range.label.replace('近', '')}</text>`;
  });

  timePeriods.forEach((period, pi) => {
    const y = 20 + pi * cellSize + 2;
    svg += `<text x="4" y="${y + cellSize / 2 + 3}" fill="#64748b" font-size="10" text-anchor="start">${period.label}</text>`;

    timeRanges.forEach((range, ri) => {
      const x = labelWidth + ri * cellSize + 2;
      const cell = heatmapData[range.key][period.key];
      const bgColor = getHeatmapColor(cell.maxDb, cell.exceedCount);
      const isClickable = cell.recordCount > 0;
      const borderColor = cell.maxDb !== null && cell.maxDb >= thresholds.harsh ? '#dc2626' : '#e2e8f0';

      svg += `<g class="compact-heat-cell" style="${isClickable ? 'cursor:pointer;' : ''}" data-heat-point-id="${pointId || ''}" data-heat-location="${location || ''}" data-heat-range="${range.key}" data-heat-period="${period.key}">`;
      svg += `<rect x="${x}" y="${y}" width="${cellSize - 4}" height="${cellSize - 4}" rx="3" ry="3" style="fill:${bgColor};stroke:${borderColor};stroke-width:${cell.maxDb !== null && cell.maxDb >= thresholds.harsh ? 1.5 : 0.5};"/>`;
      if (cell.exceedCount > 0) {
        const ec = cell.exceedCount > 9 ? '9+' : cell.exceedCount;
        svg += `<text x="${x + (cellSize - 4) / 2}" y="${y + (cellSize - 4) / 2 + 4}" fill="${cell.exceedCount >= 3 ? '#dc2626' : '#ea580c'}" font-size="10" text-anchor="middle" font-weight="700">${ec}</text>`;
      } else if (cell.maxDb !== null) {
        svg += `<text x="${x + (cellSize - 4) / 2}" y="${y + (cellSize - 4) / 2 + 4}" fill="#64748b" font-size="9" text-anchor="middle">${cell.maxDb}</text>`;
      }
      svg += `</g>`;
    });
  });

  svg += `</svg>`;
  containerEl.innerHTML = svg;

  containerEl.querySelectorAll('.compact-heat-cell').forEach(g => {
    const range = g.dataset.heatRange;
    const period = g.dataset.heatPeriod;
    const pId = g.dataset.heatPointId || null;
    const loc = g.dataset.heatLocation || null;
    const cellData = heatmapData[range]?.[period];
    if (cellData && cellData.recordCount > 0) {
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToRecords(range, period, pId, loc);
      });
    }
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
    return `<div class="hot noise-level-${level}"><strong>${record.db}dB</strong><div class="hot-main"><span>${record.location}${point ? ` <span class="point-type-badge ${getPointTypeInfo(point.type).colorClass}" style="font-size:10px;padding:2px 6px;">${getPointTypeInfo(point.type).label}</span>` : ''}</span><em>${record.source}</em></div><button class="hot-patrol-btn" data-patrol-record-id="${record.id}">转任务</button></div>`;
  }).join('') || '<p class="empty">暂无高噪声记录</p>';

  document.querySelectorAll('[data-patrol-record-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const recordId = btn.dataset.patrolRecordId;
      const record = records.find(r => r.id === recordId);
      if (record) createPatrolFromRecord(record);
    });
  });

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

function openLocationDetail(location, pointId = null) {
  const locationRecords = records
    .filter((record) => record.location === location || (pointId && record.monitoringPointId === pointId))
    .sort((a, b) => a.at.localeCompare(b.at));

  const point = pointId ? getMonitoringPointById(pointId)
    : (locationRecords[0]?.monitoringPointId ? getMonitoringPointById(locationRecords[0].monitoringPointId) : null);

  const displayName = point ? point.name : location;

  const stats = locationRecords.length ? calculateLocationStats(locationRecords) : null;
  const mainSource = locationRecords.length ? getMainSource(locationRecords.map((r) => r.source)) : null;

  let title = `${displayName} · 噪声详情`;
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
      ${point.notes ? `
      <div class="stat-card">
        <span class="stat-label">备注</span>
        <strong class="stat-value" style="font-size:13px;">${escapeHtml(point.notes)}</strong>
      </div>` : ''}
    `;
  }

  if (locationRecords.length) {
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
  } else {
    document.querySelector('#locationDetailStats').innerHTML = `
      <div class="stat-card">
        <span class="stat-label">观测次数</span>
        <strong class="stat-value">0</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">数据状态</span>
        <strong class="stat-value" style="color:#ef4444;">暂无观测记录</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">提示</span>
        <strong class="stat-value" style="font-size:13px;">请尽快前往该点位进行噪声采集</strong>
      </div>
      ${extraStats}
    `;

    document.querySelector('#locationDetailChart').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:220px;color:#79695e;">
        <p style="font-size:48px;margin:0 0 12px 0;">📭</p>
        <p style="margin:0;">该点位暂无历史观测记录</p>
      </div>
    `;

    document.querySelector('#locationDetailRows').innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;padding:40px 16px;color:#79695e;">
          <p style="font-size:24px;margin:0 0 8px 0;">🔇</p>
          <p style="margin:0;">暂无历史记录</p>
        </td>
      </tr>
    `;
  }

  const heatmapData = computeHeatmapData(point?.id || null, point ? null : location);
  drawHeatmap('#locationDetailHeatmap', heatmapData, point?.id || null, point ? null : location);

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

function openImportBatches() {
  document.querySelector('#importBatchesOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  renderImportBatches();
}

function closeImportBatches() {
  document.querySelector('#importBatchesOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function revertImportBatch(batchId) {
  const batch = importBatches.find(b => b.id === batchId);
  if (!batch || batch.status === 'reverted') return;

  const recordIdSet = new Set(batch.recordIds);
  records = records.filter(r => !recordIdSet.has(r.id));

  batch.status = 'reverted';
  batch.revertedAt = new Date().toISOString();
  saveImportBatches();
  save();
  recalculateAlarms();
  renderImportBatches();
  render();
}

function renderImportBatches() {
  const totalCount = importBatches.length;
  const activeCount = importBatches.filter(b => b.status === 'active').length;
  const revertedCount = importBatches.filter(b => b.status === 'reverted').length;
  const totalRecords = importBatches
    .filter(b => b.status === 'active')
    .reduce((sum, b) => sum + b.successCount, 0);

  document.querySelector('#importBatchesTotalCount').textContent = totalCount;
  document.querySelector('#importBatchesActiveCount').textContent = activeCount;
  document.querySelector('#importBatchesRevertedCount').textContent = revertedCount;
  document.querySelector('#importBatchesTotalRecords').textContent = totalRecords;

  const listEl = document.querySelector('#importBatchesList');
  if (!importBatches.length) {
    listEl.innerHTML = '<p class="empty">暂无导入记录</p>';
    return;
  }

  listEl.innerHTML = importBatches.map(batch => {
    const isReverted = batch.status === 'reverted';
    return `
      <div class="import-batch-item ${isReverted ? 'reverted' : ''}">
        <div class="import-batch-header">
          <div class="import-batch-title">
            <span class="import-batch-file-icon">📄</span>
            <span class="import-batch-filename">${escapeHtml(batch.fileName)}</span>
            <span class="import-batch-status ${isReverted ? 'status-reverted' : 'status-active'}">
              ${isReverted ? '已撤销' : '已生效'}
            </span>
          </div>
          <div class="import-batch-time">${formatDateTime(batch.importTime)}</div>
        </div>
        <div class="import-batch-stats">
          <span class="import-batch-stat"><strong>${batch.successCount}</strong> 成功</span>
          <span class="import-batch-stat"><strong>${batch.errorCount}</strong> 错误</span>
          ${batch.skippedCount > 0 ? `<span class="import-batch-stat"><strong>${batch.skippedCount}</strong> 跳过</span>` : ''}
          <span class="import-batch-stat"><strong>${batch.recordIds.length}</strong> 条记录ID</span>
        </div>
        ${isReverted && batch.revertedAt ? `
          <div class="import-batch-reverted-info">
            撤销时间：${formatDateTime(batch.revertedAt)}
          </div>
        ` : ''}
        <div class="import-batch-actions">
          <button class="secondary" data-view-batch="${batch.id}" ${isReverted ? 'disabled' : ''}>查看记录ID</button>
          ${!isReverted ? `
            <button class="danger" data-revert-batch="${batch.id}">撤销导入</button>
          ` : ''}
        </div>
        <div class="import-batch-record-ids hidden" id="recordIds-${batch.id}">
          <div class="record-ids-header">关联记录ID：</div>
          <div class="record-ids-list">${batch.recordIds.map(id => `<span class="record-id-tag">${id.slice(0, 8)}...</span>`).join('')}</div>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-revert-batch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const batchId = btn.dataset.revertBatch;
      const batch = importBatches.find(b => b.id === batchId);
      if (batch) {
        openConfirmDialog(
          '撤销导入',
          `确定要撤销批次"${batch.fileName}"的导入吗？\n\n这将删除该批次导入的 ${batch.successCount} 条记录，相关告警和统计数据将重新计算。`,
          () => revertImportBatch(batchId)
        );
      }
    });
  });

  listEl.querySelectorAll('[data-view-batch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const batchId = btn.dataset.viewBatch;
      const recordIdsEl = document.querySelector(`#recordIds-${batchId}`);
      if (recordIdsEl) {
        recordIdsEl.classList.toggle('hidden');
        btn.textContent = recordIdsEl.classList.contains('hidden') ? '查看记录ID' : '隐藏记录ID';
      }
    });
  });
}

function loadAlarmConfig() {
  document.querySelector('#multipleExceedThreshold').value = alarmConfig.multipleExceedThreshold;
  document.querySelector('#nightStartHour').value = alarmConfig.nightStartHour;
  document.querySelector('#nightEndHour').value = alarmConfig.nightEndHour;
  document.querySelector('#nightNoiseThreshold').value = alarmConfig.nightNoiseThreshold;
  document.querySelector('#mergeTimeWindowHours').value = alarmConfig.mergeTimeWindowHours || 2;
  document.querySelector('#alarmStatusFilter').value = alarmStatusFilter;
  document.querySelector('#alarmTypeFilter').value = alarmTypeFilter;
  document.querySelector('#alarmViewModeSelect').value = alarmViewMode;
}

function renderAlarmCard(alarm) {
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

  let patrolTaskInfo = '';
  let patrolTaskBtn = '';
  if (alarm.patrolTaskId) {
    const task = patrolTasks.find(t => t.id === alarm.patrolTaskId);
    if (task) {
      const taskStatusLabel = patrolStatusLabels[task.status] || '未知';
      const taskStatusClass = `patrol-status-${task.status}`;
      patrolTaskInfo = `
          <div class="alarm-patrol-info">
            <span class="alarm-patrol-label">🔗 关联巡查任务：</span>
            <span class="patrol-status-badge ${taskStatusClass}">${taskStatusLabel}</span>
            <span class="alarm-patrol-task">${task.location} · ${task.assignee}</span>
            <button class="secondary alarm-patrol-view-btn" data-view-patrol="${task.id}">查看任务</button>
          </div>
        `;
    } else {
      patrolTaskInfo = `
          <div class="alarm-patrol-info alarm-patrol-missing">
            <span class="alarm-patrol-label">⚠️ 关联的巡查任务已不存在</span>
          </div>
        `;
    }
  } else {
    patrolTaskBtn = `<button class="primary" data-create-patrol="${alarm.id}">转巡查任务</button>`;
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
        ${patrolTaskInfo}
        <div class="alarm-footer">
          <span class="alarm-status-badge ${statusClass}">${statusLabel}</span>
          <span class="alarm-time">生成于 ${new Date(alarm.createdAt).toLocaleString('zh-CN')}</span>
          <div class="alarm-actions">
            ${patrolTaskBtn}
            ${alarm.status === 'pending' ? `
              <button class="secondary" data-confirm="${alarm.id}">确认</button>
              <button class="secondary" data-ignore="${alarm.id}">忽略</button>
            ` : `
              <button class="secondary" data-reopen="${alarm.id}">重新打开</button>
            `}
          </div>
        </div>
      </div>
    `;
}

function renderMergedAlarmCard(mergedEvent) {
  const isExpanded = expandedMergedAlarms.has(mergedEvent.id);
  const statusClass = `alarm-status-${mergedEvent.status}`;
  const statusLabel = {
    pending: '待处理',
    confirmed: '已确认',
    ignored: '已忽略'
  }[mergedEvent.status];

  const typeBadges = mergedEvent.types.map(type => {
    const typeLabels = { single: '单条超阈值', multiple: '日内多次超标', nighttime: '夜间高噪声' };
    return `<span class="alarm-type-badge alarm-type-badge-${type}">${typeLabels[type]}</span>`;
  }).join('');

  const pendingCount = mergedEvent.alarms.filter(a => a.status === 'pending').length;
  const confirmedCount = mergedEvent.alarms.filter(a => a.status === 'confirmed').length;
  const ignoredCount = mergedEvent.alarms.filter(a => a.status === 'ignored').length;

  const timeRange = mergedEvent.earliestAt && mergedEvent.latestAt && mergedEvent.earliestAt !== mergedEvent.latestAt
    ? `${mergedEvent.earliestAt.slice(5, 16).replace('T', ' ')} ~ ${mergedEvent.latestAt.slice(5, 16).replace('T', ' ')}`
    : mergedEvent.day;

  const windowLabel = mergedEvent.totalWindows
    ? `（时段${mergedEvent.windowIndex}/${mergedEvent.totalWindows}）`
    : '';

  const expandIcon = isExpanded ? '▼' : '▶';

  let innerAlarmsHtml = '';
  if (isExpanded) {
    innerAlarmsHtml = `
      <div class="merged-alarm-details">
        <div class="merged-alarm-section">
          <h4>关联告警记录</h4>
          <div class="merged-alarm-list">
            ${mergedEvent.alarms.map(alarm => renderAlarmCard(alarm)).join('')}
          </div>
        </div>
        <div class="merged-alarm-section">
          <h4>触发规则</h4>
          <div class="merged-rules-list">
            ${mergedEvent.types.map(type => {
              const ruleDescs = {
                single: `单条记录噪声值 ≥ ${thresholds.harsh}dB（刺耳阈值）`,
                multiple: `同一地点日内超标次数 ≥ ${alarmConfig.multipleExceedThreshold} 次（高噪声阈值 ${thresholds.highNoise}dB）`,
                nighttime: `夜间时段（${alarmConfig.nightStartHour}:00-${alarmConfig.nightEndHour}:00）噪声 ≥ ${alarmConfig.nightNoiseThreshold}dB`
              };
              const typeLabels = { single: '单条超阈值', multiple: '日内多次超标', nighttime: '夜间高噪声' };
              return `
                <div class="merged-rule-item">
                  <span class="alarm-type-badge alarm-type-badge-${type}">${typeLabels[type]}</span>
                  <span class="merged-rule-desc">${ruleDescs[type]}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="merged-alarm-section">
          <h4>处理状态统计</h4>
          <div class="merged-status-summary">
            <span class="merged-status-item merged-status-pending">待处理：${pendingCount} 条</span>
            <span class="merged-status-item merged-status-confirmed">已确认：${confirmedCount} 条</span>
            <span class="merged-status-item merged-status-ignored">已忽略：${ignoredCount} 条</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="merged-alarm-item ${statusClass}">
      <div class="merged-alarm-header" data-toggle-merged="${mergedEvent.id}">
        <div class="merged-alarm-expand">${expandIcon}</div>
        <div class="merged-alarm-main">
          <div class="merged-alarm-title">
            <span class="merged-alarm-location">${mergedEvent.location}</span>
            <span class="merged-alarm-count">${mergedEvent.alarmCount} 条告警${windowLabel}</span>
          </div>
          <div class="merged-alarm-types">
            ${typeBadges}
          </div>
          <div class="merged-alarm-meta">
            <span class="merged-alarm-time">📅 ${timeRange}</span>
            <span class="merged-alarm-maxdb">🔊 最高 ${mergedEvent.maxDb}dB</span>
            ${mergedEvent.hasPatrolTask ? '<span class="merged-alarm-patrol">🔗 已关联巡查</span>' : ''}
          </div>
        </div>
        <div class="merged-alarm-status-badge">
          <span class="alarm-status-badge ${statusClass}">${statusLabel}</span>
        </div>
      </div>
      ${innerAlarmsHtml}
    </div>
  `;
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

  if (alarmViewMode === 'merged') {
    const mergedEvents = mergeAlarmsByLocationAndDay(filteredAlarms);
    
    if (!mergedEvents.length) {
      alarmListEl.innerHTML = '<p class="empty">暂无告警事件</p>';
      return;
    }

    alarmListEl.innerHTML = mergedEvents.map(event => renderMergedAlarmCard(event)).join('');
    
    alarmListEl.querySelectorAll('[data-toggle-merged]').forEach(header => {
      header.addEventListener('click', () => {
        const id = header.dataset.toggleMerged;
        if (expandedMergedAlarms.has(id)) {
          expandedMergedAlarms.delete(id);
        } else {
          expandedMergedAlarms.add(id);
        }
        renderAlarmCenter();
      });
    });
  } else {
    alarmListEl.innerHTML = filteredAlarms.map(alarm => renderAlarmCard(alarm)).join('');
  }
  
  alarmListEl.querySelectorAll('[data-confirm]').forEach(btn => {
    btn.addEventListener('click', () => updateAlarmStatus(btn.dataset.confirm, 'confirmed'));
  });
  alarmListEl.querySelectorAll('[data-ignore]').forEach(btn => {
    btn.addEventListener('click', () => updateAlarmStatus(btn.dataset.ignore, 'ignored'));
  });
  alarmListEl.querySelectorAll('[data-reopen]').forEach(btn => {
    btn.addEventListener('click', () => updateAlarmStatus(btn.dataset.reopen, 'pending'));
  });
  alarmListEl.querySelectorAll('[data-create-patrol]').forEach(btn => {
    btn.addEventListener('click', () => {
      const alarmId = btn.dataset.createPatrol;
      const alarm = alarms.find(a => a.id === alarmId);
      if (alarm) createPatrolFromAlarm(alarm);
    });
  });
  alarmListEl.querySelectorAll('[data-view-patrol]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAlarmCenter();
      openPatrolTasks();
    });
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
    if (!document.querySelector('#confirmOverlay').classList.contains('hidden')) {
      closeConfirmDialog();
    } else if (!document.querySelector('#viewSaveOverlay').classList.contains('hidden')) {
      closeSaveViewDialog();
    } else if (!document.querySelector('#complaintOverlay').classList.contains('hidden')) {
      closeComplaints();
    } else if (!document.querySelector('#healthDashboardOverlay').classList.contains('hidden')) {
      closeHealthDashboard();
    } else if (!document.querySelector('#alarmCenterOverlay').classList.contains('hidden')) {
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

function generateRecordKey(record) {
  return `${record.at}|${record.location}|${record.db}|${record.source}`;
}

function detectDuplicates(validRecords) {
  const existingKeys = new Set(records.map(r => generateRecordKey(r)));
  const seenKeys = new Set();
  const duplicates = [];

  validRecords.forEach((record, index) => {
    const key = generateRecordKey(record);
    const isDuplicate = existingKeys.has(key) || seenKeys.has(key);
    if (isDuplicate) {
      duplicates.push(index);
    }
    seenKeys.add(key);
  });

  return duplicates;
}

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
      processImportData(rawData, file.name);
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

function processImportData(rawData, fileName) {
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

  const duplicateIndices = detectDuplicates(validRecords);

  importData = { validRecords, errorRecords, detectedFields: allDetectedFields, mapping, rawData, duplicateIndices, fileName };
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

  const duplicateSet = new Set(importData.duplicateIndices);

  document.querySelector('#fieldCount').textContent = Object.keys(importData.detectedFields).length;
  document.querySelector('#validCount').textContent = importData.validRecords.length;
  document.querySelector('#errorCount').textContent = importData.errorRecords.length;
  document.querySelector('#duplicateCount').textContent = duplicateSet.size;

  const duplicateOptionEl = document.querySelector('#duplicateOption');
  if (duplicateSet.size > 0) {
    duplicateOptionEl.classList.remove('hidden');
  } else {
    duplicateOptionEl.classList.add('hidden');
  }

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
  const previewStart = 0;
  const previewEnd = Math.min(10, importData.validRecords.length);

  previewHead.innerHTML = `<tr><th>状态</th><th>时间</th><th>地点</th><th>分贝</th><th>来源</th><th>感受</th></tr>`;
  let previewHtml = '';
  for (let globalIndex = previewStart; globalIndex < previewEnd; globalIndex++) {
    const record = importData.validRecords[globalIndex];
    const isDuplicate = duplicateSet.has(globalIndex);
    previewHtml += `
    <tr class="${isDuplicate ? 'duplicate-row' : ''}">
      <td class="status-cell">${isDuplicate ? '<span class="duplicate-badge">疑似重复</span>' : '<span class="ok-badge">正常</span>'}</td>
      <td>${record.at.replace('T', ' ')}</td>
      <td>${record.location}</td>
      <td>${record.db}dB</td>
      <td>${record.source}</td>
      <td>${record.feeling}</td>
    </tr>
  `;
  }
  previewBody.innerHTML = previewHtml;

  if (importData.validRecords.length > 10) {
    previewBody.innerHTML += `<tr><td colspan="6" class="more-rows">...还有${importData.validRecords.length - 10}条记录</td></tr>`;
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

  const skipDuplicates = document.querySelector('#skipDuplicates').checked;
  const duplicateSet = new Set(importData.duplicateIndices);

  let recordsToImport;
  let skippedCount = 0;

  if (skipDuplicates && duplicateSet.size > 0) {
    recordsToImport = importData.validRecords.filter((_, index) => !duplicateSet.has(index));
    skippedCount = duplicateSet.size;
  } else {
    recordsToImport = [...importData.validRecords];
    skippedCount = 0;
  }

  const importedCount = recordsToImport.length;
  const importedRecordIds = recordsToImport.map(r => r.id);

  if (importedCount > 0) {
    records = [...recordsToImport, ...records];
    save();
    recalculateAlarms();
    render();
  }

  const batch = {
    id: crypto.randomUUID(),
    fileName: importData.fileName || '未知文件',
    importTime: new Date().toISOString(),
    successCount: importedCount,
    errorCount: importData.errorRecords.length,
    skippedCount: skippedCount,
    recordIds: importedRecordIds,
    status: 'active'
  };
  importBatches = [batch, ...importBatches];
  saveImportBatches();

  resetImport();

  const duplicateCount = duplicateSet.size;
  const duplicateNote = duplicateCount > 0 && skippedCount === 0
    ? `\n包含重复：${duplicateCount} 条记录（未跳过）`
    : '';
  alert(`导入完成！\n实际导入：${importedCount} 条记录\n跳过重复：${skippedCount} 条记录${duplicateNote}\n\n可在"导入记录"中查看和撤销本次导入。`);
}

const patrolTaskForm = document.querySelector('#patrolTaskForm');

document.querySelector('#patrolTasksBtn').addEventListener('click', openPatrolTasks);
document.querySelector('#patrolTasksClose').addEventListener('click', closePatrolTasks);
document.querySelector('#patrolTasksOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'patrolTasksOverlay') closePatrolTasks();
});
document.querySelector('#newPatrolTaskBtn').addEventListener('click', () => {
  editingPatrolTaskId = null;
  showPatrolForm(null);
});
document.querySelector('#cancelPatrolEdit').addEventListener('click', () => {
  editingPatrolTaskId = null;
  hidePatrolForm();
});
document.querySelector('#patrolStatusFilter').addEventListener('change', (e) => {
  patrolTaskStatusFilter = e.target.value;
  renderPatrolTasks();
});
document.querySelector('#patrolPointFilter').addEventListener('change', (e) => {
  patrolTaskPointFilter = e.target.value;
  renderPatrolTasks();
});

patrolTaskForm.addEventListener('submit', handlePatrolFormSubmit);

function openPatrolTasks() {
  document.querySelector('#patrolTasksOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  editingPatrolTaskId = null;
  hidePatrolForm();
  updatePatrolMonitoringPointSelects();
  renderPatrolTasks();
}

function closePatrolTasks() {
  document.querySelector('#patrolTasksOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  editingPatrolTaskId = null;
  hidePatrolForm();
}

function showPatrolForm(task) {
  const section = document.querySelector('#patrolFormSection');
  const title = document.querySelector('#patrolFormTitle');
  section.classList.remove('hidden');

  if (task) {
    title.textContent = '编辑巡查任务';
    document.querySelector('#patrolLocation').value = task.location || '';
    document.querySelector('#patrolMonitoringPoint').value = task.monitoringPointId || '';
    document.querySelector('#patrolScheduledAt').value = task.scheduledAt || '';
    document.querySelector('#patrolAssignee').value = task.assignee || '';
    document.querySelector('#patrolStatus').value = task.status || 'pending';
    document.querySelector('#patrolCompletedAt').value = task.completedAt || '';
    document.querySelector('#patrolNotes').value = task.notes || '';
  } else {
    title.textContent = '新建巡查任务';
    patrolTaskForm.reset();
    document.querySelector('#patrolStatus').value = 'pending';
  }

  section.scrollIntoView({ behavior: 'smooth' });
}

function hidePatrolForm() {
  document.querySelector('#patrolFormSection').classList.add('hidden');
  patrolTaskForm.reset();
}

function updatePatrolMonitoringPointSelects() {
  const options = monitoringPoints
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(p => `<option value="${p.id}">${p.name} (${p.district})</option>`)
    .join('');

  document.querySelector('#patrolMonitoringPoint').innerHTML = `<option value="">选择监测点（可选）</option>${options}`;
  document.querySelector('#patrolPointFilter').innerHTML = `<option value="">全部监测点</option>${options}`;
}

function createPatrolFromRecord(record) {
  openPatrolTasks();
  editingPatrolTaskId = null;
  showPatrolForm(null);

  document.querySelector('#patrolLocation').value = record.location;
  if (record.monitoringPointId) {
    document.querySelector('#patrolMonitoringPoint').value = record.monitoringPointId;
  }

  const now = new Date();
  now.setHours(now.getHours() + 2);
  const defaultTime = toLocalDateTimeInputValue(now);
  document.querySelector('#patrolScheduledAt').value = defaultTime;

  const avgDb = Math.round(record.db);
  const noteParts = [];
  noteParts.push(`来源：${record.source}`);
  noteParts.push(`分贝：${record.db}dB`);
  noteParts.push(`感受：${record.feeling}`);
  noteParts.push(`时间：${record.at.replace('T', ' ')}`);
  document.querySelector('#patrolNotes').value = `高噪声记录转办\n` + noteParts.join(' | ');

  document.querySelector('#patrolFormSection').scrollIntoView({ behavior: 'smooth' });
}

let _pendingAlarmToPatrol = null;

function createPatrolFromAlarm(alarm) {
  if (alarm.patrolTaskId) {
    const existingTask = patrolTasks.find(t => t.id === alarm.patrolTaskId);
    if (existingTask) {
      openConfirmDialog('提示', `该告警已关联巡查任务，是否前往查看？`, () => {
        closeAlarmCenter();
        openPatrolTasks();
      });
      return;
    }
  }

  _pendingAlarmToPatrol = alarm.id;
  closeAlarmCenter();
  openPatrolTasks();
  editingPatrolTaskId = null;
  showPatrolForm(null);

  document.querySelector('#patrolLocation').value = alarm.location;

  const matchedPoint = monitoringPoints.find(p => p.name === alarm.location);
  if (matchedPoint) {
    document.querySelector('#patrolMonitoringPoint').value = matchedPoint.id;
  }

  const now = new Date();
  now.setHours(now.getHours() + 2);
  const defaultTime = toLocalDateTimeInputValue(now);
  document.querySelector('#patrolScheduledAt').value = defaultTime;

  const thresholdDesc = alarm.type === 'multiple'
    ? `超标次数阈值：${alarm.threshold}次，噪声阈值：${alarm.noiseThreshold}dB`
    : `阈值：${alarm.threshold}dB${alarm.type === 'nighttime' ? `（夜间时段${alarm.nightHours}）` : ''}`;

  const notesLines = [];
  notesLines.push(`【告警类型】${alarm.typeLabel}`);
  notesLines.push(`【阈值配置】${thresholdDesc}`);
  notesLines.push(`【噪声记录】${getAlarmRelatedRecordsInfo(alarm)}`);
  notesLines.push(`【触发原因】${alarm.message}`);

  document.querySelector('#patrolNotes').value = notesLines.join('\n');

  document.querySelector('#patrolFormSection').scrollIntoView({ behavior: 'smooth' });
}

function handlePatrolFormSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(patrolTaskForm).entries());

  let monitoringPointId = data.monitoringPointId || null;
  let location = data.location;

  if (monitoringPointId && !location) {
    const point = monitoringPoints.find(p => p.id === monitoringPointId);
    if (point) location = point.name;
  }

  if (!location) {
    alert('请填写地点或选择关联监测点');
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const completedAt = data.status === 'completed' && !data.completedAt
    ? toLocalDateTimeInputValue(now)
    : (data.completedAt || null);

  const existingTask = editingPatrolTaskId ? patrolTasks.find(t => t.id === editingPatrolTaskId) : null;
  const sourceAlarmId = existingTask?.sourceAlarmId || _pendingAlarmToPatrol;

  const task = {
    id: editingPatrolTaskId || crypto.randomUUID(),
    location,
    monitoringPointId,
    scheduledAt: data.scheduledAt,
    assignee: data.assignee,
    status: data.status || 'pending',
    completedAt,
    notes: data.notes || '',
    sourceAlarmId: sourceAlarmId || null,
    createdAt: editingPatrolTaskId ? (existingTask?.createdAt || nowIso) : nowIso,
    updatedAt: nowIso
  };

  if (editingPatrolTaskId) {
    patrolTasks = patrolTasks.map(t => t.id === editingPatrolTaskId ? task : t);
  } else {
    patrolTasks = [task, ...patrolTasks];
  }

  savePatrolTasks();

  if (_pendingAlarmToPatrol) {
    setAlarmPatrolTaskId(_pendingAlarmToPatrol, task.id);
    updateAlarmStatus(_pendingAlarmToPatrol, 'confirmed');
    _pendingAlarmToPatrol = null;
  }

  editingPatrolTaskId = null;
  hidePatrolForm();
  renderPatrolTasks();
}

function updatePatrolTaskStatus(taskId, newStatus) {
  const now = new Date();
  const nowIso = now.toISOString();
  const task = patrolTasks.find(t => t.id === taskId);
  const oldStatus = task?.status;

  patrolTasks = patrolTasks.map(t => {
    if (t.id === taskId) {
      const completedAt = newStatus === 'completed' && !t.completedAt
        ? toLocalDateTimeInputValue(now)
        : (newStatus !== 'completed' ? null : t.completedAt);
      return { ...t, status: newStatus, completedAt, updatedAt: nowIso };
    }
    return t;
  });
  savePatrolTasks();

  if (task?.sourceAlarmId) {
    if (newStatus === 'cancelled') {
      setAlarmPatrolTaskId(task.sourceAlarmId, null);
      updateAlarmStatus(task.sourceAlarmId, 'pending');
    } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
      setAlarmPatrolTaskId(task.sourceAlarmId, taskId);
    }
    if (!document.querySelector('#alarmCenterOverlay').classList.contains('hidden')) {
      renderAlarmCenter();
    }
  }

  renderPatrolTasks();
}

function deletePatrolTask(taskId) {
  const task = patrolTasks.find(t => t.id === taskId);
  if (!task) return;

  openConfirmDialog('删除任务', `确定要删除地点"${task.location}"的巡查任务吗？${task.sourceAlarmId ? '\n\n该任务关联的告警将被重置为待处理状态。' : ''}`, () => {
    patrolTasks = patrolTasks.filter(t => t.id !== taskId);
    savePatrolTasks();

    if (task.sourceAlarmId) {
      clearAlarmPatrolTaskId(taskId);
      updateAlarmStatus(task.sourceAlarmId, 'pending');
      if (!document.querySelector('#alarmCenterOverlay').classList.contains('hidden')) {
        renderAlarmCenter();
      }
    }

    renderPatrolTasks();
  });
}

function editPatrolTask(taskId) {
  const task = patrolTasks.find(t => t.id === taskId);
  if (!task) return;
  editingPatrolTaskId = taskId;
  showPatrolForm(task);
}

function renderPatrolTasks() {
  const pending = patrolTasks.filter(t => t.status === 'pending').length;
  const inProgress = patrolTasks.filter(t => t.status === 'in_progress').length;
  const completed = patrolTasks.filter(t => t.status === 'completed').length;

  document.querySelector('#patrolPendingCount').textContent = pending;
  document.querySelector('#patrolInProgressCount').textContent = inProgress;
  document.querySelector('#patrolCompletedCount').textContent = completed;
  document.querySelector('#patrolTotalCount').textContent = patrolTasks.length;

  let filtered = [...patrolTasks];

  if (patrolTaskStatusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === patrolTaskStatusFilter);
  }
  if (patrolTaskPointFilter) {
    filtered = filtered.filter(t => t.monitoringPointId === patrolTaskPointFilter);
  }

  filtered.sort((a, b) => {
    const statusOrder = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 };
    const sDiff = statusOrder[a.status] - statusOrder[b.status];
    if (sDiff !== 0) return sDiff;
    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  });

  const listEl = document.querySelector('#patrolTasksList');

  if (!filtered.length) {
    listEl.innerHTML = '<p class="empty">暂无匹配的巡查任务</p>';
    return;
  }

  listEl.innerHTML = filtered.map(task => {
    const point = task.monitoringPointId ? getMonitoringPointById(task.monitoringPointId) : null;
    const typeInfo = point ? getPointTypeInfo(point.type) : null;
    const isOverdue = task.status !== 'completed' && task.status !== 'cancelled'
      && new Date(task.scheduledAt) < new Date();

    let sourceAlarmInfo = '';
    if (task.sourceAlarmId) {
      const alarm = alarms.find(a => a.id === task.sourceAlarmId);
      if (alarm) {
        const alarmStatusLabel = { pending: '待处理', confirmed: '已确认', ignored: '已忽略' }[alarm.status] || '未知';
        sourceAlarmInfo = `
          <div class="patrol-source-alarm-info">
            <span class="patrol-source-alarm-label">🔗 来源告警：</span>
            <span class="alarm-type-badge">${alarm.typeLabel}</span>
            <span class="patrol-source-alarm-desc">${alarm.location} · ${alarm.db || alarm.maxDb}dB · ${alarmStatusLabel}</span>
            <button class="secondary patrol-source-alarm-view-btn" data-view-alarm="${task.sourceAlarmId}">查看告警</button>
          </div>
        `;
      } else {
        sourceAlarmInfo = `
          <div class="patrol-source-alarm-info patrol-source-alarm-missing">
            <span class="patrol-source-alarm-label">⚠️ 来源告警已不存在</span>
          </div>
        `;
      }
    }

    return `
      <div class="patrol-task-item patrol-status-${task.status} ${isOverdue ? 'patrol-overdue' : ''}">
        <div class="patrol-task-head">
          <div class="patrol-task-location">
            <strong>${task.location}</strong>
            ${point ? `<span class="point-type-badge ${typeInfo.colorClass}" style="margin-left:8px;">${typeInfo.label}</span>` : ''}
            ${isOverdue ? '<span class="patrol-overdue-tag">已逾期</span>' : ''}
          </div>
          <span class="patrol-status-badge patrol-status-${task.status}">${patrolStatusLabels[task.status]}</span>
        </div>
        <div class="patrol-task-info">
          <div class="patrol-info-row">
            <span>📅 计划：${task.scheduledAt ? task.scheduledAt.replace('T', ' ') : '未设置'}</span>
            ${task.completedAt ? `<span>✅ 完成：${task.completedAt.replace('T', ' ')}</span>` : ''}
          </div>
          <div class="patrol-info-row">
            <span>👤 负责人：${task.assignee}</span>
            ${point ? `<span>📍 ${point.district}</span>` : ''}
          </div>
        </div>
        ${sourceAlarmInfo}
        ${task.notes ? `<div class="patrol-task-notes">📝 ${escapeHtml(task.notes)}</div>` : ''}
        <div class="patrol-task-footer">
          <span class="patrol-task-time">创建于 ${new Date(task.createdAt).toLocaleString('zh-CN')}</span>
          <div class="patrol-task-actions">
            ${task.status === 'pending' ? `
              <button class="secondary" data-patrol-start="${task.id}">开始巡查</button>
            ` : ''}
            ${task.status === 'in_progress' ? `
              <button class="primary" data-patrol-complete="${task.id}">完成</button>
            ` : ''}
            ${task.status === 'completed' ? `
              <button class="secondary" data-patrol-reopen="${task.id}">重新打开</button>
            ` : ''}
            ${task.status === 'cancelled' ? `
              <button class="secondary" data-patrol-reopen="${task.id}">重新打开</button>
            ` : ''}
            <button class="secondary" data-patrol-edit="${task.id}">编辑</button>
            ${task.status !== 'completed' && task.status !== 'cancelled' ? `
              <button class="secondary" data-patrol-cancel="${task.id}">取消</button>
            ` : ''}
            <button class="secondary" data-patrol-del="${task.id}">删除</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-patrol-start]').forEach(btn => {
    btn.addEventListener('click', () => updatePatrolTaskStatus(btn.dataset.patrolStart, 'in_progress'));
  });
  listEl.querySelectorAll('[data-patrol-complete]').forEach(btn => {
    btn.addEventListener('click', () => updatePatrolTaskStatus(btn.dataset.patrolComplete, 'completed'));
  });
  listEl.querySelectorAll('[data-patrol-reopen]').forEach(btn => {
    btn.addEventListener('click', () => updatePatrolTaskStatus(btn.dataset.patrolReopen, 'pending'));
  });
  listEl.querySelectorAll('[data-patrol-cancel]').forEach(btn => {
    btn.addEventListener('click', () => updatePatrolTaskStatus(btn.dataset.patrolCancel, 'cancelled'));
  });
  listEl.querySelectorAll('[data-patrol-edit]').forEach(btn => {
    btn.addEventListener('click', () => editPatrolTask(btn.dataset.patrolEdit));
  });
  listEl.querySelectorAll('[data-patrol-del]').forEach(btn => {
    btn.addEventListener('click', () => deletePatrolTask(btn.dataset.patrolDel));
  });
  listEl.querySelectorAll('[data-view-alarm]').forEach(btn => {
    btn.addEventListener('click', () => {
      closePatrolTasks();
      openAlarmCenter();
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const _originalKeyHandler = document.onkeydown;
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!document.querySelector('#complaintOverlay').classList.contains('hidden')) {
      closeComplaints();
    } else if (!document.querySelector('#patrolTasksOverlay').classList.contains('hidden')) {
      closePatrolTasks();
    } else if (!document.querySelector('#importBatchesOverlay').classList.contains('hidden')) {
      closeImportBatches();
    }
  }
});

function findMatchingMonitoringPoint(location) {
  return monitoringPoints.find(p => p.name === location) || null;
}

function updateComplaintPointInfo() {
  const location = document.querySelector('#complaintLocation').value.trim();
  const pointInfoEl = document.querySelector('#complaintPointInfo');
  const pointBadgeEl = document.querySelector('#complaintPointBadge');

  if (!location) {
    pointInfoEl.classList.add('hidden');
    return;
  }

  const point = findMatchingMonitoringPoint(location);
  if (point) {
    const typeInfo = getPointTypeInfo(point.type);
    pointInfoEl.classList.remove('hidden');
    pointBadgeEl.innerHTML = `
      <div class="complaint-point-detail">
        <span class="point-type-badge ${typeInfo.colorClass}">${typeInfo.label}</span>
        <span class="complaint-point-name">${point.name}</span>
        <span class="complaint-point-district">${point.district}</span>
        <span class="complaint-point-coords">${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}</span>
        ${point.notes ? `<span class="complaint-point-notes">${escapeHtml(point.notes)}</span>` : ''}
      </div>
    `;
  } else {
    pointInfoEl.classList.add('hidden');
  }
}

function openComplaints() {
  document.querySelector('#complaintOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  editingComplaintId = null;
  hideComplaintForm();
  renderComplaints();
}

function closeComplaints() {
  document.querySelector('#complaintOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  editingComplaintId = null;
  hideComplaintForm();
}

function showComplaintForm(complaint) {
  const section = document.querySelector('#complaintFormSection');
  const title = document.querySelector('#complaintFormTitle');
  section.classList.remove('hidden');

  if (complaint) {
    title.textContent = '编辑噪声投诉';
    document.querySelector('#complaintLocation').value = complaint.location || '';
    document.querySelector('#complaintAt').value = complaint.at || '';
    document.querySelector('#complaintSource').value = complaint.source || '';
    document.querySelector('#complaintContact').value = complaint.contact || '';
    document.querySelector('#complaintStatus').value = complaint.status || 'pending';
    document.querySelector('#complaintDescription').value = complaint.description || '';
  } else {
    title.textContent = '新建噪声投诉';
    document.querySelector('#complaintForm').reset();
    document.querySelector('#complaintStatus').value = 'pending';
    document.querySelector('#complaintAt').value = toLocalDateTimeInputValue();
  }

  updateComplaintPointInfo();
  section.scrollIntoView({ behavior: 'smooth' });
}

function hideComplaintForm() {
  document.querySelector('#complaintFormSection').classList.add('hidden');
  document.querySelector('#complaintForm').reset();
  document.querySelector('#complaintPointInfo').classList.add('hidden');
}

function handleComplaintFormSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(document.querySelector('#complaintForm')).entries());

  if (!data.location.trim()) {
    alert('请填写投诉地点');
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const matchedPoint = findMatchingMonitoringPoint(data.location.trim());

  const complaint = {
    id: editingComplaintId || crypto.randomUUID(),
    location: data.location.trim(),
    at: data.at,
    source: data.source.trim(),
    description: data.description.trim(),
    contact: data.contact.trim(),
    status: data.status || 'pending',
    monitoringPointId: matchedPoint ? matchedPoint.id : null,
    createdAt: editingComplaintId ? (complaints.find(c => c.id === editingComplaintId)?.createdAt || nowIso) : nowIso,
    updatedAt: nowIso
  };

  if (editingComplaintId) {
    complaints = complaints.map(c => c.id === editingComplaintId ? complaint : c);
  } else {
    complaints = [complaint, ...complaints];
  }

  saveComplaints();
  editingComplaintId = null;
  hideComplaintForm();
  renderComplaints();
}

function updateComplaintStatus(complaintId, newStatus) {
  const now = new Date();
  complaints = complaints.map(c => {
    if (c.id === complaintId) {
      return { ...c, status: newStatus, updatedAt: now.toISOString() };
    }
    return c;
  });
  saveComplaints();
  renderComplaints();
}

function deleteComplaint(complaintId) {
  const complaint = complaints.find(c => c.id === complaintId);
  if (!complaint) return;

  openConfirmDialog('删除投诉', `确定要删除地点"${complaint.location}"的噪声投诉吗？`, () => {
    complaints = complaints.filter(c => c.id !== complaintId);
    saveComplaints();
    renderComplaints();
  });
}

function editComplaint(complaintId) {
  const complaint = complaints.find(c => c.id === complaintId);
  if (!complaint) return;
  editingComplaintId = complaintId;
  showComplaintForm(complaint);
}

function renderComplaints() {
  const pending = complaints.filter(c => c.status === 'pending').length;
  const processing = complaints.filter(c => c.status === 'processing').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;
  const closed = complaints.filter(c => c.status === 'closed').length;

  document.querySelector('#complaintPendingCount').textContent = pending;
  document.querySelector('#complaintProcessingCount').textContent = processing;
  document.querySelector('#complaintResolvedCount').textContent = resolved;
  document.querySelector('#complaintClosedCount').textContent = closed;
  document.querySelector('#complaintTotalCount').textContent = complaints.length;

  let filtered = [...complaints];

  if (complaintStatusFilter !== 'all') {
    filtered = filtered.filter(c => c.status === complaintStatusFilter);
  }
  if (complaintLocationFilter) {
    const keyword = complaintLocationFilter.toLowerCase();
    filtered = filtered.filter(c => c.location.toLowerCase().includes(keyword));
  }

  filtered.sort((a, b) => {
    const statusOrder = { pending: 0, processing: 1, resolved: 2, closed: 3 };
    const sDiff = statusOrder[a.status] - statusOrder[b.status];
    if (sDiff !== 0) return sDiff;
    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  });

  const listEl = document.querySelector('#complaintsList');

  if (!filtered.length) {
    listEl.innerHTML = '<p class="empty">暂无匹配的投诉记录</p>';
    return;
  }

  listEl.innerHTML = filtered.map(complaint => {
    const point = complaint.monitoringPointId ? getMonitoringPointById(complaint.monitoringPointId) : null;
    const autoMatchedPoint = !point ? findMatchingMonitoringPoint(complaint.location) : null;
    const displayPoint = point || autoMatchedPoint;
    const typeInfo = displayPoint ? getPointTypeInfo(displayPoint.type) : null;

    return `
      <div class="complaint-item complaint-status-${complaint.status}">
        <div class="complaint-item-head">
          <div class="complaint-item-location">
            <strong>${escapeHtml(complaint.location)}</strong>
            ${typeInfo ? `<span class="point-type-badge ${typeInfo.colorClass}" style="margin-left:8px;">${typeInfo.label}</span>` : ''}
          </div>
          <span class="complaint-status-badge complaint-status-${complaint.status}">${complaintStatusLabels[complaint.status]}</span>
        </div>
        <div class="complaint-item-info">
          <div class="complaint-info-row">
            <span>📅 ${complaint.at ? complaint.at.replace('T', ' ') : '未设置'}</span>
            <span>🔊 ${escapeHtml(complaint.source)}</span>
            <span>📞 ${escapeHtml(complaint.contact)}</span>
          </div>
        </div>
        <div class="complaint-item-desc">${escapeHtml(complaint.description)}</div>
        ${displayPoint ? `
          <div class="complaint-item-point">
            <span class="complaint-point-label">📍 关联监测点：</span>
            <span class="point-type-badge ${typeInfo.colorClass}">${typeInfo.label}</span>
            <span>${escapeHtml(displayPoint.name)}</span>
            <span style="color:#79695e;">${displayPoint.district}</span>
            <span style="color:#a89c90;font-size:11px;">${displayPoint.latitude.toFixed(4)}, ${displayPoint.longitude.toFixed(4)}</span>
            ${displayPoint.notes ? `<span style="color:#a89c90;font-size:11px;">${escapeHtml(displayPoint.notes)}</span>` : ''}
          </div>
        ` : ''}
        <div class="complaint-item-footer">
          <span class="complaint-item-time">投诉于 ${new Date(complaint.createdAt).toLocaleString('zh-CN')}</span>
          <div class="complaint-item-actions">
            ${complaint.status === 'pending' ? `
              <button class="secondary" data-complaint-process="${complaint.id}">处理</button>
            ` : ''}
            ${complaint.status === 'processing' ? `
              <button class="primary" data-complaint-resolve="${complaint.id}">已解决</button>
            ` : ''}
            ${complaint.status === 'resolved' ? `
              <button class="secondary" data-complaint-close="${complaint.id}">关闭</button>
            ` : ''}
            ${complaint.status === 'closed' ? `
              <button class="secondary" data-complaint-reopen="${complaint.id}">重新打开</button>
            ` : ''}
            <button class="secondary" data-complaint-edit="${complaint.id}">编辑</button>
            <button class="secondary" data-complaint-del="${complaint.id}">删除</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-complaint-process]').forEach(btn => {
    btn.addEventListener('click', () => updateComplaintStatus(btn.dataset.complaintProcess, 'processing'));
  });
  listEl.querySelectorAll('[data-complaint-resolve]').forEach(btn => {
    btn.addEventListener('click', () => updateComplaintStatus(btn.dataset.complaintResolve, 'resolved'));
  });
  listEl.querySelectorAll('[data-complaint-close]').forEach(btn => {
    btn.addEventListener('click', () => updateComplaintStatus(btn.dataset.complaintClose, 'closed'));
  });
  listEl.querySelectorAll('[data-complaint-reopen]').forEach(btn => {
    btn.addEventListener('click', () => updateComplaintStatus(btn.dataset.complaintReopen, 'pending'));
  });
  listEl.querySelectorAll('[data-complaint-edit]').forEach(btn => {
    btn.addEventListener('click', () => editComplaint(btn.dataset.complaintEdit));
  });
  listEl.querySelectorAll('[data-complaint-del]').forEach(btn => {
    btn.addEventListener('click', () => deleteComplaint(btn.dataset.complaintDel));
  });
}

document.querySelector('#complaintBtn').addEventListener('click', openComplaints);
document.querySelector('#complaintClose').addEventListener('click', closeComplaints);
document.querySelector('#complaintOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'complaintOverlay') closeComplaints();
});

document.querySelector('#healthDashboardBtn').addEventListener('click', openHealthDashboard);
document.querySelector('#healthDashboardClose').addEventListener('click', closeHealthDashboard);
document.querySelector('#healthDashboardOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'healthDashboardOverlay') closeHealthDashboard();
});

function openHealthDashboard() {
  document.querySelector('#healthDashboardOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  renderHealthDashboard();
}

function closeHealthDashboard() {
  document.querySelector('#healthDashboardOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function computePointHealth(point) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 16);

  const pointRecords = records.filter(r => r.monitoringPointId === point.id);
  const recentRecords = pointRecords.filter(r => r.at >= sevenDaysAgoStr);
  const lastRecord = pointRecords.sort((a, b) => b.at.localeCompare(a.at))[0] || null;
  const maxDb7d = recentRecords.length ? Math.max(...recentRecords.map(r => r.db)) : null;

  let dataStatus = 'normal';
  let daysSinceLast = null;

  if (!lastRecord) {
    dataStatus = 'nodata';
  } else {
    const lastDate = new Date(lastRecord.at);
    daysSinceLast = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    if (daysSinceLast > 3) {
      dataStatus = 'warning';
    }
  }

  return {
    point,
    lastRecordTime: lastRecord ? lastRecord.at : null,
    daysSinceLast,
    recentCount7d: recentRecords.length,
    maxDb7d,
    dataStatus
  };
}

function renderHealthDashboard() {
  const healthData = monitoringPoints.map(p => computePointHealth(p));

  const normalCount = healthData.filter(h => h.dataStatus === 'normal').length;
  const warningCount = healthData.filter(h => h.dataStatus === 'warning').length;
  const noDataCount = healthData.filter(h => h.dataStatus === 'nodata').length;

  document.querySelector('#healthNormalCount').textContent = normalCount;
  document.querySelector('#healthWarningCount').textContent = warningCount;
  document.querySelector('#healthNoDataCount').textContent = noDataCount;
  document.querySelector('#healthTotalCount').textContent = healthData.length;

  const listEl = document.querySelector('#healthDashboardList');

  if (!healthData.length) {
    listEl.innerHTML = '<p class="empty">暂无监测点数据</p>';
    return;
  }

  const statusOrder = { warning: 0, nodata: 1, normal: 2 };
  healthData.sort((a, b) => {
    const sDiff = statusOrder[a.dataStatus] - statusOrder[b.dataStatus];
    if (sDiff !== 0) return sDiff;
    return a.point.name.localeCompare(b.point.name);
  });

  listEl.innerHTML = healthData.map(h => {
    const typeInfo = getPointTypeInfo(h.point.type);
    const statusClass = `health-status-${h.dataStatus}`;
    const statusLabel = { normal: '正常', warning: '待补采', nodata: '无记录' }[h.dataStatus];
    const statusIcon = { normal: '✅', warning: '⚠️', nodata: '❌' }[h.dataStatus];

    let lastTimeDisplay = '--';
    if (h.lastRecordTime) {
      lastTimeDisplay = h.lastRecordTime.replace('T', ' ');
    }

    let daysDisplay = '--';
    if (h.daysSinceLast !== null) {
      daysDisplay = h.daysSinceLast === 0 ? '今天' : `${h.daysSinceLast}天前`;
    }

    return `
      <div class="health-point-card ${statusClass}" data-health-point-id="${h.point.id}">
        <div class="health-point-head">
          <div class="health-point-title">
            <strong>${h.point.name}</strong>
            <span class="point-type-badge ${typeInfo.colorClass}">${typeInfo.label}</span>
          </div>
          <span class="health-status-badge ${statusClass}">${statusIcon} ${statusLabel}</span>
        </div>
        <div class="health-point-stats">
          <div class="health-point-stat">
            <span class="health-stat-name">最近记录</span>
            <span class="health-stat-val">${lastTimeDisplay}</span>
          </div>
          <div class="health-point-stat">
            <span class="health-stat-name">距今天数</span>
            <span class="health-stat-val">${daysDisplay}</span>
          </div>
          <div class="health-point-stat">
            <span class="health-stat-name">7天记录数</span>
            <span class="health-stat-val">${h.recentCount7d}</span>
          </div>
          <div class="health-point-stat">
            <span class="health-stat-name">7天最高分贝</span>
            <span class="health-stat-val">${h.maxDb7d !== null ? h.maxDb7d + 'dB' : '--'}</span>
          </div>
        </div>
        <div class="health-point-heatmap">
          <div class="health-heatmap-header">
            <span class="health-heatmap-title">🔥 时段热力</span>
            <span class="health-heatmap-hint">点击格子查看记录</span>
          </div>
          <div class="health-heatmap-container" id="healthHeatmap-${h.point.id}"></div>
        </div>
        <div class="health-point-footer">
          <span class="health-point-district">📍 ${h.point.district}</span>
          <div class="health-point-actions">
            ${h.dataStatus !== 'normal' ? `<button class="primary health-patrol-btn" data-health-patrol="${h.point.id}" data-status="${h.dataStatus}">补采</button>` : ''}
            <button class="secondary" data-health-detail="${h.point.id}">查看详情</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  healthData.forEach(h => {
    const container = document.querySelector(`#healthHeatmap-${h.point.id}`);
    if (container) {
      const heatmapData = computeHeatmapData(h.point.id, null);
      drawCompactHeatmap(container, heatmapData, h.point.id, null);
    }
  });

  listEl.querySelectorAll('[data-health-detail]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pointId = btn.dataset.healthDetail;
      const point = getMonitoringPointById(pointId);
      if (point) {
        closeHealthDashboard();
        openLocationDetail(point.name, pointId);
      }
    });
  });

  listEl.querySelectorAll('[data-health-patrol]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pointId = btn.dataset.healthPatrol;
      const status = btn.dataset.status;
      const point = getMonitoringPointById(pointId);
      if (point) {
        createPatrolFromHealthPoint(point, status);
      }
    });
  });
}

function createPatrolFromHealthPoint(point, status) {
  closeHealthDashboard();
  openPatrolTasks();
  editingPatrolTaskId = null;
  showPatrolForm(null);

  document.querySelector('#patrolLocation').value = point.name;
  document.querySelector('#patrolMonitoringPoint').value = point.id;

  const now = new Date();
  now.setHours(now.getHours() + 2);
  const defaultTime = toLocalDateTimeInputValue(now);
  document.querySelector('#patrolScheduledAt').value = defaultTime;

  const noteParts = [];
  noteParts.push(`监测点：${point.name}`);
  noteParts.push(`街区：${point.district}`);
  noteParts.push(`类型：${getPointTypeInfo(point.type).label}`);
  if (point.notes) {
    noteParts.push(`说明：${point.notes}`);
  }

  const statusText = status === 'warning' ? '待补采' : '无记录';
  document.querySelector('#patrolNotes').value = `${statusText}补采任务\n` + noteParts.join(' | ');

  document.querySelector('#patrolFormSection').scrollIntoView({ behavior: 'smooth' });
}
document.querySelector('#newComplaintBtn').addEventListener('click', () => {
  editingComplaintId = null;
  showComplaintForm(null);
});
document.querySelector('#cancelComplaintEdit').addEventListener('click', () => {
  editingComplaintId = null;
  hideComplaintForm();
});
document.querySelector('#complaintForm').addEventListener('submit', handleComplaintFormSubmit);
document.querySelector('#complaintStatusFilterSelect').addEventListener('change', (e) => {
  complaintStatusFilter = e.target.value;
  renderComplaints();
});
document.querySelector('#complaintLocationSearch').addEventListener('input', (e) => {
  complaintLocationFilter = e.target.value.trim();
  renderComplaints();
});
document.querySelector('#complaintLocation').addEventListener('input', updateComplaintPointInfo);

if (defaultViewId && !filterViews.find(v => v.id === defaultViewId)) {
  defaultViewId = null;
  localStorage.removeItem(defaultViewKey);
}

if (defaultViewId) {
  loadView(defaultViewId);
}

recalculateAlarms();
render();
