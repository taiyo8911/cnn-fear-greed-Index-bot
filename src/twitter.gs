/**
 * twitter.gs
 * Fear & Greed Index Bot - X投稿
 *
 * このファイルには以下が含まれます：
 * - X APIへのツイート投稿
 * - OAuth 1.0a署名生成
 * - レスポンス処理
 */

/**
 * X APIにツイート投稿（メイン関数）
 * @param {string} text - ツイート本文
 * @return {boolean} 投稿成功ならtrue、失敗ならfalse
 */
function postToTwitter(text) {
  const config = getConfig();
  const url = config.endpoints.twitterApi;
  const credentials = config.credentials;

  try {
    const payload = JSON.stringify({ text: text });
    const oauthParams = generateOAuthParams(credentials);
    const signature = generateOAuthSignature(url, oauthParams, credentials);

    oauthParams.oauth_signature = signature;

    const authHeader = buildAuthorizationHeader(oauthParams);
    const options = buildPostOptions(payload, authHeader);

    const response = UrlFetchApp.fetch(url, options);

    return handleResponse(response);

  } catch (e) {
    Logger.log('❌ ツイート失敗: ' + e);
    Logger.log('エラー詳細: ' + e.toString());
    return false;
  }
}

/**
 * OAuthパラメータを生成
 * @param {Object} credentials - API認証情報
 * @return {Object} OAuthパラメータ
 */
function generateOAuthParams(credentials) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Utilities.getUuid().replace(/-/g, '');

  return {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: credentials.accessToken,
    oauth_version: '1.0'
  };
}

/**
 * OAuth署名を生成
 * @param {string} url - APIエンドポイントURL
 * @param {Object} oauthParams - OAuthパラメータ
 * @param {Object} credentials - API認証情報
 * @return {string} 署名文字列
 */
function generateOAuthSignature(url, oauthParams, credentials) {
  // パラメータ文字列を作成
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(oauthParams[key]))
    .join('&');

  // 署名ベース文字列
  const signatureBaseString = 'POST&' +
    encodeURIComponent(url) + '&' +
    encodeURIComponent(paramString);

  // 署名キー
  const signingKey = encodeURIComponent(credentials.apiSecret) + '&' +
    encodeURIComponent(credentials.accessTokenSecret);

  // HMAC-SHA1署名
  const signature = Utilities.base64Encode(
    Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_1,
      signatureBaseString,
      signingKey
    )
  );

  return signature;
}

/**
 * Authorizationヘッダーを構築
 * @param {Object} oauthParams - OAuthパラメータ（署名含む）
 * @return {string} Authorizationヘッダー文字列
 */
function buildAuthorizationHeader(oauthParams) {
  return 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => encodeURIComponent(key) + '="' + encodeURIComponent(oauthParams[key]) + '"')
    .join(', ');
}

/**
 * 投稿リクエストオプションを構築
 * @param {string} payload - リクエストボディ
 * @param {string} authHeader - Authorizationヘッダー
 * @return {Object} リクエストオプション
 */
function buildPostOptions(payload, authHeader) {
  return {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    headers: {
      'Authorization': authHeader
    },
    muteHttpExceptions: true
  };
}

/**
 * APIレスポンスを処理
 * @param {Object} response - HTTPレスポンス
 * @return {boolean} 成功ならtrue
 */
function handleResponse(response) {
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
    logErrorDetails(responseText);
    return false;
  }
}

/**
 * エラー詳細をログ出力
 * @param {string} responseText - エラーレスポンス
 */
function logErrorDetails(responseText) {
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
}