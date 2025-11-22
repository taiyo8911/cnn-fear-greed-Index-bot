/**
 * messages.gs
 * Fear & Greed Index Bot - メッセージ生成
 *
 * このファイルには以下が含まれます：
 * - ツイート文の作成
 * - ゲージの生成
 * - 分類の日本語変換
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

  const value = indexData.value;
  const classificationJp = translateClassification(indexData.classification);
  const gauge = createGauge(value);

  return `${template.title}

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

  const value = indexData.value;
  const classificationJp = translateClassification(indexData.classification);
  const gauge = createGauge(value);
  const classification = indexData.classification;

  return `${template.title}

📊 指数: ${value}/100
😊 状態: ${classificationJp}

${gauge}

#${classification.replace(/\s+/g, '')} ${template.hashtags}`;
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