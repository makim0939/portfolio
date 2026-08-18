"use client";
import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect } from "react";

export function MyCamera() {
	const { camera } = useThree();
	// 描画の前に置き場所を決める。useEffect だと、その1フレームだけ既定の
	// 位置（原点）から見た絵を描いてしまう
	useLayoutEffect(() => {
		camera.position.set(-5, 3, 5);
		camera.lookAt(0, 1, 0);
	}, [camera]);
	return <PerspectiveCamera makeDefault zoom={1.2} />;
}
