/**
 * tests.gs
 * Fear & Greed Index Bot - テスト関数
 *
 * このファイルには以下が含まれます：
 * - 移行後のテスト手順で使用する各種テスト関数
 * - 個別機能のテスト
 * - 統合テスト
 * - 週次レポートのテスト
 */

/**
 * 1. 設定確認テスト
 * API認証情報が正しく設定されているか確認
 */
function test1_Config() {
  Logger.log('=== 1. 設定確認テスト ===');

  const config = getConfig();

  // API認証情報の確認
  Logger.log('\n【API認証情報】');
  Logger.log('API Key: ' + (config.credentials.apiKey ? '設定済み ✅' : '未設定 ❌'));
  Logger.log('API Secret: ' + (config.credentials.apiSecret ? '設定済み ✅' : '未設定 ❌'));
  Logger.log('Access Token: ' + (config.credentials.accessToken ? '設定済み ✅' : '未設定 ❌'));
  Logger.log('Access Token Secret: ' + (config.credentials.accessTokenSecret ? '設定済み ✅' : '未設定 ❌'));

  // エンドポイントの確認
  Logger.log('\n【エンドポイント】');
  Logger.log('Fear & Greed API: ' + config.endpoints.fearGreedApi);
  Logger.log('Twitter API: ' + config.endpoints.twitterApi);

  // アラート設定の確認
  Logger.log('\n【アラート設定】');
  Logger.log('恐怖ゾーン閾値: ' + config.alerts.extremeFearThreshold);

  // キャッシュ設定の確認
  Logger.log('\n【キャッシュ設定】');
  Logger.log('キャッシュキー: ' + config.constants.cacheKey);
  Logger.log('有効期限: ' + config.constants.cacheExpiration + '秒');

  // 週次設定の確認
  Logger.log('\n【週次レポート設定】');
  Logger.log('最低データ数: ' + config.constants.weekly.minDataCount + '日');
  Logger.log('曜日キー数: ' + Object.keys(config.constants.weeklyKeys).length);

  Logger.log('\n✅ 設定確認テスト完了\n');
}

/**
 * 2. API取得テスト
 * Fear & Greed Index APIから正しくデータを取得できるか確認
 */
function test2_API() {
  Logger.log('=== 2. API取得テスト ===');

  Logger.log('APIからデータを取得中...');
  const indexData = fetchFearGreedIndex();

  if (indexData) {
    Logger.log('✅ API取得成功');
    Logger.log('\n【取得データ】');
    Logger.log('Value: ' + indexData.value);
    Logger.log('Classification: ' + indexData.classification);
    Logger.log('Timestamp: ' + indexData.timestamp);

    // データの妥当性チェック
    Logger.log('\n【妥当性チェック】');
    const isValid = (
      typeof indexData.value === 'number' &&
      indexData.value >= 0 &&
      indexData.value <= 100 &&
      typeof indexData.classification === 'string' &&
      indexData.classification.length > 0
    );
    Logger.log('データ妥当性: ' + (isValid ? '✅ OK' : '❌ NG'));
  } else {
    Logger.log('❌ API取得失敗');
    Logger.log('⚠️ エンドポイントURLやネットワーク接続を確認してください');
  }

  Logger.log('\n✅ API取得テスト完了\n');
}

/**
 * 3. キャッシュテスト
 * データの保存・読み込みが正しく動作するか確認
 */
function test3_Cache() {
  Logger.log('=== 3. キャッシュテスト ===');

  // テストデータを作成
  const testData = {
    value: 50,
    classification: 'neutral',
    timestamp: Date.now()
  };

  Logger.log('【保存前】');
  const before = loadPreviousData();
  Logger.log('保存前のデータ: ' + (before ? JSON.stringify(before) : 'なし'));

  // データを保存
  Logger.log('\n【保存】');
  Logger.log('テストデータを保存中...');
  Logger.log('Value: ' + testData.value);
  Logger.log('Classification: ' + testData.classification);

  const saveResult = saveData(testData);
  Logger.log('保存結果: ' + (saveResult ? '✅ 成功' : '❌ 失敗'));

  // データを読み込み
  Logger.log('\n【読み込み】');
  Logger.log('保存したデータを読み込み中...');
  const loaded = loadPreviousData();

  if (loaded) {
    Logger.log('✅ 読み込み成功');
    Logger.log('Value: ' + loaded.value);
    Logger.log('Classification: ' + loaded.classification);
    Logger.log('Saved At: ' + loaded.savedAt);

    // データの整合性チェック
    Logger.log('\n【整合性チェック】');
    const isMatch = (
      loaded.value === testData.value &&
      loaded.classification === testData.classification
    );
    Logger.log('データ整合性: ' + (isMatch ? '✅ OK' : '❌ NG'));
  } else {
    Logger.log('❌ 読み込み失敗');
  }

  Logger.log('\n✅ キャッシュテスト完了\n');
}

