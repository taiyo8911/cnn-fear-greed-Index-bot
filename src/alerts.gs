/**
 * alerts.gs
 * Fear & Greed Index Bot - アラート判定
 *
 * このファイルには以下が含まれます：
 * - アラート条件のチェック
 * - 閾値越え判定
 * - アラートタイプの決定
 */

/**
 * アラート判定（メイン関数）
 * @param {number|null} previousValue - 前回の指数値
 * @param {number} currentValue - 現在の指数値
 * @return {string|null} アラートタイプまたはnull
 */
function checkAlerts(previousValue, currentValue) {
  if (previousValue === null || typeof currentValue === 'undefined') {
    return null;
  }

  const config = getConfig();
  const threshold = config.alerts.extremeFearThreshold;

  return determineAlertType(previousValue, currentValue, threshold);
}

/**
 * アラートタイプを決定
 * @param {number} previousValue - 前回の指数値
 * @param {number} currentValue - 現在の指数値
 * @param {number} threshold - 閾値
 * @return {string|null} アラートタイプまたはnull
 */
function determineAlertType(previousValue, currentValue, threshold) {
  const config = getConfig();
  const types = config.alerts.types;

  // 恐怖ゾーン脱出: threshold以下 → threshold超え
  if (previousValue <= threshold && currentValue > threshold) {
    return types.ESCAPE_FEAR;
  }

  // 恐怖ゾーン突入: threshold超え → threshold以下
  if (previousValue > threshold && currentValue <= threshold) {
    return types.ENTER_FEAR;
  }

  return null;
}

/**
 * 閾値越えをチェック（汎用関数）
 * 将来の拡張用
 * @param {number} previousValue - 前回の値
 * @param {number} currentValue - 現在の値
 * @param {number} threshold - 閾値
 * @param {string} direction - 'up'（上昇）または 'down'（下降）
 * @return {boolean} 閾値を越えたらtrue
 */
function checkThresholdCross(previousValue, currentValue, threshold, direction) {
  if (direction === 'up') {
    // 閾値を下から上に越えた
    return previousValue <= threshold && currentValue > threshold;
  } else if (direction === 'down') {
    // 閾値を上から下に越えた
    return previousValue > threshold && currentValue <= threshold;
  }
  return false;
}

/**
 * 変化率をチェック（将来の拡張用）
 * @param {number} previousValue - 前回の値
 * @param {number} currentValue - 現在の値
 * @param {number} changeThreshold - 変化率の閾値（%）
 * @return {boolean} 変化率が閾値を超えたらtrue
 */
function checkChangeRate(previousValue, currentValue, changeThreshold) {
  if (previousValue === 0) return false;

  const changeRate = Math.abs((currentValue - previousValue) / previousValue * 100);
  return changeRate >= changeThreshold;
}