# Game Friend Calendar

HTML/CSS/JavaScriptだけで作った、1人用のフレンド予定カレンダーです。
Supabaseに予定を保存するので、PCとスマホで同じ予定を見られます。

## ファイル構成

- `index.html`: 画面
- `styles.css`: 見た目
- `app.js`: カレンダー、ログイン、予定管理、通知
- `config.js`: Supabaseの接続情報
- `config.example.js`: 設定例
- `supabase.sql`: Supabaseに作るテーブルとセキュリティ設定
- `vercel.json`: Vercel用設定

## Supabase設定

1. Supabaseで新しいProjectを作成します。
2. SupabaseのSQL Editorを開きます。
3. `supabase.sql` の内容を貼り付けて実行します。
4. Project Settings > API から `Project URL` と `anon public key` を確認します。
5. `config.js` を開いて、次の2つを差し替えます。

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT_ID.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY"
};
```

6. Authentication > URL Configuration で、公開後のVercel URLをSite URLに設定します。

## ローカル確認

このフォルダで次のコマンドを実行します。

```powershell
python -m http.server 5173
```

ブラウザで `http://localhost:5173` を開きます。

## GitHub連携

GitHubで空のリポジトリを作成してから、このフォルダで次を実行します。

```powershell
git init
git add .
git commit -m "Initial calendar app"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPOSITORY.git
git push -u origin main
```

`YOUR_NAME` と `YOUR_REPOSITORY` は自分のGitHub情報に置き換えてください。

## Vercel公開

1. VercelにGitHubアカウントでログインします。
2. Add New Projectを選びます。
3. GitHubのこのリポジトリを選びます。
4. Framework PresetはOtherのままで公開します。

GitHubにpushすると、Vercelが自動で再公開します。
