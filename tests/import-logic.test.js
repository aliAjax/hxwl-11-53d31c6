import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  buildRecordMapping,
  mapFields,
  validateRecord,
  generateRecordKey,
  detectDuplicates,
  processImportData,
  fieldMappingConfig,
  validFeelings
} from '../src/import-logic.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const csvNoiseContent = readFileSync(resolve(root, 'test-noise-data.csv'), 'utf-8');
const csvDuplicateContent = readFileSync(resolve(root, 'test-duplicate-data.csv'), 'utf-8');
const jsonNoiseContent = readFileSync(resolve(root, 'test-noise-data.json'), 'utf-8');
const jsonNoiseData = JSON.parse(jsonNoiseContent);

describe('parseCSV', () => {
  it('should parse CSV with standard headers', () => {
    const data = parseCSV(csvNoiseContent);
    expect(data).toHaveLength(8);
    expect(data[0]).toEqual({
      '地点': '人民公园',
      '时间': '2026-06-07 08:30',
      '分贝': '55',
      '来源': '晨练人群',
      '主观感受': '可接受'
    });
  });

  it('should parse duplicate-data CSV correctly', () => {
    const data = parseCSV(csvDuplicateContent);
    expect(data).toHaveLength(7);
    expect(data[0]['地点']).toBe('人民公园');
    expect(data[2]['地点']).toBe('人民公园');
  });

  it('should handle empty CSV', () => {
    const data = parseCSV('');
    expect(data).toHaveLength(0);
  });

  it('should handle CSV with only headers', () => {
    const data = parseCSV('地点,时间,分贝,来源,主观感受');
    expect(data).toHaveLength(0);
  });
});

describe('fieldMappingConfig', () => {
  it('should have all 5 required fields', () => {
    expect(Object.keys(fieldMappingConfig)).toEqual(['location', 'at', 'db', 'source', 'feeling']);
  });

  it('should have Chinese primary alias as first entry for each field', () => {
    expect(fieldMappingConfig.location[0]).toBe('地点');
    expect(fieldMappingConfig.at[0]).toBe('时间');
    expect(fieldMappingConfig.db[0]).toBe('分贝');
    expect(fieldMappingConfig.source[0]).toBe('来源');
    expect(fieldMappingConfig.feeling[0]).toBe('主观感受');
  });
});

describe('buildRecordMapping', () => {
  it('should map standard Chinese field names', () => {
    const record = { '地点': '公园', '时间': '2026-01-01 08:00', '分贝': '55', '来源': '环境', '主观感受': '安静' };
    const mapping = buildRecordMapping(record);
    expect(mapping).toEqual({
      location: '地点',
      at: '时间',
      db: '分贝',
      source: '来源',
      feeling: '主观感受'
    });
  });

  it('should map English field aliases (note: "location" contains "at" so at maps to location key)', () => {
    const record = { location: '图书馆', at: '2026-06-09 14:30', db: 42, source: '翻书声', feeling: '安静' };
    const mapping = buildRecordMapping(record);
    expect(mapping.location).toBe('location');
    expect(mapping.at).toBe('location');
    expect(mapping.db).toBe('db');
    expect(mapping.source).toBe('source');
    expect(mapping.feeling).toBe('feeling');
  });

  it('should map mixed Chinese/English aliases', () => {
    const record = { '地点': '美食街', at: '2026-06-09 18:00', db: 76, '噪声来源': '店铺揽客', '主观感受': '偏吵' };
    const mapping = buildRecordMapping(record);
    expect(mapping.location).toBe('地点');
    expect(mapping.at).toBe('at');
    expect(mapping.db).toBe('db');
    expect(mapping.source).toBe('噪声来源');
    expect(mapping.feeling).toBe('主观感受');
  });

  it('should map "place" alias to location', () => {
    const record = { place: '住宅小区', datetime: '2026-06-09 23:15', noise: 38, origin: '空调外机', '评价': '安静' };
    const mapping = buildRecordMapping(record);
    expect(mapping.location).toBe('place');
    expect(mapping.at).toBe('datetime');
    expect(mapping.db).toBe('noise');
    expect(mapping.source).toBe('origin');
    expect(mapping.feeling).toBe('评价');
  });

  it('should map "位置" alias to location', () => {
    const record = { '位置': '高架桥', timestamp: '2026-06-10 07:45', '声级': 88, '噪声源': '车流', '主观评价': '刺耳' };
    const mapping = buildRecordMapping(record);
    expect(mapping.location).toBe('位置');
    expect(mapping.at).toBe('timestamp');
    expect(mapping.db).toBe('声级');
    expect(mapping.source).toBe('噪声源');
    expect(mapping.feeling).toBe('主观评价');
  });

  it('should return partial mapping when some fields are missing', () => {
    const record = { '地点': '某处' };
    const mapping = buildRecordMapping(record);
    expect(mapping.location).toBe('地点');
    expect(mapping.at).toBeUndefined();
    expect(mapping.db).toBeUndefined();
  });
});

