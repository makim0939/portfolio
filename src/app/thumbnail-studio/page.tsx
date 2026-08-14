import { notFound } from "next/navigation";
import { ThumbnailStudio } from "./ThumbnailStudio";

/*
	サムネイルを作るための作業場。
	`pnpm dev` で開いてポーズや文字を決め、`pnpm thumbnail` がここを画像にする。
	読み物ではないので、公開するサイトには出さない。
*/
export default function ThumbnailStudioPage() {
	if (process.env.NODE_ENV === "production") notFound();
	return <ThumbnailStudio />;
}
