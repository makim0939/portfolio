"use client";
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { useEffect } from "react";

export default function MyCamera() {
	const { camera } = useThree();
	useEffect(() => {
		camera.position.set(-3, 3, 3);
		camera.lookAt(0, 10, 0);
	}, [camera]);
	return <PerspectiveCamera makeDefault />;
}
