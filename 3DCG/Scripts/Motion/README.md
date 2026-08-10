# Motion

アバターのモーションを作る。マスターは `Objects/Avatar/Avatar.blend` で、
**モーションはこのファイルの中にアクションとして入っている**。

| アクション | 内容 |
|---|---|
| `PCWork` | PC作業。手で調整する用（1,721キー） |
| `PCWork_detailed` | 指の打鍵と手の微振動入り（4,287キー） |
| `Waving_Mixamo` | 手を振る（既存） |

## 手で調整する

`Armature` を選択 → ポーズモード → ドープシートを **Action Editor** にする。

| 用途 | ボーン |
|---|---|
| 手の位置・向き | `CTRL.hand.L` / `CTRL.hand.R` |
| 肘の向き | `CTRL.elbow.L` / `CTRL.elbow.R` |
| 足の位置・向き | `CTRL.foot.L` / `CTRL.foot.R` |
| 膝の向き | `CTRL.knee.L` / `CTRL.knee.R` |
| 全身の位置・前傾・重心 | `mixamorig:Hips` |
| 背中の丸まり | `mixamorig:Spine` 〜 `Spine2` |
| うなずき・首の遅れ | `mixamorig:Neck` / `Head` |

腕と脚は IK が支配しているので `LeftArm` などを直接回しても効かない。`CTRL.*` を動かす。

`CTRL.*` の location はボーンのレスト空間基準なので、N パネルに数値を直接打つと
直感と合わない。ビューポートで `G` / `R` を使うこと。

### PCWork の拍とフレーム（24fps・313フレーム＝13.03秒ループ）

| 秒 | フレーム | 内容 |
|---|---|---|
| 0〜1.4 | 1〜34 | 通常の打鍵 |
| 1.4〜2.6 | 34〜63 | うつむき |
| 10.75 | 259 | 伸びの予備動作 |
| 10.95〜11.40 | 263〜274 | 腕を前へ伸ばす |
| 11.40〜12.20 | 274〜293 | 伸ばしきりで保持 |
| 12.20〜12.70 | 293〜305 | 復帰 |

313フレーム目は1フレーム目と同じポーズ（ループを閉じるため）。

## 作り直す

```bash
BLENDER="/Applications/Blender 2.app/Contents/MacOS/Blender"
ASSETS="$HOME/Library/Mobile Documents/com~apple~CloudDocs/_MyDrive/_Projects/Development/Portfolio2025/3DCG"
"$BLENDER" --background "$ASSETS/Objects/Avatar/Avatar.blend" --python 3DCG/Scripts/Motion/build_typing.py
"$BLENDER" --background "$ASSETS/Objects/Avatar/Avatar.blend" --python 3DCG/Scripts/Motion/rig_controls.py
"$BLENDER" --background "$ASSETS/Objects/Avatar/Avatar.blend" --python 3DCG/Scripts/Motion/finalize_rig.py
"$BLENDER" --background "$ASSETS/Objects/Avatar/Avatar.blend" --python 3DCG/Scripts/Motion/polish.py
```

1. `build_typing.py` … `motions.py` の定義どおりにポーズを毎フレーム作って焼く
2. `rig_controls.py` … IK コントローラを付け、キーを Ramer-Douglas-Peucker で間引く
3. `finalize_rig.py` … `PCWork` と `PCWork_detailed` に分ける
4. `polish.py` … さらに間引く

`cleanup_rig.py` は重複した `CTRL.*` ボーンの掃除とコンストレイントの参照検査。

## 設計

`ref_signal.py` は参考動画（iCloud 側の `Reference/Motion/gogh-desk-work.mov`）から
頭部の重心をコマ単位で追跡した実測カーブ（30fps・391サンプル）。
揺れは単一の正弦波ではなく 1.45 / 1.86 / 2.61 / 4.34 秒の成分が重なっていたため、
手作りせず実測値をそのまま駆動信号として使っている。

`motions.py` の座標はすべて部屋の実測値。机の天板 z=0.80、座面 z=0.469 など。

## 注意

- **アーマチュアのオブジェクト変換を動かしてはいけない。** `Tops` / `Bottoms` / `Hair` は
  Armature に親子付けされておらずモディファイアだけで動くため、体と衣装がちぎれる。
  全身の移動は `pose_lib.place_via_hips()` で行う
- `rig_controls.py` を import すると副作用で走らないよう `if __name__ == "__main__":`
  で守っている。外すとコントロールボーンが二重に作られる
