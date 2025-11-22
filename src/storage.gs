/**
 * storage.gs
 * Fear & Greed Index Bot - データ保存
 *
 * このファイルには以下が含まれます：
 * - 前回データの取得
 * - 現在データの保存
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