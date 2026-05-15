# Game Friend Calendar

HTML/CSS/JavaScriptだけで作った、1人用のフレンド予定カレンダーです。
ログインなしで使えます。予定はその端末のブラウザ内に保存されます。

## ファイル構成

- `index.html`: 画面
- `styles.css`: 見た目
- `app.js`: カレンダー、予定管理、通知
- `vercel.json`: Vercel用設定

## できること

- 月間カレンダー
- 週間カレンダー
- 今日の予定
- 日付検索
- 予定の追加、編集、削除
- ブラウザを開いている間の通知

## 保存について

予定は `localStorage` に保存されます。
そのため、同じ端末の同じブラウザでは予定が残ります。

注意点:

- PCとスマホでは同期されません。
- 別のブラウザには予定は引き継がれません。
- ブラウザのデータを削除すると予定も消えます。

## ローカル確認

このフォルダで次のコマンドを実行します。

```powershell
python -m http.server 5173
```

ブラウザで `http://localhost:5173` を開きます。

## GitHubへの反映

変更したら、このフォルダで次を実行します。

```powershell
git add .
git commit -m "変更内容を書く"
git push
```

## Vercel公開

1. VercelにGitHubアカウントでログインします。
2. Add New Projectを選びます。
3. GitHubのこのリポジトリを選びます。
4. Framework PresetはOtherのままで公開します。

GitHubにpushすると、Vercelが自動で再公開します。