/**
 * 4. アラート判定テスト
 * アラート条件が正しく判定されるか確認
 */
function test4_Alert() {
  Logger.log('=== 4. アラート判定テスト ===');

  const config = getConfig();
  const threshold = config.alerts.extremeFearThreshold;

  Logger.log('設定閾値: ' + threshold);
  Logger.log('');

  // テストケース1: 恐怖ゾーン脱出（20以下 → 21以上）
  Logger.log('【テスト1】恐怖ゾーン脱出');
  Logger.log('前回: 15 → 現在: 25');
  const alertType1 = checkAlerts(15, 25);
  Logger.log('結果: ' + (alertType1 || 'アラートなし'));
  Logger.log('期待値: escape_fear');
  Logger.log('判定: ' + (alertType1 === 'escape_fear' ? '✅ 正しい' : '❌ 間違い'));
  Logger.log('');

  // テストケース2: 恐怖ゾーン突入（21以上 → 20以下）
  Logger.log('【テスト2】恐怖ゾーン突入');
  Logger.log('前回: 25 → 現在: 15');
  const alertType2 = checkAlerts(25, 15);
  Logger.log('結果: ' + (alertType2 || 'アラートなし'));
  Logger.log('期待値: enter_fear');
  Logger.log('判定: ' + (alertType2 === 'enter_fear' ? '✅ 正しい' : '❌ 間違い'));
  Logger.log('');

  // テストケース3: アラートなし（変化が閾値を越えない）
  Logger.log('【テスト3】アラートなし（通常の変化）');
  Logger.log('前回: 50 → 現在: 55');
  const alertType3 = checkAlerts(50, 55);
  Logger.log('結果: ' + (alertType3 || 'アラートなし'));
  Logger.log('期待値: null（アラートなし）');
  Logger.log('判定: ' + (alertType3 === null ? '✅ 正しい' : '❌ 間違い'));
  Logger.log('');

  // テストケース4: 境界値テスト（閾値ちょうど）
  Logger.log('【テスト4】境界値テスト');
  Logger.log('前回: 20 → 現在: 21');
  const alertType4 = checkAlerts(20, 21);
  Logger.log('結果: ' + (alertType4 || 'アラートなし'));
  Logger.log('期待値: escape_fear');
  Logger.log('判定: ' + (alertType4 === 'escape_fear' ? '✅ 正しい' : '❌ 間違い'));
  Logger.log('');

  // テストケース5: 初回実行（前回データなし）
  Logger.log('【テスト5】初回実行（前回データなし）');
  Logger.log('前回: null → 現在: 50');
  const alertType5 = checkAlerts(null, 50);
  Logger.log('結果: ' + (alertType5 || 'アラートなし'));
  Logger.log('期待値: null（アラートなし）');
  Logger.log('判定: ' + (alertType5 === null ? '✅ 正しい' : '❌ 間違い'));

  Logger.log('\n✅ アラート判定テスト完了\n');
}

/**
 * 5. メッセージ生成テスト
 * メッセージが正しく生成されるか確認
 */
function test5_Message() {
  Logger.log('=== 5. メッセージ生成テスト ===');

  const testData = {
    value: 50,
    classification: 'neutral',
    timestamp: Date.now()
  };

  // テスト1: 通常レポート
  Logger.log('【テスト1】通常レポート');
  const message1 = createMessage(testData, null);
  Logger.log('文字数: ' + message1.length);
  Logger.log('\n--- メッセージ内容 ---');
  Logger.log(message1);
  Logger.log('---------------------\n');

  // テスト2: 恐怖ゾーン脱出アラート
  Logger.log('【テスト2】恐怖ゾーン脱出アラート');
  const testData2 = { value: 25, classification: 'fear', timestamp: Date.now() };
  const message2 = createMessage(testData2, 'escape_fear');
  Logger.log('文字数: ' + message2.length);
  Logger.log('\n--- メッセージ内容 ---');
  Logger.log(message2);
  Logger.log('---------------------\n');

  // テスト3: 恐怖ゾーン突入アラート
  Logger.log('【テスト3】恐怖ゾーン突入アラート');
  const testData3 = { value: 15, classification: 'extreme fear', timestamp: Date.now() };
  const message3 = createMessage(testData3, 'enter_fear');
  Logger.log('文字数: ' + message3.length);
  Logger.log('\n--- メッセージ内容 ---');
  Logger.log(message3);
  Logger.log('---------------------\n');

  // テスト4: ゲージ表示テスト
  Logger.log('【テスト4】ゲージ表示テスト');
  const gaugeTests = [0, 25, 50, 75, 100];
  gaugeTests.forEach(value => {
    const gauge = createGauge(value);
    Logger.log(value + ': ' + gauge);
  });

  Logger.log('\n✅ メッセージ生成テスト完了\n');
}

