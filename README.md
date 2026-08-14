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
| ブログ | `src/contents/blog` | `public/blog/<記事の名前>` |
| 制作物 | `src/contents/works` | `public/works/thumbnail`、`public/works/products` |

どちらも `category` で一覧を絞り込めます。

- ブログ … `tech`（テック）・`dev`（開発日記）・`life`（日常）
- 制作物 … `software`（ソフトウェア）・`cg`（CG）・`music`（音楽）

ブログの一覧はZennの記事と混ざって新しい順に並びます。Zennの記事は `tech` として扱われます。

`thumbnail` を書かなかったブログ記事は、タイトルとカテゴリからサムネイルを作ります。
一覧のカードとSNSでシェアされたときのOGP画像は、どちらもこの画像になります。

演奏などYouTubeに置いた制作物は、`videoUrl` にURLを書きます。上部の大きな画像の代わりに
プレイヤーが主役になり、サムネイルもYouTubeのものを使います。
