# まきむらのポートフォリオ
ちょっとした3DCGのギミックがあるWebサイトです。\
自分のことや、これまでの成果物を紹介しています。\
[makimura.me](https://www.makimura.me)

盛り込みたい要素がたくさんあるので、これからも随時更新していきます。

## 記事や演奏を追加する

```bash
pnpm new:post
```

対話に答えると、frontmatterを埋めた `.mdx` と画像の置き場所ができます。
できた記事は下書き（`published: false`）なので、書き終えたら `true` にすると公開されます。

| | 記事 | 画像・動画 |
| --- | --- | --- |
| ブログ | `src/contents/blog` | `public/blog` |
| 演奏 | `src/contents/music` | `public/music` |
| 制作物 | `src/contents/works` | `public/works` |

ブログの `category` は `tech`（テック）・`dev`（開発日記）・`life`（日常）から選びます。
一覧ではZennの記事と混ざって新しい順に並び、このカテゴリで絞り込めます。

`thumbnail` を書かなかったブログ記事は、タイトルとカテゴリからサムネイルを作ります。
一覧のカードとSNSでシェアされたときのOGP画像は、どちらもこの画像になります。

演奏は `videoUrl` にYouTubeのURLを書きます。動画ファイルをこのリポジトリに置く場合は
`public/music` に入れて `video` にパスを書きます。
