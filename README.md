# CNN Fear & Greed Index Bot

CNN Fear & Greed Index（米国株式市場の恐怖と欲望指数）を自動投稿するBot  
Google Apps Script (GAS)で運用

---

## 📋 機能

### 🚨 アラート通知
- **恐怖ゾーン突入**: 指数が 21以上 → 20以下
- **恐怖ゾーン脱出**: 指数が 20以下 → 21以上

### 📊 定期レポート
- 毎日朝9時に自動投稿
- 視覚的なゲージ表示 🟩⬜

### 📈 週次レポート（新機能）
- 毎週土曜日朝10時に自動投稿
- 過去7日分の指数を横棒グラフで表示
- 日別の推移が一目で分かる

### 🔍 監視システム
- 1時間ごとに指数をチェック

---

## 📁 ファイル構成

```
src/
├── config.gs       # 設定の一元管理（閾値、メッセージテンプレート等）
├── api.gs          # Fear & Greed Index API取得
├── storage.gs      # データ保存・取得（キャッシュ＋週次データ管理）
├── alerts.gs       # アラート判定ロジック
├── messages.gs     # メッセージ生成・フォーマット（週次レポート含む）
├── twitter.gs      # X API投稿
├── main.gs         # メインロジック（オーケストレーション）
└── tests.gs         # テスト関数（週次レポートテスト含む）
```

### 各ファイルの役割

| ファイル | 責務 | 主な関数 |
|---------|------|---------|
| **config.gs** | 設定管理 | `getConfig()`, `setApiCredentials()` |
| **api.gs** | API通信 | `fetchFearGreedIndex()` |
| **storage.gs** | データ保存 | `loadPreviousData()`, `saveData()`, `saveWeeklyDataByDay()`, `loadWeeklyData()` |
| **alerts.gs** | アラート判定 | `checkAlerts()` |
| **messages.gs** | メッセージ生成 | `createMessage()`, `createWeeklyMessage()`, `createGauge()` |
| **twitter.gs** | X投稿 | `postToTwitter()` |
| **main.gs** | オーケストレーション | `checkAlert()`, `dailyReport()`, `weeklyReport()`, `testBot()` |
| **test.gs** | テスト | `runAllTests()`, `test7_WeeklyStorage()`, `test8_WeeklyMessage()` |

---

## 🚀 セットアップ手順

