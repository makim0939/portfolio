import { useCallback, useEffect, useState } from "react";

export function useDoePermission() {
	const [doePermission, setDoePermission] = useState(false);

	const checkDoePermission = useCallback(() => {
		const DOE = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
			requestPermission: () => Promise<"granted" | "denied" | "default">;
		};
		DOE.requestPermission().then(async (val: string) => {
			if (val === "granted") {
				setDoePermission(true);
			} else {
				setDoePermission(false);
			}
		});
	}, []);

	useEffect(() => {
		if (!Object.hasOwn(DeviceOrientationEvent, "requestPermission")) return;
		checkDoePermission();
	}, [checkDoePermission]);

	// requestPermissionが使えない場合は、nullを返す
	if (
		typeof window === "undefined" ||
		!("DeviceOrientationEvent" in window) ||
		!Object.hasOwn(window.DeviceOrientationEvent, "requestPermission")
	) {
		return {
			doePermission: null,
			checkDoePermission: () => {
				console.warn("requestPermission is not supported");
			},
		};
	}

	return { doePermission, checkDoePermission };
}
