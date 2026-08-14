# まきむらのポートフォリオ

ちょっとした3DCGのギミックがあるWebサイトです。
自分のことや、これまでの成果物を紹介しています。

**[makimura.me](https://www.makimura.me)**

部屋の3Dモデルとアバターは自分でモデリングしたもので、時間帯によってページの色が変わります。
制作物とブログはMDXで書いていて、ブログにはZennの記事も混ぜて並べています。

盛り込みたい要素がたくさんあるので、これからも随時更新していきます。

## 使っているもの

| | |
| --- | --- |
| フレームワーク | Next.js（App Router）・React・TypeScript |
| 3D | Three.js・React Three Fiber・drei（モデルはBlenderで作成） |
| スタイル | Tailwind CSS |
| 記事 | MDX（`next-mdx-remote`）+ frontmatter |
| 整形・検査 | Biome |
| 部品の確認 | Storybook |

## 動かす

```bash
pnpm install
pnpm dev
```

[https://localhost:3000](https://localhost:3000) で開きます。
開発サーバは自己署名の証明書で HTTPS を張るため、ブラウザに一度警告が出ます。

| コマンド | すること |
| --- | --- |
| `pnpm dev` | 開発サーバを起動する |
| `pnpm build` | 本番用にビルドする |
| `pnpm lint` | 整形と静的検査をかける（`pnpm check` で自動修正） |
| `pnpm storybook` | Storybookを起動する |

## ディレクトリ

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

記事を書くときの手順は [docs/authoring.md](docs/authoring.md) にまとめています。
