"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import MyCamera from "./MyCamera";

export default function Scene() {
	return (
		<div className=" w-screen grow pb-16 md:absolute md:grow-0 md:h-screen md:top-0 md:left-0 md:-z-10">
			<Canvas shadows>
				<Suspense fallback={null}>
					<MyCamera />
					<ambientLight position={[0, 5, 0]} intensity={1} />
					<pointLight position={[0, 5, 1]} intensity={10} />
					<AvatarPrototype />
				</Suspense>
			</Canvas>
		</div>
	);
}