### 1. Google Apps Scriptプロジェクトの作成
1. [Google Apps Script](https://script.google.com/)にアクセス
2. 「新しいプロジェクト」を作成
3. `src/` フォルダ内の全ファイルをコピー＆ペースト

### 2. X API認証情報の設定
1. `config.gs` の `setApiCredentials()` 関数に認証情報を入力
2. `setApiCredentials()` を1回実行
3. 実行後、この関数は削除またはコメントアウト推奨

### 3. トリガーの設定
1. GASエディタで「トリガー」を開く
2. 以下の3つのトリガーを追加：

| 関数 | イベント | 時間 |
|-----|---------|------|
| `checkAlert` | 時間主導型 | 1時間ごと |
| `dailyReport` | 時間主導型 | 日タイマー 午前9時〜10時 |
| `weeklyReport` | 時間主導型 | 週タイマー 毎週土曜日 午前10時〜11時 |

---

## 🧪 テスト方法

### 基本テスト（投稿なし）
```javascript
testBot()  // 定期レポートのテスト
```

### 週次レポートテスト（投稿なし）
```javascript
testWeeklyReport()  // 週次レポートのプレビュー
```

### 実投稿テスト
```javascript
testRealPost()  // 実際にXに投稿（1回のみ実行推奨）
```

### データ確認
```javascript
debugShowCache()       // 日次データの確認
debugShowWeeklyData()  // 週次データの確認
```

### データクリア
```javascript
testClearCache()       // 日次データのクリア
testClearWeeklyData()  // 週次データのクリア
```

### すべてのテストを実行
```javascript
runAllTests()  // 全9種類のテストを実行
```

---

## 📊 週次レポートについて

### 投稿例
```
🔔 CNN Fear & Greed Index
今週の振り返り（11/18〜11/24）

日 ⬜️⬜⬜⬜⬜⬜⬜⬜⬜⬜ 06%
月 🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜ 10%
火 🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜ 10%
水 🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜ 10%
木 🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜ 10%
金 🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜ 10%
土 🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜ 20%

#米国株 #週間レポート
```

### データ蓄積の仕組み
- 毎日の定期レポート実行時に、その日のデータを曜日別に保存
- 日〜土の7曜日分のデータを個別に保存（PropertiesServiceを使用）
- 毎週同じ曜日に自動上書きされるため、古いデータ削除は不要

### 投稿条件
- 5日分以上のデータがある場合のみ投稿
- データが不足している場合はスキップ（ログに記録）
- Bot稼働開始後、最初の土曜日（7日未満）は投稿されません

### データ欠損時の表示
データが取得できなかった日は「-」と表示されます：
```
日 🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜ 10%
月 -
火 🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜ 20%
```

---

## 📊 データソース

CNN Fear & Greed Index: [CNN Business](https://edition.cnn.com/markets/fear-and-greed)

7つの指標から算出：
1. 株価モメンタム
2. 株価の強さ
3. 株価の幅
4. プット/コール比率
5. ジャンク債需要
6. 市場ボラティリティ（VIX）
7. セーフヘイブン需要

---

## ⚙️ カスタマイズ

### 閾値の変更
`config.gs` の `getAlertSettings()` 関数で変更：
```javascript
extremeFearThreshold: 20,  // この値を変更
```

### メッセージテンプレートの変更
`config.gs` の `getMessageTemplates()` 関数で変更：
```javascript
alerts: {
  escape_fear: {
    title: '🚨 恐怖ゾーン脱出アラート！',  // カスタマイズ可能
    // ...
  }
},
weekly: {
  title: '🔔 CNN Fear & Greed Index',  // 週次レポートのタイトル
  subtitle: '今週の振り返り',
  hashtags: '#米国株 #週間レポート'
}
```

### 週次レポートの最低データ数
`config.gs` の `getConstants()` 関数で変更：
```javascript
weekly: {
  minDataCount: 5  // この値を変更（5日分未満は投稿しない）
}
```

### ゲージ表示の変更
`config.gs` の `getMessageTemplates()` 関数で変更：
```javascript
gauge: {
  filledSymbol: '🟩',  // 塗りつぶし記号
  emptySymbol: '⬜',   // 空白記号
  maxBars: 10          // バー数
}
```

---

## 🔧 拡張例

### 新しいアラート条件を追加

1. **config.gs** で閾値を追加：
```javascript
getAlertSettings() {
  return {
    extremeFearThreshold: 20,
    greedThreshold: 75,  // 新規追加
    // ...
  };
}
```

2. **alerts.gs** で判定ロジックを追加：
```javascript
function determineAlertType(previousValue, currentValue, threshold) {
  // 既存のロジック...
  
  // 新しいアラート条件
  if (previousValue < 75 && currentValue >= 75) {
    return 'enter_greed';
  }
}
```

3. **config.gs** でメッセージテンプレートを追加：
```javascript
alerts: {
  // 既存のテンプレート...
  enter_greed: {
    title: '🚨 欲望ゾーン突入！',
    // ...
  }
}
```

---

## 🔒 セキュリティ

- API認証情報はスクリプトプロパティで管理
- `setApiCredentials()` 実行後は削除推奨
- 定期的にトークン更新推奨
- コードはGitHubなどに公開しないこと（認証情報が含まれる場合）

---

## 📱 X利用規約の遵守

✅ 有用な情報提供  
✅ 適度な投稿頻度（1日1〜3回程度）  
✅ プロフィールにBot明記推奨  
✅ スパム行為なし

---

## 🐛 トラブルシューティング

### 指数が取得できない
- APIエンドポイントが変更されていないか確認
- `api.gs` のログを確認

### 投稿できない
- API認証情報が正しいか確認
- X APIの利用制限に達していないか確認
- `twitter.gs` のログを確認

### アラートが発火しない
- キャッシュに前回データが保存されているか確認（`debugShowCache()`）
- 閾値設定が正しいか確認

### 週次レポートが投稿されない
- 週次データが5日分以上あるか確認（`debugShowWeeklyData()`）
- トリガーが正しく設定されているか確認
- ログで「データ不足」メッセージを確認

### 週次データが保存されない
- `dailyReport` のトリガーが正しく実行されているか確認
- PropertiesServiceの容量制限に達していないか確認
- ログで保存エラーを確認

---

## 📝 ログ確認方法

GASエディタで「実行ログ」を確認：
- ✅ 成功
- ❌ エラー
- ⚠️ 警告
- 🔍 デバッグ情報

---

## 🎉 バージョン履歴

### v2.0 - 週次レポート機能追加
- 毎週土曜日に過去7日分の指数をグラフ化して投稿
- 曜日別データ保存機能（PropertiesService使用）
- 週次レポート専用テスト関数追加

### v1.0 - 初版リリース
- アラート通知機能
- 定期レポート機能
- 1時間ごとの監視機能
