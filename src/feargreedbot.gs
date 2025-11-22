/**
 * FearGreedBot.gs
 * Fear & Greed Index Bot - コア機能
 *
 * このファイルには以下が含まれます：
 * - Fear & Greed Indexの取得
 * - データの保存・読み込み
 * - アラート判定
 * - ツイート作成・投稿
 */

/**
 * Fear & Greed Indexを取得
 * @return {Object|null} 指数データ {value, classification, timestamp} または null
 */
function getFearGreedIndex() {
    const config = getConfig();

    try {
        const options = {
            method: 'get',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://edition.cnn.com/markets/fear-and-greed',
                'Origin': 'https://edition.cnn.com',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            },
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(config.FEAR_GREED_API, options);

        if (response.getResponseCode() !== 200) {
            Logger.log('❌ API取得失敗: ' + response.getResponseCode());
            return null;
        }

        const data = JSON.parse(response.getContentText());

        if (data.fear_and_greed) {
            const latest = data.fear_and_greed;
            return {
                value: parseInt(latest.score),
                classification: latest.rating,
                timestamp: latest.timestamp
            };
        }

        Logger.log('❌ 予期しないデータ形式');
        return null;

    } catch (e) {
        Logger.log('❌ Error: ' + e);
        return null;
    }
}

/**
 * 前回のデータを取得
 * @return {Object|null} 前回のデータまたはnull
 */
