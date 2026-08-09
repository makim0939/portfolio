"use client";
import { type TimeOfDay, getTimeOfDay, isTimeOfDay } from "@/lib/timeOfDay";
import { useEffect, useState } from "react";

const UPDATE_INTERVAL_MS = 60_000;

/**
 * 初期値。layout の head で timeOfDayInitScript が <html data-time="..."> を
 * 確定させているので、そこから読む。読めなければ自分で判定する。
 *
 * サーバ側では時刻が分からないので "day" を返すが、この値は DOM に出ないため
 * ハイドレーションのずれにはならない（3Dの光にしか効かない）。
 */
function readInitialTimeOfDay(): TimeOfDay {
	if (typeof document === "undefined") return "day";
	const fromDom = document.documentElement.dataset.time;
	if (isTimeOfDay(fromDom ?? null)) return fromDom as TimeOfDay;
	const override = new URLSearchParams(window.location.search).get("time");
	return isTimeOfDay(override) ? override : getTimeOfDay(new Date());
}

/**
 * 現在の時間帯を返す。1分ごとに見直すので、日付をまたいでも切り替わる。
 * 動作確認用に `?time=night` のようなクエリで上書きできる。
 */
export function useTimeOfDay(): TimeOfDay {
	const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(readInitialTimeOfDay);

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
