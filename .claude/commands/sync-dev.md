# sync-dev

`claudecode` ブランチを `dev` の最新に同期する。

```bash
git fetch origin
git merge origin/dev --no-edit
```

マージコンフリクトが発生した場合は内容を確認してから解決すること。
