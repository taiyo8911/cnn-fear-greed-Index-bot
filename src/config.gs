// config.gs
// Fear & Greed Index Bot - 設定ファイル

//  このファイルには以下が含まれます：
//  - API認証情報の取得
//  - Bot設定値（閾値、エンドポイント等）

/**
 * 設定を取得
 * @return {Object} 設定オブジェクト
 */

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    // X API認証情報
    API_KEY: props.getProperty('X_API_KEY'),
    API_SECRET: props.getProperty('X_API_SECRET'),
    ACCESS_TOKEN: props.getProperty('X_ACCESS_TOKEN'),
    ACCESS_TOKEN_SECRET: props.getProperty('X_ACCESS_TOKEN_SECRET'),

    // Fear & Greed Index API
    FEAR_GREED_API: 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',

    // アラート設定
    EXTREME_FEAR_THRESHOLD: 20,  // 恐怖ゾーンの閾値

    // キャッシュキー
    CACHE_KEY: 'fear_greed_previous_data'
  };
}

/**
 * API認証情報を設定（初回セットアップ用）
 *
 * 使い方：
 * 1. この関数内の空文字列に実際のAPI認証情報を入力
 * 2. この関数を1回だけ実行
 * 3. 実行後はこの関数を削除またはコメントアウト推奨
 */
function setApiCredentials() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    'X_API_KEY': 'あなたのAPI Keyを入力',
    'X_API_SECRET': 'あなたのAPI Secretを入力',
    'X_ACCESS_TOKEN': 'あなたのAccess Tokenを入力',
    'X_ACCESS_TOKEN_SECRET': 'あなたのAccess Token Secretを入力'
  });
  Logger.log('✅ API認証情報を設定しました');
}