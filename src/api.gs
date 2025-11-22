/**
 * api.gs
 * Fear & Greed Index Bot - API通信
 *
 * このファイルには以下が含まれます：
 * - Fear & Greed Index APIからのデータ取得
 * - APIレスポンスのパース
 * - エラーハンドリング
 */

/**
 * Fear & Greed Indexを取得
 * @return {Object|null} 指数データ {value, classification, timestamp} または null
 */
function fetchFearGreedIndex() {
  const config = getConfig();
  const apiUrl = config.endpoints.fearGreedApi;

  try {
    const response = UrlFetchApp.fetch(apiUrl, buildRequestOptions());

    if (response.getResponseCode() !== 200) {
      Logger.log('❌ API取得失敗: ' + response.getResponseCode());
      return null;
    }

    return parseApiResponse(response.getContentText());

  } catch (e) {
    Logger.log('❌ API Error: ' + e);
    return null;
  }
}

/**
 * APIリクエストオプションを構築
 * @return {Object} リクエストオプション
 */
function buildRequestOptions() {
  return {
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
}

/**
 * APIレスポンスをパース
 * @param {string} responseText - APIレスポンステキスト
 * @return {Object|null} パース済みデータまたはnull
 */
function parseApiResponse(responseText) {
  try {
    const data = JSON.parse(responseText);

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
    Logger.log('❌ JSONパースエラー: ' + e);
    return null;
  }
}