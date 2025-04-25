import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

type CardProps = {
	children?: React.ReactNode;
	className?: string;
};

function Card({ children, className }: CardProps) {
	return (
		<div
			className={twMerge(
				" @container p-5 md:p-12 border-2 border-neutral-100 rounded-xl shadow-lg ",
				className,
			)}
		>
			<div className=" flex flex-col @2xl:flex-row justify-center items-center  gap-4 md:gap-16 w-full">
				{children}
			</div>
		</div>
	);
}

type CardCoverProps = {
	src: string | StaticImport;
};

function CardCover({ src }: CardCoverProps) {
	return (
		<div className=" @2xl:flex-row ">
			<Image
				src={src}
				width={512}
				height={320}
				alt="Card Cover"
				className=" aspect-[8/5] @2xl:aspect-[4/3] object-cover "
			/>
		</div>
	);
}

type CardContentsProps = {
	children: React.ReactNode;
	className?: string;
};

function CardContents({ children, className }: CardContentsProps) {
	return <div className={twMerge(" @2xl:w-3/5 ", className)}>{children}</div>;
}

export { Card, CardCover, CardContents };
