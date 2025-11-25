/**
 * main.gs
 * Fear & Greed Index Bot - メイン実行ファイル
 *
 * このファイルには以下が含まれます：
 * - トリガーから呼び出される関数（checkAlert, dailyReport, weeklyReport）
 * - Bot実行のメインロジック
 * - テスト用関数
 */

/**
 * アラート監視（1時間ごとに実行）
 * トリガーから自動実行される
 */
function checkAlert() {
  Logger.log('🔍 アラート監視: ' + new Date());
  runBot(false);
}

/**
 * 定期レポート（毎日朝9時に実行）
 * トリガーから自動実行される
 */
function dailyReport() {
  Logger.log('📊 定期レポート: ' + new Date());
  runBot(true);
}

/**
 * 週次レポート（毎週土曜日朝10時に実行）
 * トリガーから自動実行される
 */
function weeklyReport() {
  Logger.log('📈 週次レポート: ' + new Date());

  // 1. 週次データを取得
  const weeklyData = loadWeeklyData();

  // 2. データ数をカウント
  const dataCount = weeklyData.filter(d => d !== null).length;
  Logger.log(`週次データ: ${dataCount}/7 日分`);

  // 3. 最低データ数チェック
  const config = getConfig();
  const minDataCount = config.constants.weekly.minDataCount;

  if (dataCount < minDataCount) {
    Logger.log(`⚠️ データ不足のため週次レポートをスキップ（${dataCount}/${minDataCount}日分）`);
    return;
  }

  // 4. メッセージ生成
  const message = createWeeklyMessage(weeklyData);

  Logger.log('\n--- 週次レポート ---');
  Logger.log(message);
  Logger.log('-------------------\n');

  // 5. 投稿
  if (postToTwitter(message)) {
    Logger.log('✅ 週次レポート投稿成功');
  } else {
    Logger.log('❌ 週次レポート投稿失敗');
  }
}

/**
 * Bot実行のメインロジック
 * @param {boolean} isScheduledReport - 定期レポートならtrue、アラート監視ならfalse
 */
function runBot(isScheduledReport) {
  // 1. 指数を取得
  const indexData = fetchFearGreedIndex();
  if (!indexData) {
    Logger.log('❌ 指数の取得に失敗');
    return;
  }

  Logger.log(`現在: ${indexData.value} (${indexData.classification})`);

  // 2. 前回のデータを取得
  const previousData = loadPreviousData();
  const previousValue = previousData ? previousData.value : null;

  if (previousValue !== null) {
    Logger.log(`前回: ${previousValue}`);
  }

  // 3. アラートチェック
  const alertType = checkAlerts(previousValue, indexData.value);

  // 4. 投稿判定
  let shouldPost = false;
  let message = null;

  if (alertType) {
    // アラート発生
    Logger.log(`⚠️ アラート: ${alertType}`);
    message = createMessage(indexData, alertType);
    shouldPost = true;
  } else if (isScheduledReport) {
    // 定期レポート
    Logger.log('📊 定期レポート投稿');
    message = createMessage(indexData, null);
    shouldPost = true;
  } else {
    // 変化なし
    Logger.log('✓ 変化なし');
  }

  // 5. 投稿処理
  if (shouldPost && message) {
    Logger.log('\n--- メッセージ ---');
    Logger.log(message);
    Logger.log('------------------\n');

    if (postToTwitter(message)) {
      saveData(indexData);
    } else {
      Logger.log('⚠️ 投稿失敗のためデータ未保存');
    }
  } else {
    // 投稿しない場合でもデータは保存
    saveData(indexData);
  }

  // 6. 週次データも保存（定期レポート時のみ）
  if (isScheduledReport) {
    const dayOfWeek = getDayOfWeekJST();
    saveWeeklyDataByDay(indexData, dayOfWeek);
  }
}

/**
 * テスト実行（投稿なし）
 * 手動実行用：指数取得とアラート判定のみ
 */
