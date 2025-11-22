/**
 * Main.gs
 * Fear & Greed Index Bot - メイン実行ファイル
 *
 * このファイルには以下が含まれます：
 * - トリガーから呼び出される関数（checkAlert, dailyReport）
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
 * Bot実行のメインロジック
 * @param {boolean} isScheduledReport - 定期レポートならtrue、アラート監視ならfalse
 */
function runBot(isScheduledReport) {
    // 指数を取得
    const indexData = getFearGreedIndex();
    if (!indexData) {
        Logger.log('❌ 指数の取得に失敗');
        return;
    }

    Logger.log(`現在: ${indexData.value} (${indexData.classification})`);

    // 前回のデータを取得
    const previousData = getPreviousData();
    const previousValue = previousData ? previousData.value : null;

    if (previousValue !== null) {
        Logger.log(`前回: ${previousValue}`);
    }

    // アラートチェック
    const alertType = checkThresholdAlert(previousValue, indexData.value);

    let shouldPost = false;
    let tweetText = null;

    if (alertType) {
        // アラート発生
        const alertNames = {
            'escape_fear': '🚀 恐怖ゾーン脱出',
            'enter_fear': '📉 恐怖ゾーン突入'
        };
        Logger.log(`⚠️ ${alertNames[alertType]}`);
        tweetText = createTweetText(indexData, alertType);
        shouldPost = true;
    } else if (isScheduledReport) {
        // 定期レポート
        Logger.log('📊 定期レポート投稿');
        tweetText = createTweetText(indexData);
        shouldPost = true;
    } else {
        // 変化なし
        Logger.log('✓ 変化なし');
    }

    // 投稿処理
    if (shouldPost && tweetText) {
        Logger.log('\n--- ツイート ---');
        Logger.log(tweetText);
        Logger.log('---------------\n');

        if (postTweet(tweetText)) {
            saveCurrentData(indexData);
        } else {
            Logger.log('⚠️ 投稿失敗のためデータ未保存');
        }
    } else {
        saveCurrentData(indexData);
    }
}

/**
 * テスト実行（投稿なし）
 * 手動実行用：指数取得とアラート判定のみ
 */
function testBot() {
    Logger.log('=== テスト実行（投稿なし） ===');
    checkAlert();
}

/**
 * 実投稿テスト
 * 手動実行用：実際にXに投稿します（1回のみ実行推奨）
 */
function testRealPost() {
    Logger.log('=== 実投稿テスト ===');

    const indexData = getFearGreedIndex();
    if (!indexData) {
        Logger.log('❌ 指数の取得に失敗');
        return;
    }

    Logger.log(`✅ Index: ${indexData.value} (${indexData.classification})`);

    const tweetText = createTweetText(indexData, null);

    Logger.log('\n--- 投稿内容 ---');
    Logger.log(tweetText);
    Logger.log('---------------\n');

    if (postTweet(tweetText)) {
        Logger.log('✅ 投稿成功!Xを確認してください');
        saveCurrentData(indexData);
    } else {
        Logger.log('❌ 投稿失敗');
    }
}