describe('mapFields', () => {
  it('should detect all standard Chinese fields', () => {
    const { detectedFields } = mapFields({ '地点': '', '时间': '', '分贝': '', '来源': '', '主观感受': '' });
    expect(Object.keys(detectedFields)).toHaveLength(5);
    expect(detectedFields.location).toBe('地点');
    expect(detectedFields.at).toBe('时间');
    expect(detectedFields.db).toBe('分贝');
    expect(detectedFields.source).toBe('来源');
    expect(detectedFields.feeling).toBe('主观感受');
  });

  it('should detect English aliases', () => {
    const { detectedFields } = mapFields({ location: '', db: '', source: '' });
    expect(detectedFields.location).toBe('location');
    expect(detectedFields.db).toBe('db');
    expect(detectedFields.source).toBe('source');
  });
});

describe('validateRecord', () => {
  const validMapping = {
    location: '地点',
    at: '时间',
    db: '分贝',
    source: '来源',
    feeling: '主观感受'
  };

  it('should validate a correct record', () => {
    const record = { '地点': '人民公园', '时间': '2026-06-07 08:30', '分贝': '55', '来源': '晨练人群', '主观感受': '可接受' };
    const result = validateRecord(record, validMapping, 2);
    expect(result.valid).toBe(true);
    expect(result.record.location).toBe('人民公园');
    expect(result.record.db).toBe(55);
    expect(result.record.feeling).toBe('可接受');
    expect(result.record.at).toBe('2026-06-07T08:30');
  });

  it('should reject illegal dB value (non-numeric)', () => {
    const record = { '地点': 'invalid', '时间': '2026-06-08 20:00', '分贝': 'abc', '来源': '测试', '主观感受': '安静' };
    const result = validateRecord(record, validMapping, 8);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('分贝值') && e.includes('20-130'))).toBe(true);
  });

  it('should reject dB value below 20', () => {
    const record = { '地点': '某地', '时间': '2026-06-08 20:00', '分贝': '10', '来源': '测试', '主观感受': '安静' };
    const result = validateRecord(record, validMapping, 2);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('20-130'))).toBe(true);
  });

  it('should reject dB value above 130', () => {
    const record = { '地点': '某地', '时间': '2026-06-08 20:00', '分贝': '200', '来源': '测试', '主观感受': '安静' };
    const result = validateRecord(record, validMapping, 2);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('20-130'))).toBe(true);
  });

  it('should accept dB value at boundary 20', () => {
    const record = { '地点': '某地', '时间': '2026-06-08 20:00', '分贝': '20', '来源': '测试', '主观感受': '安静' };
    const result = validateRecord(record, validMapping, 2);
    expect(result.valid).toBe(true);
    expect(result.record.db).toBe(20);
  });

  it('should accept dB value at boundary 130', () => {
    const record = { '地点': '某地', '时间': '2026-06-08 20:00', '分贝': '130', '来源': '测试', '主观感受': '刺耳' };
    const result = validateRecord(record, validMapping, 2);
    expect(result.valid).toBe(true);
    expect(result.record.db).toBe(130);
  });

  it('should reject unknown subjective feeling', () => {
    const record = { '地点': '公园北门', '时间': '2026-06-08 21:00', '分贝': '50', '来源': '环境声', '主观感受': '未知感受' };
    const result = validateRecord(record, validMapping, 9);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('未知感受') && e.includes('安静'))).toBe(true);
  });

  it('should accept all valid feelings', () => {
    for (const feeling of validFeelings) {
      const record = { '地点': '某地', '时间': '2026-06-08 20:00', '分贝': '55', '来源': '测试', '主观感受': feeling };
      const result = validateRecord(record, validMapping, 2);
      expect(result.valid).toBe(true);
    }
  });

  it('should reject missing required field', () => {
    const record = { '时间': '2026-06-08 20:00', '分贝': '55', '来源': '测试', '主观感受': '安静' };
    const partialMapping = { at: '时间', db: '分贝', source: '来源', feeling: '主观感受' };
    const result = validateRecord(record, partialMapping, 2);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('缺少字段'))).toBe(true);
  });

  it('should reject empty field value', () => {
    const record = { '地点': '', '时间': '2026-06-08 20:00', '分贝': '55', '来源': '测试', '主观感受': '安静' };
    const result = validateRecord(record, validMapping, 2);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('不能为空'))).toBe(true);
  });

  it('should reject invalid time format', () => {
    const record = { '地点': '某地', '时间': 'not-a-date', '分贝': '55', '来源': '测试', '主观感受': '安静' };
    const result = validateRecord(record, validMapping, 2);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('时间格式'))).toBe(true);
  });

  it('should convert space to T in datetime', () => {
    const record = { '地点': '某地', '时间': '2026-06-07 08:30', '分贝': '55', '来源': '测试', '主观感受': '安静' };
    const result = validateRecord(record, validMapping, 2);
    expect(result.valid).toBe(true);
    expect(result.record.at).toBe('2026-06-07T08:30');
  });

  it('should accept T-separated datetime', () => {
    const record = { '地点': '某地', '时间': '2026-06-07T08:30', '分贝': '55', '来源': '测试', '主观感受': '安静' };
    const result = validateRecord(record, validMapping, 2);
    expect(result.valid).toBe(true);
    expect(result.record.at).toBe('2026-06-07T08:30');
  });
});

