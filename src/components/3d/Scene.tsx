"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import MyCamera from "./MyCamera";
import { RoomPrototype } from "./RoomPrototype";

export default function Scene() {
	return (
		<div className=" w-full h-[480px] md:h-screen">
			<Canvas shadows orthographic>
				<Suspense fallback={null}>
					<MyCamera />
					<ambientLight position={[0, 5, 0]} intensity={1} />
					<pointLight position={[0, 5, 1]} intensity={10} />
					<AvatarPrototype />
					<RoomPrototype />
				</Suspense>
				<OrbitControls />
				<Stats />
			</Canvas>
		</div>
	);
}
