import { useCallback, useEffect, useState } from "react";

export function useDoePermission() {
	const [doePermission, setDoePermission] = useState(false);

	const checkDoePermission = useCallback(() => {
		const DOE = DeviceOrientationEvent as any;
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
	if (!Object.hasOwn(DeviceOrientationEvent, "requestPermission")) {
		return {
			doePermission: null,
			checkDoePermission: () => {
				console.warn("requestPermission is not supported");
			},
		};
	}

	return { doePermission, checkDoePermission };
}