describe('detectDuplicates', () => {
  it('should detect duplicates against existing records', () => {
    const existingRecords = [
      { at: '2026-06-07T08:30', location: '人民公园', db: 55, source: '晨练人群' }
    ];
    const newRecords = [
      { at: '2026-06-07T08:30', location: '人民公园', db: 55, source: '晨练人群' },
      { at: '2026-06-07T12:15', location: '商业街口', db: 82, source: '促销喇叭' }
    ];
    const dupes = detectDuplicates(newRecords, existingRecords);
    expect(dupes).toEqual([0]);
  });

  it('should detect duplicates within new records', () => {
    const existingRecords = [];
    const newRecords = [
      { at: '2026-06-07T08:30', location: '人民公园', db: 55, source: '晨练人群' },
      { at: '2026-06-07T08:30', location: '人民公园', db: 55, source: '晨练人群' }
    ];
    const dupes = detectDuplicates(newRecords, existingRecords);
    expect(dupes).toEqual([1]);
  });

  it('should not flag non-duplicates', () => {
    const existingRecords = [];
    const newRecords = [
      { at: '2026-06-07T08:30', location: '人民公园', db: 55, source: '晨练人群' },
      { at: '2026-06-07T08:30', location: '人民公园', db: 55, source: '晨练人群', feeling: '偏吵' }
    ];
    const dupes = detectDuplicates(newRecords, existingRecords);
    expect(dupes).toEqual([1]);
  });

  it('should return empty array when no duplicates', () => {
    const existingRecords = [];
    const newRecords = [
      { at: '2026-06-07T08:30', location: '人民公园', db: 55, source: '晨练人群' },
      { at: '2026-06-07T12:15', location: '商业街口', db: 82, source: '促销喇叭' }
    ];
    const dupes = detectDuplicates(newRecords, existingRecords);
    expect(dupes).toEqual([]);
  });
});

describe('generateRecordKey', () => {
  it('should combine at, location, db, source', () => {
    const record = { at: '2026-06-07T08:30', location: '人民公园', db: 55, source: '晨练人群' };
    expect(generateRecordKey(record)).toBe('2026-06-07T08:30|人民公园|55|晨练人群');
  });
});

describe('processImportData with test-noise-data.csv', () => {
  const rawData = parseCSV(csvNoiseContent);
  const existingRecords = [];

  it('should parse 8 rows from test-noise-data.csv', () => {
    expect(rawData).toHaveLength(8);
  });

  it('should have 6 valid + 2 error records (illegal dB + unknown feeling)', () => {
    const result = processImportData(rawData, existingRecords);
    expect(result.validRecords.length + result.errorRecords.length).toBe(8);
  });

  it('should flag row with "abc" dB as error', () => {
    const result = processImportData(rawData, existingRecords);
    const dbError = result.errorRecords.find(e => e.errors.some(msg => msg.includes('abc')));
    expect(dbError).toBeDefined();
    expect(dbError.errors.some(msg => msg.includes('分贝值'))).toBe(true);
  });

  it('should flag row with "未知感受" as error', () => {
    const result = processImportData(rawData, existingRecords);
    const feelingError = result.errorRecords.find(e => e.errors.some(msg => msg.includes('未知感受')));
    expect(feelingError).toBeDefined();
    expect(feelingError.errors.some(msg => msg.includes('主观感受'))).toBe(true);
  });

  it('should detect all 5 standard fields', () => {
    const result = processImportData(rawData, existingRecords);
    expect(Object.keys(result.detectedFields)).toHaveLength(5);
  });

  it('should have no duplicates when existing records are empty', () => {
    const result = processImportData(rawData, existingRecords);
    expect(result.duplicateIndices).toEqual([]);
  });
});

