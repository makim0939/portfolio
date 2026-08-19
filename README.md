# まきむらのポートフォリオ

ちょっとした3DCGのギミックがあるWebサイトです。
自分のことや、これまでの成果物を紹介しています。

**[makimura.me](https://www.makimura.me)**

部屋の3Dモデルとアバターは自分でモデリングしたもので、時間帯によってページの色が変わります。
制作物とブログはMDXで書いていて、ブログにはZennの記事も混ぜて並べています。

盛り込みたい要素がたくさんあるので、これからも随時更新していきます。

## ディレクトリ構成

```
src/
├── app/          ページ（App Router）。sitemap・robotsもここ
├── components/
│   ├── 3d/       部屋・アバターなどThree.jsのコンポーネント
│   └── ui/       画面の部品
├── contents/     記事の本文（MDX）
├── hooks/
└── lib/          記事の読み込み、3Dの設定値、外部APIなど
```

## 開発者用備忘録
| 文書 | 内容 |
| --- | --- |
| [docs/authoring.md](docs/authoring.md) | 制作物・ブログ記事の追加方法 |
| [docs/contact.md](docs/contact.md) | コンタクトフォームの設定 |
