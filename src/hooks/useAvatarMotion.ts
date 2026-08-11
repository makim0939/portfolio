"use client";
import { type AvatarMotion, DEFAULT_AVATAR_MOTION, isAvatarMotion } from "@/lib/avatarMotion";
import { useEffect, useState } from "react";

function readMotionFromQuery(): AvatarMotion {
	if (typeof window === "undefined") return DEFAULT_AVATAR_MOTION;
	const override = new URLSearchParams(window.location.search).get("motion");
	return isAvatarMotion(override) ? override : DEFAULT_AVATAR_MOTION;
}

/**
 * 再生するモーションを返す。`?motion=wave` のようなクエリで選ぶ。
 *
 * 3Dの中身は DOM に出ないので、初期値をクライアントで読んでも
 * ハイドレーションのずれにはならない。
 */
export function useAvatarMotion(): AvatarMotion {
	const [motion, setMotion] = useState<AvatarMotion>(readMotionFromQuery);

	useEffect(() => {
		setMotion(readMotionFromQuery());
	}, []);

	return motion;
}