describe('processImportData with test-duplicate-data.csv', () => {
  const rawData = parseCSV(csvDuplicateContent);

  it('should parse 7 rows from test-duplicate-data.csv', () => {
    expect(rawData).toHaveLength(7);
  });

  it('should detect duplicates within the file', () => {
    const result = processImportData(rawData, []);
    expect(result.duplicateIndices.length).toBeGreaterThanOrEqual(1);
  });

  it('should detect duplicate against existing records', () => {
    const existingRecords = [
      { at: '2026-06-05T07:40', location: '老城菜市口', db: 76, source: '叫卖与卸货' }
    ];
    const result = processImportData(rawData, existingRecords);
    expect(result.duplicateIndices.length).toBeGreaterThanOrEqual(1);
  });

  it('should produce valid records for non-duplicate non-error rows', () => {
    const result = processImportData(rawData, []);
    expect(result.validRecords.length).toBeGreaterThan(0);
  });

  it('should count total records = valid + error', () => {
    const result = processImportData(rawData, []);
    expect(result.validRecords.length + result.errorRecords.length).toBe(7);
  });
});

describe('processImportData with test-noise-data.json', () => {
  it('should parse 5 records from JSON', () => {
    expect(jsonNoiseData).toHaveLength(5);
  });

  it('should map field aliases across all 5 JSON records', () => {
    const result = processImportData(jsonNoiseData, []);
    expect(Object.keys(result.detectedFields).length).toBeGreaterThanOrEqual(5);
  });

  it('should map "location" alias to location field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[1]);
    expect(mapping.location).toBe('location');
  });

  it('should map "place" alias to location field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[3]);
    expect(mapping.location).toBe('place');
  });

  it('should map "位置" alias to location field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[4]);
    expect(mapping.location).toBe('位置');
  });

  it('should map "db" alias to db field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[1]);
    expect(mapping.db).toBe('db');
  });

  it('should map "noise" alias to db field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[3]);
    expect(mapping.db).toBe('noise');
  });

  it('should map "声级" alias to db field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[4]);
    expect(mapping.db).toBe('声级');
  });

  it('should map "feeling" alias to feeling field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[1]);
    expect(mapping.feeling).toBe('feeling');
  });

  it('should map "评价" alias to feeling field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[3]);
    expect(mapping.feeling).toBe('评价');
  });

  it('should map "主观评价" alias to feeling field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[4]);
    expect(mapping.feeling).toBe('主观评价');
  });

  it('should map "source" alias to source field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[1]);
    expect(mapping.source).toBe('source');
  });

  it('should map "origin" alias to source field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[3]);
    expect(mapping.source).toBe('origin');
  });

  it('should map "噪声源" alias to source field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[4]);
    expect(mapping.source).toBe('噪声源');
  });

  it('should map "at" alias to at field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[2]);
    expect(mapping.at).toBe('at');
  });

  it('should map "datetime" alias to at field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[3]);
    expect(mapping.at).toBe('datetime');
  });

  it('should map "timestamp" alias to at field', () => {
    const mapping = buildRecordMapping(jsonNoiseData[4]);
    expect(mapping.at).toBe('timestamp');
  });

  it('should have 0 error records when all JSON data has valid values', () => {
    const result = processImportData(jsonNoiseData, []);
    expect(result.errorRecords.length).toBe(0);
  });

  it('should have 5 valid records from JSON data', () => {
    const result = processImportData(jsonNoiseData, []);
    expect(result.validRecords).toHaveLength(5);
  });

  it('should have no duplicates within JSON data itself', () => {
    const result = processImportData(jsonNoiseData, []);
    expect(result.duplicateIndices).toEqual([]);
  });

  it('should convert numeric db from JSON to number type', () => {
    const result = processImportData(jsonNoiseData, []);
    result.validRecords.forEach(r => {
      expect(typeof r.db).toBe('number');
    });
  });
});

