import { useEffect, useState } from "react";

type DeviceType = "android" | "iosUnder13" | "iosOver13" | "other";

export function useDeviceType() {
	const [deviceType, setDeviceType] = useState<DeviceType>("other");
	useEffect(() => {
		const getDeviceType = (): "android" | "iosUnder13" | "iosOver13" | "other" => {
			const ua = navigator.userAgent;
			if (ua.indexOf("Android") > 0) return "android";
			if (ua.indexOf("iPhone") > 0) {
				if (!/iPhone OS ([1-9]_|1[0-2]_)/.test(ua)) return "iosOver13";
				return "iosUnder13";
			}
			return "other";
		};
		const deviceType = getDeviceType();
		setDeviceType(deviceType);
	}, []);
	return deviceType;
}
