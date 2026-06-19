# deploy

変更を `claudecode` ブランチにコミットして push する。

## ルール
- **必ず `claudecode` ブランチにのみコミット**すること。他のブランチへの push は禁止。
- コミットメッセージは日本語で変更内容を簡潔に記述する。

## 手順

1. 変更ファイルを確認:
```bash
git status
git diff
```

2. ステージングとコミット:
```bash
git add <変更ファイル>
git commit -m "変更内容の説明"
```

3. Push:
```bash
git push -u origin claudecode
```

push 後、PR が存在しない場合は自動的に draft PR を `dev` 向けに作成すること。