/**
 * 6. 統合テスト
 * 実際のAPIデータを使って全体の流れをテスト（投稿なし）
 */
function test6_Integration() {
  Logger.log('=== 6. 統合テスト（投稿なし） ===');

  // 1. APIから指数を取得
  Logger.log('【ステップ1】指数取得');
  const indexData = fetchFearGreedIndex();
  if (!indexData) {
    Logger.log('❌ 指数の取得に失敗');
    return;
  }
  Logger.log('✅ 取得成功: ' + indexData.value + ' (' + indexData.classification + ')');

  // 2. 前回データを取得
  Logger.log('\n【ステップ2】前回データ取得');
  const previousData = loadPreviousData();
  const previousValue = previousData ? previousData.value : null;
  Logger.log(previousValue !== null ? '前回値: ' + previousValue : '前回データなし（初回実行）');

  // 3. アラート判定
  Logger.log('\n【ステップ3】アラート判定');
  const alertType = checkAlerts(previousValue, indexData.value);
  if (alertType) {
    Logger.log('⚠️ アラート検出: ' + alertType);
  } else {
    Logger.log('✓ アラートなし');
  }

  // 4. メッセージ生成
  Logger.log('\n【ステップ4】メッセージ生成');
  const message = createMessage(indexData, alertType);
  Logger.log('\n--- 生成されたメッセージ ---');
  Logger.log(message);
  Logger.log('---------------------------\n');

  // 5. データ保存（テスト用なので実際には保存しない）
  Logger.log('【ステップ5】データ保存');
  Logger.log('※ このテストでは実際には保存しません');

  Logger.log('\n✅ 統合テスト完了（投稿は行われませんでした）\n');
}

/**
 * 7. 週次ストレージテスト
 * 曜日別データの保存・取得が正しく動作するか確認
 */
function test7_WeeklyStorage() {
  Logger.log('=== 7. 週次ストレージテスト ===');

  // テストデータを作成
  const testData = {
    value: 42,
    classification: 'neutral',
    timestamp: Date.now()
  };

  // 現在の曜日を取得
  const dayOfWeek = getDayOfWeekJST();
  const config = getConfig();
  const dayLabels = config.messages.weekly.dayLabels;

  Logger.log('【保存】');
  Logger.log('現在の曜日: ' + dayLabels[dayOfWeek] + '曜日');
  Logger.log('テストデータ: ' + testData.value);

  // データを保存
  const saveResult = saveWeeklyDataByDay(testData, dayOfWeek);
  Logger.log('保存結果: ' + (saveResult ? '✅ 成功' : '❌ 失敗'));

  // データを読み込み
  Logger.log('\n【読み込み】');
  const weeklyData = loadWeeklyData();
  const savedData = weeklyData[dayOfWeek];

  if (savedData) {
    Logger.log('✅ 読み込み成功');
    Logger.log('Value: ' + savedData.value);
    Logger.log('Classification: ' + savedData.classification);
    Logger.log('Date: ' + savedData.date);
    Logger.log('Day of Week: ' + savedData.dayOfWeek);

    // データの整合性チェック
    Logger.log('\n【整合性チェック】');
    const isMatch = (
      savedData.value === testData.value &&
      savedData.classification === testData.classification &&
      savedData.dayOfWeek === dayOfWeek
    );
    Logger.log('データ整合性: ' + (isMatch ? '✅ OK' : '❌ NG'));
  } else {
    Logger.log('❌ 読み込み失敗');
  }

  // 全曜日のデータを表示
  Logger.log('\n【全曜日のデータ】');
  debugShowWeeklyData();

  Logger.log('\n✅ 週次ストレージテスト完了\n');
}

/**
 * 8. 週次メッセージ生成テスト
 * 週次レポートメッセージが正しく生成されるか確認
 */
