"use client";
import { AvatarPrototype } from "@/app/assets/AvatarPrototype";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

export default function App() {
	return (
		<div className="App">
			<Canvas
				style={{
					height: "100vh",
					width: "100vw",
				}}
				camera={{ position: [0, 2.5, 2.5] }}
			>
				<Suspense fallback={null}>
					<ambientLight position={[0, 5, 0]} intensity={1} />
					<AvatarPrototype />
				</Suspense>
			</Canvas>
		</div>
	);
}