function getPreviousData() {
    const config = getConfig();
    const cache = CacheService.getScriptCache();
    const cached = cache.get(config.CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
}

/**
 * 現在のデータを保存
 * @param {Object} indexData - 保存する指数データ
 */
function saveCurrentData(indexData) {
    const config = getConfig();
    const cache = CacheService.getScriptCache();
    const dataToSave = {
        value: indexData.value,
        classification: indexData.classification,
        timestamp: indexData.timestamp,
        savedAt: new Date().toISOString()
    };
    // 6時間キャッシュ（GASの最大値）
    cache.put(config.CACHE_KEY, JSON.stringify(dataToSave), 21600);
}

/**
 * 閾値アラートをチェック
 * @param {number|null} previousValue - 前回の指数値
 * @param {number} currentValue - 現在の指数値
 * @return {string|null} アラートタイプ ('escape_fear', 'enter_fear') またはnull
 */
function checkThresholdAlert(previousValue, currentValue) {
    const config = getConfig();

    if (previousValue === null) return null;

    // 恐怖ゾーン脱出：20以下 → 21以上
    if (previousValue <= config.EXTREME_FEAR_THRESHOLD &&
        currentValue > config.EXTREME_FEAR_THRESHOLD) {
        return 'escape_fear';
    }

    // 恐怖ゾーン突入：21以上 → 20以下
    if (previousValue > config.EXTREME_FEAR_THRESHOLD &&
        currentValue <= config.EXTREME_FEAR_THRESHOLD) {
        return 'enter_fear';
    }

    return null;
}

/**
 * ゲージを作成（視覚的な指数表示）
 * @param {number} value - 指数値 (0-100)
 * @return {string} ゲージ文字列
 */
function createGauge(value) {
    const filled = Math.floor(value / 10);
    const empty = 10 - filled;
    return '🟩'.repeat(filled) + '⬜'.repeat(empty) + ` ${value}%`;
}

/**
 * ツイート文を作成
 * @param {Object} indexData - 指数データ {value, classification, timestamp}
 * @param {string|null} alertType - アラートタイプ ('escape_fear', 'enter_fear', null)
 * @return {string} ツイート文
 */
function createTweetText(indexData, alertType) {
    const value = indexData.value;
    const classification = indexData.classification;

    // 日本語の分類マッピング
    const classificationJp = {
        'extreme fear': '極度の恐怖 😱',
        'fear': '恐怖 😰',
        'neutral': '中立 😐',
        'greed': '欲望 😊',
        'extreme greed': '極度の欲望 🤑'
    };

    const gauge = createGauge(value);

    // アラート：恐怖ゾーン脱出
    if (alertType === 'escape_fear') {
        return `🚨 恐怖ゾーン脱出アラート！

CNN Fear & Greed Index が 20 を超えました 📈

📊 現在の指数: ${value}/100
😊 状態: ${classificationJp[classification] || classification}

${gauge}

株式市場の心理が改善傾向にあります

#FearAndGreedIndex #StockMarket #SP500 #恐怖ゾーン脱出`;
    }

    // アラート：恐怖ゾーン突入
    if (alertType === 'enter_fear') {
        return `🚨 恐怖ゾーン突入アラート！

CNN Fear & Greed Index が 20 以下になりました 📉

📊 現在の指数: ${value}/100
😱 状態: ${classificationJp[classification] || classification}

${gauge}

株式市場の心理が悪化しています。注意が必要です

#FearAndGreedIndex #StockMarket #SP500 #極度の恐怖`;
    }

    // 定期レポート
    return `🔔 CNN Fear & Greed Index（米国株式市場）

📊 指数: ${value}/100
😊 状態: ${classificationJp[classification] || classification}

${gauge}

#${classification.replace(/\s+/g, '')} #StockMarket #SP500 #FearAndGreedIndex`;
}

/**
 * X APIにツイート投稿
 * @param {string} tweetText - ツイート本文
 * @return {boolean} 投稿成功ならtrue、失敗ならfalse
 */
function postTweet(tweetText) {
    const config = getConfig();

    try {
        const url = 'https://api.twitter.com/2/tweets';
        const payload = JSON.stringify({ text: tweetText });

        // OAuth 1.0a署名を生成
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = Utilities.getUuid().replace(/-/g, '');

        const oauthParams = {
            oauth_consumer_key: config.API_KEY,
            oauth_nonce: nonce,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: timestamp,
            oauth_token: config.ACCESS_TOKEN,
            oauth_version: '1.0'
        };

        // 署名ベース文字列を作成
        const paramString = Object.keys(oauthParams)
            .sort()
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(oauthParams[key]))
            .join('&');

        const signatureBaseString = 'POST&' +
            encodeURIComponent(url) + '&' +
            encodeURIComponent(paramString);

        // 署名キー
        const signingKey = encodeURIComponent(config.API_SECRET) + '&' +
            encodeURIComponent(config.ACCESS_TOKEN_SECRET);

        // HMAC-SHA1署名
        const signature = Utilities.base64Encode(
            Utilities.computeHmacSignature(
                Utilities.MacAlgorithm.HMAC_SHA_1,
                signatureBaseString,
                signingKey
            )
        );

        oauthParams.oauth_signature = signature;

        // Authorizationヘッダー
        const authHeader = 'OAuth ' + Object.keys(oauthParams)
            .sort()
            .map(key => encodeURIComponent(key) + '="' + encodeURIComponent(oauthParams[key]) + '"')
            .join(', ');

        // リクエスト送信
        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: payload,
            headers: {
                'Authorization': authHeader
            },
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(url, options);
        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();

        Logger.log('Response Code: ' + responseCode);

        if (responseCode === 201) {
            const result = JSON.parse(responseText);
            Logger.log('✅ ツイート成功: ' + result.data.id);
            Logger.log('🔗 URL: https://twitter.com/i/web/status/' + result.data.id);
            return true;
        } else {
            Logger.log('❌ ツイート失敗 (' + responseCode + '): ' + responseText);

            // エラー詳細を解析
            try {
                const errorData = JSON.parse(responseText);
                if (errorData.errors) {
                    errorData.errors.forEach(err => {
                        Logger.log('  エラー: ' + err.message);
                    });
                }
            } catch (e) {
                // JSONパースできない場合はスキップ
            }

            return false;
        }
    } catch (e) {
        Logger.log('❌ ツイート失敗: ' + e);
        Logger.log('エラー詳細: ' + e.toString());
        return false;
    }
}