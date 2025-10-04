import { makeSmooth } from "@/lib/animationTools";
import { useEffect, useState } from "react";

type DeviceOrientation = {
	alpha: number;
	beta: number;
	gamma: number;
};

export function useDeviceOrientation() {
	const [orientation, setOrientation] = useState<DeviceOrientation>({
		alpha: 0,
		beta: 0,
		gamma: 0,
	});

	useEffect(() => {
		const handleOrientation = (event: DeviceOrientationEvent) => {
			const orientation = {
				alpha: event.alpha ?? 0,
				beta: event.beta ?? 0,
				gamma: event.gamma ?? 0,
			};
			setOrientation((prev) => ({
				alpha: makeSmooth(prev.alpha, orientation.alpha, 0.05),
				beta: makeSmooth(prev.beta, orientation.beta, 0.05),
				gamma: makeSmooth(prev.gamma, orientation.gamma, 0.05),
			}));
		};

		window.addEventListener("deviceorientation", handleOrientation, true);
		return () => {
			window.removeEventListener("deviceorientation", handleOrientation);
		};
	}, []);

	return orientation;
}
