"use client";
import React, { type ReactNode, useEffect, useRef, useState } from "react";

type FadeInContainerProps = {
	children: ReactNode;
	distance?: number;
	duration?: number;
	childrenDelay?: number;
} & React.HTMLAttributes<HTMLDivElement>;

export function FadeInContainer({
	children,
	distance = 16,
	duration = 250,
	childrenDelay = 100,
	...props
}: FadeInContainerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [visibleIndexes, setVisibleIndexes] = useState<Set<number>>(new Set());

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const index = Number(entry.target.getAttribute("data-index"));
					if (entry.isIntersecting) {
						setVisibleIndexes((prev) => new Set(prev).add(index));
					}
				}
			},
			{ threshold: 0.2 },
		);

		const childrenElements = containerRef.current?.children;
		if (childrenElements) {
			Array.from(childrenElements).forEach((child, index) => {
				child.setAttribute("data-index", index.toString());
				observer.observe(child);
			});
		}

		return () => {
			if (childrenElements) {
				Array.from(childrenElements).forEach((child, _) =>
					observer.unobserve(child),
				);
			}
		};
	}, []);

	const childArray = React.Children.toArray(children);

	return (
		<div ref={containerRef} {...props}>
			{childArray.map((child, index) => (
				<div
					//biome-ignore lint/suspicious/noArrayIndexKey:
					key={index} // 順番が固定かつid等の要素がないためkeyにindexを設定することを許す
					style={{
						opacity: visibleIndexes.has(index) ? 100 : 0,
						transform: visibleIndexes.has(index)
							? "translateY(0)"
							: `translateY(${distance}px)`,
						transitionDelay: `${index * childrenDelay}ms`,
						transitionDuration: `${duration}ms`,
						transitionTimingFunction: "ease-out",
					}}
				>
					{child}
				</div>
			))}
		</div>
	);
}