function test8_WeeklyMessage() {
  Logger.log('=== 8. 週次メッセージ生成テスト ===');

  // テスト1: 完全データ（7日分）
  Logger.log('【テスト1】完全データ（7日分）');
  const fullData = [
    { value: 6, classification: 'extreme fear', timestamp: Date.now(), dayOfWeek: 0 },
    { value: 10, classification: 'extreme fear', timestamp: Date.now(), dayOfWeek: 1 },
    { value: 10, classification: 'extreme fear', timestamp: Date.now(), dayOfWeek: 2 },
    { value: 10, classification: 'extreme fear', timestamp: Date.now(), dayOfWeek: 3 },
    { value: 10, classification: 'extreme fear', timestamp: Date.now(), dayOfWeek: 4 },
    { value: 10, classification: 'extreme fear', timestamp: Date.now(), dayOfWeek: 5 },
    { value: 20, classification: 'fear', timestamp: Date.now(), dayOfWeek: 6 }
  ];
  const message1 = createWeeklyMessage(fullData);
  Logger.log('\n--- メッセージ内容 ---');
  Logger.log(message1);
  Logger.log('---------------------\n');

  // テスト2: 一部欠損データ
  Logger.log('【テスト2】一部欠損データ（5日分）');
  const partialData = [
    { value: 15, classification: 'extreme fear', timestamp: Date.now(), dayOfWeek: 0 },
    null,  // 月曜データなし
    { value: 20, classification: 'fear', timestamp: Date.now(), dayOfWeek: 2 },
    { value: 25, classification: 'fear', timestamp: Date.now(), dayOfWeek: 3 },
    null,  // 木曜データなし
    { value: 30, classification: 'fear', timestamp: Date.now(), dayOfWeek: 5 },
    { value: 35, classification: 'fear', timestamp: Date.now(), dayOfWeek: 6 }
  ];
  const message2 = createWeeklyMessage(partialData);
  Logger.log('\n--- メッセージ内容 ---');
  Logger.log(message2);
  Logger.log('---------------------\n');

  // テスト3: 実際の保存データを使用
  Logger.log('【テスト3】実際の保存データ');
  const actualData = loadWeeklyData();
  const dataCount = actualData.filter(d => d !== null).length;
  Logger.log('保存データ数: ' + dataCount + '/7 日分');

  if (dataCount > 0) {
    const message3 = createWeeklyMessage(actualData);
    Logger.log('\n--- メッセージ内容 ---');
    Logger.log(message3);
    Logger.log('---------------------\n');
  } else {
    Logger.log('⚠️ 保存データがないため、テストをスキップ');
  }

  Logger.log('\n✅ 週次メッセージ生成テスト完了\n');
}

/**
 * 9. 週次統合テスト
 * 週次レポートの全体フローをテスト（投稿なし）
 */
function test9_WeeklyIntegration() {
  Logger.log('=== 9. 週次統合テスト（投稿なし） ===');

  // 1. 週次データを取得
  Logger.log('【ステップ1】週次データ取得');
  const weeklyData = loadWeeklyData();
  const dataCount = weeklyData.filter(d => d !== null).length;
  Logger.log('データ数: ' + dataCount + '/7 日分');

  // 2. データ内容を表示
  Logger.log('\n【ステップ2】データ内容確認');
  debugShowWeeklyData();

  // 3. 最低データ数チェック
  Logger.log('\n【ステップ3】最低データ数チェック');
  const config = getConfig();
  const minDataCount = config.constants.weekly.minDataCount;
  Logger.log('最低必要数: ' + minDataCount + '日');

  if (dataCount < minDataCount) {
    Logger.log('⚠️ データ不足（本番では投稿されません）');
  } else {
    Logger.log('✅ データ十分（本番では投稿されます）');
  }

  // 4. メッセージ生成
  Logger.log('\n【ステップ4】メッセージ生成');
  const message = createWeeklyMessage(weeklyData);
  Logger.log('\n--- 生成されたメッセージ ---');
  Logger.log(message);
  Logger.log('---------------------------\n');

  Logger.log('✅ 週次統合テスト完了（投稿は行われませんでした）\n');
}

/**
 * すべてのテストを実行
 */
function runAllTests() {
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║  Fear & Greed Index Bot - 全テスト実行  ║');
  Logger.log('╚════════════════════════════════════════╝\n');

  const startTime = new Date();

  try {
    test1_Config();
    test2_API();
    test3_Cache();
    test4_Alert();
    test5_Message();
    test6_Integration();
    test7_WeeklyStorage();
    test8_WeeklyMessage();
    test9_WeeklyIntegration();

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    Logger.log('╔════════════════════════════════════════╗');
    Logger.log('║         すべてのテスト完了 ✅          ║');
    Logger.log('╚════════════════════════════════════════╝');
    Logger.log('実行時間: ' + duration + '秒');

  } catch (error) {
    Logger.log('\n❌ テスト実行中にエラーが発生しました');
    Logger.log('エラー: ' + error);
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * クイックテスト（API取得とメッセージ生成のみ）
 */
function quickTest() {
  Logger.log('=== クイックテスト ===\n');

  const indexData = fetchFearGreedIndex();
  if (!indexData) {
    Logger.log('❌ API取得失敗');
    return;
  }

  Logger.log('✅ Index: ' + indexData.value + ' (' + indexData.classification + ')');

  const message = createMessage(indexData, null);
  Logger.log('\n--- メッセージ ---');
  Logger.log(message);
  Logger.log('------------------');
}