import { useCallback, useEffect, useState } from "react";

export type PermissionResultType = "granted" | "denied" | "default" | "notSupported";

export function useDoePermission() {
	const [doePermission, setDoePermission] = useState<PermissionResultType | null>(null);

	const checkDoePermission = useCallback(() => {
		const DOE = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
			requestPermission: () => Promise<PermissionResultType>;
		};
		DOE.requestPermission()
			.then((val: PermissionResultType) => {
				setDoePermission(val);
			})
			.catch(() => {
				setDoePermission("default");
			});
	}, []);

	useEffect(() => {
		// DeviceOrientationに対応しているかどうかをチェックする。
		if (
			typeof window === "undefined" ||
			!("DeviceOrientationEvent" in window) ||
			!Object.hasOwn(window.DeviceOrientationEvent, "requestPermission")
		) {
			setDoePermission("notSupported");
		} else {
			checkDoePermission();
		}
	}, [checkDoePermission]);

	// DeviceOrientationEventに未対応の場合、checkDoePermissionは使えないようにする。
	if (doePermission === "notSupported")
		return {
			doePermission,
			checkDoePermission: () => {
				console.warn("requestPermission is not supported");
			},
		};
	return { doePermission, checkDoePermission };
}
