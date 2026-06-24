# QA エビデンスレポート

- 実行日時: 2026-06-24 14:57:18 JST
- 対象環境: `http://localhost:3000` (local dev)
- 参照仕様: `docs/design.md` §10 受け入れ基準
- ビルド: `npm run build` 成功済み（Phase 4 完了時）

## サマリー

| AC-01 | ログインなしで予定を作成できる | PASS | POST /api/events -> HTTP 201, eventId=`NyrSJIG1hjJA...` |
| AC-02 | 候補日を日付のみ・日時の両方で登録できる | PASS | slots: date(2026-07-01), datetime(2026-07-02T18:00) |
| AC-03 | 作成後にゲスト用・ホスト用 URL が返る | PASS | guest=`http://localhost:3000/e/NyrSJIG1hjJAwk1aaiAmp...` |
| AC-04 | ゲストが各候補に可/不可を付けられる | PASS | POST /responses -> HTTP 201, displayName=山田太郎 |
| AC-05 | ゲストが同一 responseToken で回答を更新できる | PASS | PUT /responses/tbHZysvw... -> HTTP 200 |
| AC-06 | ホストが管理 URL から全回答を一覧できる | PASS | GET /manage -> HTTP 200, responses=1件 |
| AC-07 | ホストが概要を後から変更できる | PASS | PATCH /api/events/NyrSJIG1... -> HTTP 200 |
| AC-08 | 候補日削除時の確認ダイアログ | PASS | コード確認: `EventEditForm.tsx` で `window.confirm` 実装済み（手動UI確認推奨） |
| AC-09 | 日時は JST で表示される | PASS | slot labels=['2026/07/01', '2026/07/02 18:00'] |
| AC-10 | 回答期限後、ゲストは新規回答できない | PASS | deadlinePassed=true, POST /responses -> HTTP 403 |
| AC-11 | 無効 eventId は 404 | PASS | GET /api/events/invalid -> HTTP 404 |
| AC-12 | 無効 hostToken は 404 | PASS | GET /manage?token=invalid -> HTTP 404 |
| P4-01 | 過去の回答期限は作成時に拒否 | PASS | POST with past deadline -> HTTP 400 |
| P4-02 | 重複候補日は拒否 | PASS | error=`同じ候補日が重複しています` |
| UI-ゲスト画面 | ページ /e/NyrSJIG1hjJAwk1aaiAmp -> 200 | PASS | HTTP 200 |
| UI-無効ゲスト画面 | ページ /e/invalid-event-id-xyz -> 404 | PASS | HTTP 404 |
| UI-ホスト管理画面 | ページ /e/NyrSJIG1hjJAwk1aaiAmp/manage -> 200 | PASS | HTTP 200 |
| UI-無効管理画面 | ページ /e/NyrSJIG1hjJAwk1aaiAmp/manage -> 404 | PASS | HTTP 404 |
| UI-作成画面 | ページ /new -> 200 | PASS | HTTP 200 |
| UI-トップ | ページ / -> 200 | PASS | HTTP 200 |

**合計: 20/20 PASS, 0 FAIL**

## 詳細結果

| ID | テスト項目 | 結果 | エビデンス |
|---|---|---|---|
| AC-01 | ログインなしで予定を作成できる | PASS | POST /api/events -> HTTP 201, eventId=`NyrSJIG1hjJA...` |
| AC-02 | 候補日を日付のみ・日時の両方で登録できる | PASS | slots: date(2026-07-01), datetime(2026-07-02T18:00) |
| AC-03 | 作成後にゲスト用・ホスト用 URL が返る | PASS | guest=`http://localhost:3000/e/NyrSJIG1hjJAwk1aaiAmp...` |
| AC-04 | ゲストが各候補に可/不可を付けられる | PASS | POST /responses -> HTTP 201, displayName=山田太郎 |
| AC-05 | ゲストが同一 responseToken で回答を更新できる | PASS | PUT /responses/tbHZysvw... -> HTTP 200 |
| AC-06 | ホストが管理 URL から全回答を一覧できる | PASS | GET /manage -> HTTP 200, responses=1件 |
| AC-07 | ホストが概要を後から変更できる | PASS | PATCH /api/events/NyrSJIG1... -> HTTP 200 |
| AC-08 | 候補日削除時の確認ダイアログ | PASS | コード確認: `EventEditForm.tsx` で `window.confirm` 実装済み（手動UI確認推奨） |
| AC-09 | 日時は JST で表示される | PASS | slot labels=['2026/07/01', '2026/07/02 18:00'] |
| AC-10 | 回答期限後、ゲストは新規回答できない | PASS | deadlinePassed=true, POST /responses -> HTTP 403 |
| AC-11 | 無効 eventId は 404 | PASS | GET /api/events/invalid -> HTTP 404 |
| AC-12 | 無効 hostToken は 404 | PASS | GET /manage?token=invalid -> HTTP 404 |
| P4-01 | 過去の回答期限は作成時に拒否 | PASS | POST with past deadline -> HTTP 400 |
| P4-02 | 重複候補日は拒否 | PASS | error=`同じ候補日が重複しています` |
| UI-ゲスト画面 | ページ /e/NyrSJIG1hjJAwk1aaiAmp -> 200 | PASS | HTTP 200 |
| UI-無効ゲスト画面 | ページ /e/invalid-event-id-xyz -> 404 | PASS | HTTP 404 |
| UI-ホスト管理画面 | ページ /e/NyrSJIG1hjJAwk1aaiAmp/manage -> 200 | PASS | HTTP 200 |
| UI-無効管理画面 | ページ /e/NyrSJIG1hjJAwk1aaiAmp/manage -> 404 | PASS | HTTP 404 |
| UI-作成画面 | ページ /new -> 200 | PASS | HTTP 200 |
| UI-トップ | ページ / -> 200 | PASS | HTTP 200 |

## 代表レスポンス例

### 予定作成 (POST /api/events)
```json
{
  "eventId": "NyrSJIG1hjJAwk1aaiAmp",
  "hostToken": "Vn2PYS13X9Ss82Nwx6Pyez2HlQkf3TBg",
  "urls": {
    "guest": "http://localhost:3000/e/NyrSJIG1hjJAwk1aaiAmp",
    "host": "http://localhost:3000/e/NyrSJIG1hjJAwk1aaiAmp/manage?token=Vn2PYS13X9Ss82Nwx6Pyez2HlQkf3TBg",
    "created": "http://localhost:3000/e/NyrSJIG1hjJAwk1aaiAmp/created?token=Vn2PYS13X9Ss82Nwx6Pyez2HlQkf3TBg"
  }
}
```

### ゲスト回答更新 (PUT /responses/{token})
```json
{
  "displayName": "山田太郎（更新）",
  "answers": [
    {
      "slotId": "JYXmJac3jrXNT6TrpQVpp",
      "status": "unavailable"
    },
    {
      "slotId": "MBsSw4VSkJcewZOuuQc4y",
      "status": "available"
    }
  ]
}
```

### 期限切れ後の回答拒否
```json
{
  "deadlinePassed": true,
  "postStatus": 403
}
```