"use client";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useEffect } from "react";

/**
 * 現在の時間帯を <html data-time="..."> に反映するだけのコンポーネント。
 * 背景色そのものは globals.css の `:root[data-time="..."]` 側で定義している。
 */
export function TimeOfDayTheme() {
	const timeOfDay = useTimeOfDay();

	useEffect(() => {
		document.documentElement.dataset.time = timeOfDay;
	}, [timeOfDay]);

	return null;
}