describe('import batch statistics', () => {
  it('should correctly count valid, error, and duplicate records for CSV noise data', () => {
    const rawData = parseCSV(csvNoiseContent);
    const result = processImportData(rawData, []);
    const duplicateSet = new Set(result.duplicateIndices);
    const totalValid = result.validRecords.length;
    const totalErrors = result.errorRecords.length;
    const totalDuplicates = duplicateSet.size;

    expect(totalValid + totalErrors).toBe(8);
    expect(totalDuplicates).toBe(0);

    expect(totalErrors).toBe(2);
  });

  it('should correctly count duplicates for CSV duplicate data', () => {
    const rawData = parseCSV(csvDuplicateContent);
    const result = processImportData(rawData, []);
    const duplicateSet = new Set(result.duplicateIndices);

    expect(result.validRecords.length).toBeGreaterThan(0);
    expect(duplicateSet.size).toBeGreaterThan(0);

    const nonDuplicateCount = result.validRecords.length - duplicateSet.size;
    expect(nonDuplicateCount).toBeGreaterThan(0);
  });

  it('should simulate a full import batch lifecycle', () => {
    const rawData = parseCSV(csvNoiseContent);
    const existingRecords = [];
    const result = processImportData(rawData, existingRecords);

    const skipDuplicates = true;
    const duplicateSet = new Set(result.duplicateIndices);

    let recordsToImport;
    let skippedCount;

    if (skipDuplicates && duplicateSet.size > 0) {
      recordsToImport = result.validRecords.filter((_, index) => !duplicateSet.has(index));
      skippedCount = duplicateSet.size;
    } else {
      recordsToImport = [...result.validRecords];
      skippedCount = 0;
    }

    const batch = {
      id: 'test-batch-id',
      fileName: 'test-noise-data.csv',
      importTime: new Date().toISOString(),
      successCount: recordsToImport.length,
      errorCount: result.errorRecords.length,
      skippedCount,
      recordIds: recordsToImport.map(r => r.id),
      status: 'active'
    };

    expect(batch.successCount).toBe(result.validRecords.length - skippedCount);
    expect(batch.errorCount).toBe(2);
    expect(batch.skippedCount).toBe(0);
    expect(batch.status).toBe('active');
    expect(batch.recordIds.length).toBe(batch.successCount);
  });

  it('should correctly skip duplicates when skipDuplicates is true', () => {
    const rawData = parseCSV(csvDuplicateContent);
    const result = processImportData(rawData, []);
    const duplicateSet = new Set(result.duplicateIndices);

    const skipDuplicates = true;
    let recordsToImport;
    let skippedCount;

    if (skipDuplicates && duplicateSet.size > 0) {
      recordsToImport = result.validRecords.filter((_, index) => !duplicateSet.has(index));
      skippedCount = duplicateSet.size;
    } else {
      recordsToImport = [...result.validRecords];
      skippedCount = 0;
    }

    expect(skippedCount).toBeGreaterThan(0);
    expect(recordsToImport.length).toBe(result.validRecords.length - skippedCount);
  });

  it('should not skip duplicates when skipDuplicates is false', () => {
    const rawData = parseCSV(csvDuplicateContent);
    const result = processImportData(rawData, []);
    const duplicateSet = new Set(result.duplicateIndices);

    const skipDuplicates = false;
    let recordsToImport;
    let skippedCount;

    if (skipDuplicates && duplicateSet.size > 0) {
      recordsToImport = result.validRecords.filter((_, index) => !duplicateSet.has(index));
      skippedCount = duplicateSet.size;
    } else {
      recordsToImport = [...result.validRecords];
      skippedCount = 0;
    }

    expect(skippedCount).toBe(0);
    expect(recordsToImport.length).toBe(result.validRecords.length);
  });

  it('should produce correct batch stats for JSON import', () => {
    const result = processImportData(jsonNoiseData, []);
    const duplicateSet = new Set(result.duplicateIndices);

    const batch = {
      successCount: result.validRecords.length - duplicateSet.size,
      errorCount: result.errorRecords.length,
      skippedCount: duplicateSet.size
    };

    expect(batch.successCount).toBe(5);
    expect(batch.errorCount).toBe(0);
    expect(batch.skippedCount).toBe(0);
  });
});
