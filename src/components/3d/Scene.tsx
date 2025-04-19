"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import MyCamera from "./MyCamera";

export default function Scene() {
	return (
		<div className=" w-screen h-[360px] md:h-[540px]">
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
