import { makeSmooth } from "@/lib/animationTools";
import { is } from "@react-three/fiber/dist/declarations/src/core/utils";
import { useEffect, useRef, useState } from "react";

type MousePosition = {
	x: number;
	y: number;
};
export function useMousePos(isEnabled: boolean) {
	const targetPos = useRef<MousePosition>({ x: 0, y: 0 });
	const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });

	useEffect(() => {
		if (!isEnabled) return;
		const onMouseMove = (e: MouseEvent) => {
			const centerX = innerWidth / 2;
			const centerY = innerHeight / 2;

			targetPos.current = {
				x: (e.clientX - centerX) / innerWidth,
				y: (e.clientY - centerY) / innerHeight,
			};
		};

		window.addEventListener("mousemove", onMouseMove);

		let rafId: number;
		const update = () => {
			setMousePos((prev) => ({
				x: makeSmooth(prev.x, targetPos.current.x, 0.05),
				y: makeSmooth(prev.y, targetPos.current.y, 0.05),
			}));
			rafId = requestAnimationFrame(update);
		};

		update(); // ループ開始

		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			cancelAnimationFrame(rafId);
		};
	}, [isEnabled]);

	return mousePos;
}
