import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type WorkFront = {
	title: string;
	description?: string;
	slug: string;
	date: string; // YYYY-MM-DD
	thumbnail: string;
	coverImage: string;
	tags?: string[];
	published?: boolean;
};

export type Work = WorkFront & { body: string };

const WORKS_DIR = path.join(process.cwd(), "src", "contents", "works");

export async function getAllWorks(): Promise<Work[]> {
	const files = await fs.readdir(WORKS_DIR);
	const works: Work[] = [];
	for (const file of files) {
		if (!file.endsWith(".mdx")) continue;
		const raw = await fs.readFile(path.join(WORKS_DIR, file), "utf8");
		const { data, content } = matter(raw);
		const front = data as WorkFront;
		if (front.published === false) continue;
		works.push({ ...(front as WorkFront), body: content });
	}
	return works.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getWorkBySlug(slug: string): Promise<Work | undefined> {
	const all = await getAllWorks();
	return all.find((p) => p.slug === slug);
}
