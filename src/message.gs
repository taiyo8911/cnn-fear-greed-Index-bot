/**
 * messages.gs
 * Fear & Greed Index Bot - メッセージ生成
 *
 * このファイルには以下が含まれます：
 * - ツイート文の作成
 * - ゲージの生成
 * - 分類の日本語変換
 * - 日時フォーマット
 */

/**
 * メッセージ生成（メイン関数）
 * @param {Object} indexData - 指数データ {value, classification, timestamp}
 * @param {string|null} alertType - アラートタイプまたはnull
 * @return {string} メッセージ文
 */
function createMessage(indexData, alertType) {
  if (alertType) {
    return buildAlertMessage(indexData, alertType);
  } else {
    return buildReportMessage(indexData);
  }
}

/**
 * アラートメッセージを構築
 * @param {Object} indexData - 指数データ
 * @param {string} alertType - アラートタイプ
 * @return {string} アラートメッセージ
 */
function buildAlertMessage(indexData, alertType) {
  const config = getConfig();
  const template = config.messages.alerts[alertType];

  if (!template) {
    Logger.log('⚠️ 未定義のアラートタイプ: ' + alertType);
    return buildReportMessage(indexData);
  }

  const dateTime = formatDateTime();
  const value = indexData.value;
  const classificationJp = translateClassification(indexData.classification);
  const gauge = createGauge(value);

  return `${dateTime}
${template.title}

${template.description}

📊 現在の指数: ${value}/100
😊 状態: ${classificationJp}

${gauge}

${template.footer}

${template.hashtags}`;
}

/**
 * 定期レポートメッセージを構築
 * @param {Object} indexData - 指数データ
 * @return {string} レポートメッセージ
 */
function buildReportMessage(indexData) {
  const config = getConfig();
  const template = config.messages.report;

  const dateTime = formatDateTime();
  const value = indexData.value;
  const classificationJp = translateClassification(indexData.classification);
  const gauge = createGauge(value);

  return `${dateTime}
${template.title}

📊 指数: ${value}/100
😊 状態: ${classificationJp}

${gauge}

${template.hashtags}`;
}

/**
 * 日時を日本語形式でフォーマット
 * @return {string} フォーマット済み日時文字列（例: "11月22日(日) 8:48 現在"）
 */
function formatDateTime() {
  const now = new Date();

  // 日本時間に変換
  const jstOffset = 9 * 60; // JSTはUTC+9
  const jstTime = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);

  const month = jstTime.getMonth() + 1;
  const date = jstTime.getDate();
  const hours = jstTime.getHours();
  const minutes = jstTime.getMinutes();

  // 曜日を取得
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][jstTime.getDay()];

  // 分を2桁にフォーマット
  const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;

  return `${month}月${date}日(${dayOfWeek}) ${hours}:${minutesFormatted} 現在`;
}

/**
 * ゲージを作成（視覚的な指数表示）
 * @param {number} value - 指数値 (0-100)
 * @return {string} ゲージ文字列
 */
function createGauge(value) {
  const config = getConfig();
  const gaugeConfig = config.messages.gauge;

  const filled = Math.floor(value / 10);
  const empty = gaugeConfig.maxBars - filled;

  return gaugeConfig.filledSymbol.repeat(filled) +
         gaugeConfig.emptySymbol.repeat(empty) +
         ` ${value}%`;
}

/**
 * 分類を日本語に変換
 * @param {string} classification - 英語の分類名
 * @return {string} 日本語の分類名
 */
function translateClassification(classification) {
  const config = getConfig();
  const classifications = config.messages.classifications;

  const lowerClassification = classification.toLowerCase();
  return classifications[lowerClassification] || classification;
}