/**
 * message.gs
 * Fear & Greed Index Bot - メッセージ生成（シンプル版）
 *
 * 投稿文を編集したい場合は、このファイルの各関数を直接編集してください
 */

/**
 * メッセージ生成（メイン関数）
 * @param {Object} indexData - 指数データ {value, classification, timestamp}
 * @param {string|null} alertType - アラートタイプ（'escape_fear', 'enter_fear', null）
 * @return {string} 投稿するメッセージ文
 */
function createMessage(indexData, alertType) {
  const value = indexData.value;
  const classification = indexData.classification;

  // ゲージ作成
  const gauge = createGauge(value);

  // 日本語の状態
  const statusJp = getStatusJapanese(classification);

  // アラート種類に応じてメッセージを返す
  if (alertType === 'escape_fear') {
    return createEscapeFearMessage(value, statusJp, gauge);
  }

  if (alertType === 'enter_fear') {
    return createEnterFearMessage(value, statusJp, gauge);
  }

  // 通常の定期レポート
  return createDailyReport(value, statusJp, gauge, classification);
}


// ========================================
// 投稿文のテンプレート（ここを編集する）
// ========================================

/**
 * 恐怖ゾーン脱出アラートの投稿文
 * 指数が 20以下 → 21以上 になった時に投稿
 */
function createEscapeFearMessage(value, statusJp, gauge) {
  return `🚨 恐怖ゾーン脱出アラート！

CNN Fear & Greed Index が 20 を超えました 📈

📊 現在の指数: ${value}/100
😊 状態: ${statusJp}

${gauge}

株式市場の心理が改善傾向にあります

#FearAndGreedIndex #StockMarket #SP500 #恐怖ゾーン脱出`;
}

/**
 * 恐怖ゾーン突入アラートの投稿文
 * 指数が 21以上 → 20以下 になった時に投稿
 */
function createEnterFearMessage(value, statusJp, gauge) {
  return `🚨 恐怖ゾーン突入アラート！

CNN Fear & Greed Index が 20 以下になりました 📉

📊 現在の指数: ${value}/100
😊 状態: ${statusJp}

${gauge}

株式市場の心理が悪化しています。注意が必要です

#FearAndGreedIndex #StockMarket #SP500 #極度の恐怖`;
}

/**
 * 定期レポートの投稿文
 * 毎日朝9時に投稿（アラートがない時）
 */
function createDailyReport(value, statusJp, gauge, classification) {
  return `🔔 CNN Fear & Greed Index（米国株式市場）

📊 指数: ${value}/100
😊 状態: ${statusJp}

${gauge}

#${classification.replace(/\s+/g, '')} #StockMarket #SP500 #FearAndGreedIndex`;
}


// ========================================
// サポート関数（通常は編集不要）
// ========================================

/**
 * ゲージを作成（視覚的な指数表示）
 * 例: 🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜ 50%
 */
function createGauge(value) {
  const filled = Math.floor(value / 10);
  const empty = 10 - filled;
  return '🟩'.repeat(filled) + '⬜'.repeat(empty) + ` ${value}%`;
}

/**
 * 英語の分類を日本語に変換
 */
function getStatusJapanese(classification) {
  const statusMap = {
    'extreme fear': '極度の恐怖 😱',
    'fear': '恐怖 😰',
    'neutral': '中立 😐',
    'greed': '欲望 😊',
    'extreme greed': '極度の欲望 🤑'
  };
  return statusMap[classification.toLowerCase()] || classification;
}