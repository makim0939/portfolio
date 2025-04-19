import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { useEffect } from "react";

export default function MyCamera() {
	const { camera } = useThree();
	useEffect(() => {
		camera.position.set(0, 2, 3);
		camera.lookAt(0, 1, 0);
	}, [camera]);
	return <PerspectiveCamera makeDefault position={[0, 1.5, 3]} />;
}
