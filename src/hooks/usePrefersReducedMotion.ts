"use client";
import { useEffect, useState } from "react";

/**
 * OS の「視差効果を減らす」設定。
 *
 * サーバでは分からないので false から始め、マウント後に読み直す。演出を足す側の
 * 判定に使うので、初期値が false でも「まず動かない」方向には転ばない。
 */
export function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(query.matches);
		const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);

	return reduced;
}
