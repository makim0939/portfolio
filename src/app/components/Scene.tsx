"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

export default function Scene() {
	return (
		<Canvas
			style={{
				height: "100vh",
				width: "100vw",
			}}
			camera={{ position: [0, 2.5, 2.5] }}
			shadows
		>
			<Suspense fallback={null}>
				<ambientLight position={[0, 5, 0]} intensity={1} />
				<pointLight position={[0, 5, 1]} intensity={10} />
				<AvatarPrototype />
			</Suspense>
		</Canvas>
	);
}
