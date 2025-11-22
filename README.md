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

### 🔍 監視システム
- 1時間ごとに指数をチェック

---

## 📁 ファイル構成

```
src/
├── config.gs       # 設定の一元管理（閾値、メッセージテンプレート等）
├── api.gs          # Fear & Greed Index API取得
├── storage.gs      # データ保存・取得（キャッシュ管理）
├── alerts.gs       # アラート判定ロジック
├── messages.gs     # メッセージ生成・フォーマット
├── twitter.gs      # X API投稿
└── main.gs         # メインロジック（オーケストレーション）
```

### 各ファイルの役割

| ファイル | 責務 | 主な関数 |
|---------|------|---------|
| **config.gs** | 設定管理 | `getConfig()`, `setApiCredentials()` |
| **api.gs** | API通信 | `fetchFearGreedIndex()` |
| **storage.gs** | データ保存 | `loadPreviousData()`, `saveData()` |
| **alerts.gs** | アラート判定 | `checkAlerts()` |
| **messages.gs** | メッセージ生成 | `createMessage()`, `createGauge()` |
| **twitter.gs** | X投稿 | `postToTwitter()` |
| **main.gs** | オーケストレーション | `checkAlert()`, `dailyReport()`, `testBot()` |

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
2. 以下の2つのトリガーを追加：

| 関数 | イベント | 時間 |
|-----|---------|------|
| `checkAlert` | 時間主導型 | 1時間ごと |
| `dailyReport` | 時間主導型 | 日タイマー 午前9時〜10時 |

---

## 🧪 テスト方法

### テスト実行（投稿なし）
```javascript
testBot()
```
指数取得とアラート判定のみ。実際の投稿は行いません。

### 実投稿テスト
```javascript
testRealPost()
```
実際にXに投稿します（1回のみ実行推奨）。

### キャッシュクリア
```javascript
testClearCache()
```
保存されたデータをクリアします。

### キャッシュ確認
```javascript
debugShowCache()
```
現在のキャッシュ内容を表示します。

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

3. **messages.gs** でメッセージテンプレートを追加：
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

---

## 📝 ログ確認方法

GASエディタで「実行ログ」を確認：
- ✅ 成功
- ❌ エラー
- ⚠️ 警告
- 🔍 デバッグ情報