function testBot() {
  Logger.log('=== テスト実行（投稿なし） ===');

  // 指数を取得
  const indexData = fetchFearGreedIndex();
  if (!indexData) {
    Logger.log('❌ 指数の取得に失敗');
    return;
  }

  Logger.log(`✅ Index: ${indexData.value} (${indexData.classification})`);

  // 前回のデータを取得
  const previousData = loadPreviousData();
  const previousValue = previousData ? previousData.value : null;

  if (previousValue !== null) {
    Logger.log(`前回: ${previousValue}`);
  } else {
    Logger.log('前回: データなし（初回実行）');
  }

  // アラートチェック
  const alertType = checkAlerts(previousValue, indexData.value);

  if (alertType) {
    Logger.log(`⚠️ アラート検出: ${alertType}`);
    const message = createMessage(indexData, alertType);
    Logger.log('\n--- メッセージプレビュー ---');
    Logger.log(message);
    Logger.log('---------------------------\n');
  } else {
    Logger.log('✓ アラートなし');
    const message = createMessage(indexData, null);
    Logger.log('\n--- 定期レポートプレビュー ---');
    Logger.log(message);
    Logger.log('-----------------------------\n');
  }

  Logger.log('※ このテストでは投稿は行われません');
}

/**
 * 週次レポートテスト（投稿なし）
 * 手動実行用：週次レポートのメッセージ生成のみ
 */
function testWeeklyReport() {
  Logger.log('=== 週次レポートテスト（投稿なし） ===');

  // 1. 週次データを取得
  const weeklyData = loadWeeklyData();

  // 2. データ数をカウント
  const dataCount = weeklyData.filter(d => d !== null).length;
  Logger.log(`週次データ: ${dataCount}/7 日分\n`);

  // 3. データ内容を表示
  debugShowWeeklyData();

  // 4. 最低データ数チェック
  const config = getConfig();
  const minDataCount = config.constants.weekly.minDataCount;

  if (dataCount < minDataCount) {
    Logger.log(`\n⚠️ データ不足（${dataCount}/${minDataCount}日分）`);
    Logger.log('本番実行では投稿されません');
  }

  // 5. メッセージ生成（データ不足でも生成してプレビュー）
  const message = createWeeklyMessage(weeklyData);

  Logger.log('\n--- 週次レポートプレビュー ---');
  Logger.log(message);
  Logger.log('-----------------------------\n');

  Logger.log('※ このテストでは投稿は行われません');
}

/**
 * 実投稿テスト
 * 手動実行用：実際にXに投稿します（1回のみ実行推奨）
 */
function testRealPost() {
  Logger.log('=== 実投稿テスト ===');

  const indexData = fetchFearGreedIndex();
  if (!indexData) {
    Logger.log('❌ 指数の取得に失敗');
    return;
  }

  Logger.log(`✅ Index: ${indexData.value} (${indexData.classification})`);

  const message = createMessage(indexData, null);

  Logger.log('\n--- 投稿内容 ---');
  Logger.log(message);
  Logger.log('----------------\n');

  if (postToTwitter(message)) {
    Logger.log('✅ 投稿成功! Xを確認してください');
    saveData(indexData);
  } else {
    Logger.log('❌ 投稿失敗');
  }
}

/**
 * キャッシュクリアテスト
 * 手動実行用：保存されたデータをクリアします
 */
function testClearCache() {
  Logger.log('=== キャッシュクリアテスト ===');

  // クリア前のデータを表示
  Logger.log('クリア前:');
  debugShowCache();

  // クリア実行
  if (clearCache()) {
    Logger.log('\n✅ キャッシュをクリアしました\n');

    // クリア後のデータを表示
    Logger.log('クリア後:');
    debugShowCache();
  }
}

/**
 * 週次データクリアテスト
 * 手動実行用：週次データをクリアします
 */
function testClearWeeklyData() {
  Logger.log('=== 週次データクリアテスト ===');

  // クリア前のデータを表示
  Logger.log('クリア前:');
  debugShowWeeklyData();

  // クリア実行
  if (clearWeeklyData()) {
    Logger.log('\n✅ 週次データをクリアしました\n');

    // クリア後のデータを表示
    Logger.log('クリア後:');
    debugShowWeeklyData();
  }
}