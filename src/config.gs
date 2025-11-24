/**
 * config.gs
 * Fear & Greed Index Bot - 設定管理
 *
 * このファイルには以下が含まれます：
 * - API認証情報の取得
 * - アラート設定
 * - その他定数
 */

/**
 * 全設定を取得
 * @return {Object} 設定オブジェクト
 */
function getConfig() {
  return {
    // API認証情報
    credentials: getApiCredentials(),

    // エンドポイント
    endpoints: getEndpoints(),

    // アラート設定
    alerts: getAlertSettings(),

    // メッセージテンプレート
    messages: getMessageTemplates(),  // ← この行を追加

    // その他定数
    constants: getConstants()
  };
}

/**
 * API認証情報を取得
 * @return {Object} 認証情報
 */
function getApiCredentials() {
  const props = PropertiesService.getScriptProperties();
  return {
    apiKey: props.getProperty('X_API_KEY'),
    apiSecret: props.getProperty('X_API_SECRET'),
    accessToken: props.getProperty('X_ACCESS_TOKEN'),
    accessTokenSecret: props.getProperty('X_ACCESS_TOKEN_SECRET')
  };
}

/**
 * エンドポイント設定を取得
 * @return {Object} エンドポイント情報
 */
function getEndpoints() {
  return {
    fearGreedApi: 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
    twitterApi: 'https://api.twitter.com/2/tweets'
  };
}

/**
 * アラート設定を取得
 * @return {Object} アラート設定
 */
function getAlertSettings() {
  return {
    // 恐怖ゾーンの閾値（この値を変更するとアラート条件が変わります）
    extremeFearThreshold: 20,

    // 将来の拡張用（コメントアウト）
    // fearThreshold: 45,
    // greedThreshold: 55,
    // extremeGreedThreshold: 75,

    // アラートタイプの定義
    types: {
      ESCAPE_FEAR: 'escape_fear',
      ENTER_FEAR: 'enter_fear'
      // 将来の拡張用
      // ESCAPE_EXTREME_FEAR: 'escape_extreme_fear',
      // ENTER_GREED: 'enter_greed',
    }
  };
}

/**
 * その他定数を取得
 * @return {Object} 定数
 */
function getConstants() {
  return {
    // キャッシュキー
    cacheKey: 'fear_greed_previous_data',

    // キャッシュ有効期限（秒）
    cacheExpiration: 21600, // 6時間

    // ログプレフィックス
    logPrefix: {
      info: '✅',
      error: '❌',
      warning: '⚠️',
      debug: '🔍'
    }
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
    'X_API_KEY': '',
    'X_API_SECRET': '',
    'X_ACCESS_TOKEN': '',
    'X_ACCESS_TOKEN_SECRET': ''
  });
  Logger.log('✅ API認証情報を設定しました');
}

/**
 * メッセージテンプレートを取得
 * @return {Object} メッセージテンプレート
 */
function getMessageTemplates() {
  return {
    // 分類の日本語マッピング
    classifications: {
      'extreme fear': '極度の恐怖 😱',
      'fear': '恐怖 😰',
      'neutral': '中立 😐',
      'greed': '欲望 😊',
      'extreme greed': '極度の欲望 🤑'
    },

    // アラートメッセージのテンプレート
    alerts: {
      escape_fear: {
        title: '🚨 恐怖ゾーン脱出アラート！',
        description: 'CNN Fear & Greed Index が 20 を超えました 📈',
        footer: '株式市場の心理が改善傾向にあります',
        hashtags: '#米国株 #買い時'
      },
      enter_fear: {
        title: '🚨 恐怖ゾーン突入アラート！',
        description: 'CNN Fear & Greed Index が 20 以下になりました 📉',
        footer: '株式市場の心理が悪化しています。注意が必要です',
        hashtags: '米国株 #暴落'
      }
    },

    // 定期レポートのテンプレート
    report: {
      title: '🔔 CNN Fear & Greed Index（米国株式市場）',
      hashtags: '#米国株 #SP500'
    },

    // ゲージ設定
    gauge: {
      filledSymbol: '🟩',
      emptySymbol: '⬜',
      maxBars: 10
    }
  };
}