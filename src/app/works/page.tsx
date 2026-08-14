import { Text } from "@/components/ui/Text";
import { WorksList } from "@/components/ui/WorksList";
import { getAllWorks } from "@/lib/works";

export default async function WorksPage() {
	const works = await getAllWorks();
	return (
		<main className=" min-h-[75vh] lg:max-w-6xl lg:m-auto ">
			<header>
				<Text variant="h1">制作物</Text>
			</header>
			<hr className="my-8" />
			<WorksList works={works} />
		</main>
	);
}
