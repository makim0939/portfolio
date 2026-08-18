import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const run = promisify(execFile);

/** 書き出し先に使うので、フォルダ名として安全な形だけ通す */
const SAFE_SLUG = /^[a-z0-9][a-z0-9-]*$/;

/*
	作業場の「書き出す」ボタンの受け口。
	撮影そのものはコマンドと同じスクリプトに任せていて、ここは受け渡しだけする。
	作るための道具なので、公開するサイトには出さない。
*/
export async function POST(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return new NextResponse(null, { status: 404 });
	}

	const { slug, query } = await request.json();

	if (typeof slug !== "string" || !SAFE_SLUG.test(slug)) {
		return NextResponse.json(
			{ message: "記事の名前は英小文字・数字・ハイフンで書いてください。" },
			{ status: 400 },
		);
	}
	if (typeof query !== "string") {
		return NextResponse.json({ message: "指定が読み取れませんでした。" }, { status: 400 });
	}

	try {
		// 引数は配列で渡すので、シェルを通らない
		const { stdout } = await run(
			"node",
			[
				path.join(process.cwd(), "scripts", "shoot-thumbnail.mjs"),
				"--slug",
				slug,
				"--query",
				query,
			],
			{ cwd: process.cwd(), timeout: 60000 },
		);
		return NextResponse.json({ message: stdout.trim() });
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ message: `書き出せませんでした: ${detail}` }, { status: 500 });
	}
}
