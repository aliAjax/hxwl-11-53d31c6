export const fieldMappingConfig = {
  location: ['地点', 'location', 'place', '地址', '位置', '街区'],
  at: ['时间', 'at', 'datetime', 'date', 'timestamp', '观测时间', '记录时间'],
  db: ['分贝', 'db', 'noise', '声级', '音量', '噪声值'],
  source: ['来源', 'source', 'origin', '噪声源', '噪声来源'],
  feeling: ['主观感受', 'feeling', '感受', '评价', '主观评价']
};

export const validFeelings = ['安静', '可接受', '偏吵', '嘈杂', '刺耳'];

export function parseCSV(content) {
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

export function buildRecordMapping(record) {
  const recordKeys = Object.keys(record);
  const mapping = {};
  for (const [field, aliases] of Object.entries(fieldMappingConfig)) {
    for (const alias of aliases) {
      const match = recordKeys.find(k => matchesFieldAlias(k, alias));
      if (match) {
        mapping[field] = match;
        break;
      }
    }
  }
  return mapping;
}

export function mapFields(rawRecord) {
  const mapping = {};
  const detectedFields = {};
  Object.keys(rawRecord).forEach(key => {
    for (const [field, aliases] of Object.entries(fieldMappingConfig)) {
      if (aliases.some(alias => matchesFieldAlias(key, alias))) {
        mapping[field] = key;
        detectedFields[field] = key;
        break;
      }
    }
  });
  return { mapping, detectedFields };
}

function matchesFieldAlias(key, alias) {
  const lowerKey = key.toLowerCase().trim();
  const lowerAlias = alias.toLowerCase();
  if (lowerKey === lowerAlias) return true;

  const canUsePartialMatch = alias.length > 2 || /[^\x00-\x7F]/.test(alias);
  return canUsePartialMatch && lowerKey.includes(lowerAlias);
}

export function validateRecord(record, mapping, lineNum) {
  const errors = [];
  const result = { id: 'test-id', monitoringPointId: null };

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

export function generateRecordKey(record) {
  return `${record.at}|${record.location}|${record.db}|${record.source}`;
}

export function detectDuplicates(validRecords, existingRecords) {
  const existingKeys = new Set(existingRecords.map(r => generateRecordKey(r)));
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

export function processImportData(rawData, existingRecords) {
  if (!rawData.length) {
    return { validRecords: [], errorRecords: [], detectedFields: {}, duplicateIndices: [] };
  }

  const allFields = new Set();
  rawData.forEach(record => Object.keys(record).forEach(key => allFields.add(key)));
  const { detectedFields: baseDetected } = mapFields(Object.fromEntries([...allFields].map(k => [k, ''])));
  const validRecords = [];
  const errorRecords = [];
  const allDetectedFields = { ...baseDetected };

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

  const duplicateIndices = detectDuplicates(validRecords, existingRecords);

  return { validRecords, errorRecords, detectedFields: allDetectedFields, duplicateIndices };
}
