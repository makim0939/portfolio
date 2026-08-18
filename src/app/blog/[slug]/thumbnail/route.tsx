import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { BLOG_CATEGORIES } from "@/lib/blogCategories";
import { createOgpImage } from "@/lib/ogpImage";

export async function generateStaticParams() {
	const posts = await getAllPosts();
	return posts.filter((post) => !post.thumbnail).map((post) => ({ slug: post.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) return new Response("Not Found", { status: 404 });

	return createOgpImage({ title: post.title, label: BLOG_CATEGORIES[post.category] });
}
