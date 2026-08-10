# Scripts

Blender をコマンドラインで走らせる前提のスクリプト。配置ルールは
[ディレクトリ運用ルール.md](../ディレクトリ運用ルール.md) を参照。

アセット（`.blend`、テクスチャ、参考資料）はリポジトリではなく **iCloud Drive** にある。

```
~/Library/Mobile Documents/com~apple~CloudDocs/_MyDrive/_Projects/Development/Portfolio2025/3DCG/
```

場所は `lib/paths.py` が解決する。別の場所に置く場合は環境変数で差し替える。

```bash
BLENDER="/Applications/Blender 2.app/Contents/MacOS/Blender"   # PATH には入っていない
ASSETS="$HOME/Library/Mobile Documents/com~apple~CloudDocs/_MyDrive/_Projects/Development/Portfolio2025/3DCG"
# export PORTFOLIO_3DCG=/別の場所/3DCG   # 必要なら
```

## よく使うもの

### glb を書き出す

```bash
"$BLENDER" --background "$ASSETS/Objects/Avatar/Avatar.blend" --python 3DCG/Scripts/Export/export_avatar.py
"$BLENDER" --background "$ASSETS/Portfolio2025-Room.blend"    --python 3DCG/Scripts/Export/export_room.py
```

出力先は iCloud 側の `Out/`。サイトに反映するときは `public/` へコピーする。

環境変数で差し替えられる。

| 変数 | 対象 | 意味 |
|---|---|---|
| `AVATAR_GLB` | export_avatar | 出力先を変える |
| `ROOM_GLB` | export_room | 出力先を変える |
| `MOVE_CHAIR` | export_room | 椅子をノートPCの正面へ動かして書き出す |

### 書き出しが壊れていないか確かめる

```bash
"/Applications/Blender 2.app/Contents/Resources/4.4/python/bin/python3.11" \
  3DCG/Scripts/lib/glb_diff.py public/portfolio_room_1_1.glb "$ASSETS/Out/Tmp/room_check.glb"
```

ノード名・メッシュ頂点数・マテリアル名を突き合わせる。`--ignore-anim` でアニメーションを比較対象から外す。

**書き出し設定を変えるときは必ずこれを通すこと。** `export_apply` を有効にすると
`Tops` の SUBSURF や `ベッド掛け布団` の SOLIDIFY が焼き込まれて頂点数が変わり、
見た目が変わらないまま別物の glb ができる。

### オブジェクトを作り直す

```bash
"$BLENDER" --background --python 3DCG/Scripts/Objects/WallClock.py -- "$ASSETS/Out/wall_clock.glb"
"$BLENDER" --background --python 3DCG/Scripts/Objects/RoomWalls.py -- "$ASSETS/Out/room_walls.glb"
```

`Objects/Avatar.py` と `Objects/Eucalyptus.py` はマスターを
切り出したときの記録。マスターができた今は通常使わない。

## モーション

作り方と調整の手順は [Motion/README.md](Motion/README.md) を参照。

## 構成

| 場所 | 中身 |
|---|---|
| `lib/paths.py` | ディレクトリ位置の定義。絶対パスはここだけに書く |
| `lib/pose_lib.py` | ボーン操作、自前の2ボーンIK |
| `lib/preview_lib.py` | プレビュー描画、コレクションの有効化 |
| `lib/glb_diff.py` | glb の構造比較 |
| `lib/fix_image_paths.py` | 壊れた画像パスの繋ぎ直し |
| `Objects/` | オブジェクトを生成・抽出するスクリプト |
| `Motion/` | モーションの定義とリグ整備 |
| `Export/` | glb 書き出し |
