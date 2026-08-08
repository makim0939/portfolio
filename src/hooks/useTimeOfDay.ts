"use client";
import { type TimeOfDay, getTimeOfDay, isTimeOfDay } from "@/lib/timeOfDay";
import { useEffect, useState } from "react";

const UPDATE_INTERVAL_MS = 60_000;

/**
 * 現在の時間帯を返す。1分ごとに見直すので、日付をまたいでも切り替わる。
 *
 * ページは静的に生成されるため、サーバ側では時刻を確定できない。初回は "day" を
 * 返してマウント後に実際の時間帯へ差し替える（ハイドレーションのずれを避けるため）。
 *
 * 動作確認用に `?time=night` のようなクエリで上書きできる。
 */
export function useTimeOfDay(): TimeOfDay {
	const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");

	useEffect(() => {
		const override = new URLSearchParams(window.location.search).get("time");
		if (isTimeOfDay(override)) {
			setTimeOfDay(override);
			return;
		}

		const update = () => setTimeOfDay(getTimeOfDay(new Date()));
		update();
		const id = setInterval(update, UPDATE_INTERVAL_MS);
		return () => clearInterval(id);
	}, []);

	return timeOfDay;
}
