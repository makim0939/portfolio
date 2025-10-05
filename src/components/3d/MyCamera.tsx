"use client";
import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { useEffect } from "react";

export function MyCamera() {
	const { camera } = useThree();
	useEffect(() => {
		camera.position.set(-5, 3, 5);
		camera.lookAt(0, 1, 0);
	}, [camera]);
	return <PerspectiveCamera makeDefault zoom={1.2} />;
}
