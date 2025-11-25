/**
 * storage.gs
 * Fear & Greed Index Bot - データ保存
 *
 * このファイルには以下が含まれます：
 * - 前回データの取得
 * - 現在データの保存
 * - 週次データの保存・取得
 * - キャッシュ管理
 */

/**
 * 前回のデータを取得
 * @return {Object|null} 前回のデータ {value, classification, timestamp, savedAt} または null
 */
function loadPreviousData() {
  const config = getConfig();
  const cache = CacheService.getScriptCache();
  const cached = cache.get(config.constants.cacheKey);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      Logger.log('⚠️ キャッシュのパースに失敗: ' + e);
      return null;
    }
  }

  return null;
}

/**
 * 現在のデータを保存
 * @param {Object} indexData - 保存する指数データ {value, classification, timestamp}
 * @return {boolean} 保存成功ならtrue
 */
function saveData(indexData) {
  if (!indexData || typeof indexData.value === 'undefined') {
    Logger.log('⚠️ 無効なデータのため保存できません');
    return false;
  }

  const config = getConfig();
  const cache = CacheService.getScriptCache();

  const dataToSave = {
    value: indexData.value,
    classification: indexData.classification,
    timestamp: indexData.timestamp,
    savedAt: new Date().toISOString()
  };

  try {
    cache.put(
      config.constants.cacheKey,
      JSON.stringify(dataToSave),
      config.constants.cacheExpiration
    );
    return true;
  } catch (e) {
    Logger.log('❌ データ保存エラー: ' + e);
    return false;
  }
}

/**
 * キャッシュをクリア（デバッグ用）
 * @return {boolean} クリア成功ならtrue
 */
function clearCache() {
  const config = getConfig();
  const cache = CacheService.getScriptCache();

  try {
    cache.remove(config.constants.cacheKey);
    Logger.log('✅ キャッシュをクリアしました');
    return true;
  } catch (e) {
    Logger.log('❌ キャッシュクリアエラー: ' + e);
    return false;
  }
}

/**
 * 現在のキャッシュ内容を表示（デバッグ用）
 */
function debugShowCache() {
  const data = loadPreviousData();
  if (data) {
    Logger.log('=== キャッシュ内容 ===');
    Logger.log('Value: ' + data.value);
    Logger.log('Classification: ' + data.classification);
    Logger.log('Timestamp: ' + data.timestamp);
    Logger.log('Saved At: ' + data.savedAt);
  } else {
    Logger.log('キャッシュは空です');
  }
}

/**
 * 現在の曜日を取得（JST基準）
 * @return {number} 曜日 (0=日, 1=月, ..., 6=土)
 */
function getDayOfWeekJST() {
  const now = new Date();

  // 日本時間に変換
  const jstOffset = 9 * 60; // JSTはUTC+9
  const jstTime = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);

  return jstTime.getDay();
}

/**
 * 週次データを曜日別に保存
 * @param {Object} indexData - 保存する指数データ {value, classification, timestamp}
 * @param {number} dayOfWeek - 曜日 (0=日, 1=月, ..., 6=土)
 * @return {boolean} 保存成功ならtrue
 */
function saveWeeklyDataByDay(indexData, dayOfWeek) {
  if (!indexData || typeof indexData.value === 'undefined') {
    Logger.log('⚠️ 無効なデータのため週次データを保存できません');
    return false;
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    Logger.log('⚠️ 無効な曜日: ' + dayOfWeek);
    return false;
  }

  const config = getConfig();
  const props = PropertiesService.getScriptProperties();
  const key = config.constants.weeklyKeys[dayOfWeek];

  // JST基準の日付を取得
  const now = new Date();
  const jstOffset = 9 * 60;
  const jstTime = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);
  const dateString = jstTime.toISOString().split('T')[0]; // YYYY-MM-DD

  const dataToSave = {
    value: indexData.value,
    classification: indexData.classification,
    timestamp: indexData.timestamp,
    date: dateString,
    dayOfWeek: dayOfWeek,
    savedAt: new Date().toISOString()
  };

  try {
    props.setProperty(key, JSON.stringify(dataToSave));
    Logger.log(`✅ 週次データ保存成功: ${key} (${dateString})`);
    return true;
  } catch (e) {
    Logger.log('❌ 週次データ保存エラー: ' + e);
    return false;
  }
}

/**
 * 週次データを取得（7日分）
 * @return {Array} 7日分のデータ配列 [日, 月, 火, 水, 木, 金, 土]
 *                 データがない曜日はnull
 */
function loadWeeklyData() {
  const config = getConfig();
  const props = PropertiesService.getScriptProperties();
  const weeklyData = [];

  for (let i = 0; i < 7; i++) {
    const key = config.constants.weeklyKeys[i];
    const data = props.getProperty(key);

    if (data) {
      try {
        weeklyData.push(JSON.parse(data));
      } catch (e) {
        Logger.log(`⚠️ 曜日${i}のデータパースに失敗: ${e}`);
        weeklyData.push(null);
      }
    } else {
      weeklyData.push(null);
    }
  }

  return weeklyData;
}

/**
 * 週次データをクリア（デバッグ用）
 * @return {boolean} クリア成功ならtrue
 */
function clearWeeklyData() {
  const config = getConfig();
  const props = PropertiesService.getScriptProperties();

  try {
    for (let i = 0; i < 7; i++) {
      const key = config.constants.weeklyKeys[i];
      props.deleteProperty(key);
    }
    Logger.log('✅ 週次データをクリアしました');
    return true;
  } catch (e) {
    Logger.log('❌ 週次データクリアエラー: ' + e);
    return false;
  }
}

/**
 * 週次データの内容を表示（デバッグ用）
 */
function debugShowWeeklyData() {
  const weeklyData = loadWeeklyData();
  const config = getConfig();
  const dayLabels = config.messages.weekly.dayLabels;

  Logger.log('=== 週次データ内容 ===');
  weeklyData.forEach((data, index) => {
    if (data) {
      Logger.log(`${dayLabels[index]}: ${data.value} (${data.classification}) - ${data.date}`);
    } else {
      Logger.log(`${dayLabels[index]}: データなし`);
    }
  });

  const count = weeklyData.filter(d => d !== null).length;
  Logger.log(`\n合計: ${count}/7 日分のデータ`);
}