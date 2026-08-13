"use client";
/*
アバターの出現演出（issue #41）。

出し方は3つあり、/poc/drop-in のパネルで見比べられる。既定は popUp。

- popUp（既定）… 足元でぺしゃんこに潰れた状態から、ぴょこんと立ち上がる。
    家具が「落ちて一度跳ねる」のと同じスクワッシュ＆ストレッチの語彙で、
    行きすぎてから戻る跳ね方も家具のバウンドと揃えてある。足元にほこりが舞う。
- materialize … 足元から上へ光が走り、通り過ぎた高さから実体化する。
    見栄えはするが、手作りの部屋に対して転送装置の語彙が硬く、世界観からは浮く。
- drop … 家具と同じに落とす。座ったポーズのまま降ってくるので人形に見える。
*/

import {
	DropIn,
	type DropInRuntime,
	dropInElapsed,
	useDropInRuntime,
} from "@/components/3d/DropIn";
import { useAvatarMotion } from "@/hooks/useAvatarMotion";
import { AVATAR_PLACEMENTS } from "@/lib/avatarMotion";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * 行きすぎの強さ。1.7 で潰れ具合の 1 割ほど伸びすぎてから戻る。
 * 家具のバウンドと同じで、一度だけ行きすぎて収まる。
 */
const POP_UP_OVERSHOOT = 1.7;

/** 縦に潰れたぶん横に広がる強さ。0 で体積無視、0.5 で体積保存に近い。 */
const SQUASH_STRENGTH = 0.35;

/** 横の広がりの上限と下限。人の形が崩れて見えない範囲に抑える。 */
const SQUASH_LIMIT = { min: 0.92, max: 1.3 };

/** 足元に舞うほこりの数。 */
const DUST_COUNT = 24;

/** ほこりの色。床と家具の暖色に寄せた、少しくすんだ白。 */
const DUST_COLOR = "#e6ded2";

/** ほこりが外へ広がる距離と、舞い上がる高さ（メートル）。 */
const DUST_SPREAD = 0.34;
const DUST_LIFT = 0.16;

/** 光の色。部屋が暖色なので、寒色に寄せすぎず白に近い水色にしてある。 */
const GLOW_COLOR = "#bfe3ff";

/**
 * 実体化の境目のぼかし幅（メートル）。
 * 狭いと SF の転送装置のような硬い線になるので、部屋の雰囲気に合わせて広め。
 */
const EDGE_WIDTH = 0.14;

/** 走査面のまわりに散らす粒の数。 */
const SPARK_COUNT = 90;

/** 実体化しながら少しだけせり上がる量（メートル）。完全に静止しているより生っぽい。 */
const RISE = 0.1;

/** 走査面の光の輪の半径。アバターの肩幅より少し大きい程度。 */
const RING_RADIUS = 0.32;

/** ディゾルブを止めるための、頭よりずっと上の値。 */
const REVEAL_DONE = 1e4;

type RevealUniforms = {
	uRevealY: { value: number };
	uEdgeWidth: { value: number };
	uEdgeColor: { value: THREE.Color };
	/** 走査面はアバターの足元を原点とする座標で決めるので、そこへ戻す行列。 */
	uWorldToLocal: { value: THREE.Matrix4 };
};

/**
 * 既存のマテリアルに走査面のディゾルブを差し込む。
 *
 * 見た目（色・粗さ・影の受け方）は元のまま使いたいので、シェーダを書き直さずに
 * onBeforeCompile でチャンクの前後に足している。頂点側では走査面と比べる高さを、
 * 断片側では走査面より上の破棄と、境目の発光を足す。
 *
 * 高さを modelMatrix ではなくアバターのローカル座標で測るのは、部屋がマウスで
 * 傾くため。ワールドの Y で測ると、部屋を傾けたときに走査面がアバターに対して
 * 斜めに入ってしまう。
 */
function patchForReveal(material: THREE.Material, uniforms: RevealUniforms) {
	material.onBeforeCompile = (shader) => {
		Object.assign(shader.uniforms, uniforms);

		shader.vertexShader = shader.vertexShader
			.replace(
				"#include <common>",
				`#include <common>
				varying float vRevealY;
				uniform mat4 uWorldToLocal;`,
			)
			// project_vertex の直前なら、スキニングまで済んだ transformed が使える
			.replace(
				"#include <project_vertex>",
				`vRevealY = (uWorldToLocal * modelMatrix * vec4(transformed, 1.0)).y;
				#include <project_vertex>`,
			);

		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				`#include <common>
				varying float vRevealY;
				uniform float uRevealY;
				uniform float uEdgeWidth;
				uniform vec3 uEdgeColor;`,
			)
			// 色が出揃った最後に、走査面より上を捨てて境目を光らせる
			.replace(
				"#include <dithering_fragment>",
				`#include <dithering_fragment>
				float revealDepth = uRevealY - vRevealY;
				if (revealDepth < 0.0) discard;
				gl_FragColor.rgb = mix(uEdgeColor, gl_FragColor.rgb, smoothstep(0.0, uEdgeWidth, revealDepth));`,
			);
	};
	material.needsUpdate = true;
}

/** 走査は勢いよく始まって頭のあたりで落ち着く。 */
function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

/**
 * 1 を一度だけ行きすぎてから戻る補間。家具のバウンドと同じ「一度だけ跳ねる」形。
 * t=0 で 0、t=1 でちょうど 1 になる。
 */
function easeOutBack(t: number): number {
	const c = POP_UP_OVERSHOOT;
	return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

/**
 * 走査する高さの範囲を、いまのポーズのアバターから測る。
 *
 * SkinnedMesh.computeBoundingBox はボーンを効かせた頂点で測ってくれるので、
 * 座っているときは座った高さが返る。geometry.boundingBox の方はバインドポーズ
 * （立ち姿）のままなので、そちらで測ると座っていても頭ひとつ分ぶん無駄に走査して
 * しまい、実体化が終わったあとも光だけ上り続けることになる。
 *
 * 全頂点を舐めるので毎フレームは回さない。実体化が始まる一度だけ呼ぶ。
 */
function measureRange(group: THREE.Group, root: THREE.Object3D): { from: number; to: number } {
	const bounds = new THREE.Box3();
	root.updateWorldMatrix(true, true);
	const toLocal = new THREE.Matrix4().copy(root.matrixWorld).invert();

	group.traverse((object) => {
		const mesh = object as THREE.SkinnedMesh;
		if (!mesh.isMesh) return;

		if (mesh.isSkinnedMesh) mesh.computeBoundingBox();
		else if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();

		const box = (mesh.isSkinnedMesh ? mesh.boundingBox : mesh.geometry.boundingBox)?.clone();
		if (box) bounds.union(box.applyMatrix4(mesh.matrixWorld).applyMatrix4(toLocal));
	});

	return bounds.isEmpty() ? { from: 0, to: 1.8 } : { from: bounds.min.y, to: bounds.max.y };
}

export function AvatarAppear({ children }: { children: ReactNode }) {
	const runtime = useDropInRuntime();
	// Provider が無ければ演出なし。トップページはこちらを通る
	if (!runtime) return <>{children}</>;
	if (runtime.avatarAppearance === "drop") return <DropIn objectKey="avatar">{children}</DropIn>;
	if (runtime.avatarAppearance === "materialize")
		return <AvatarMaterialize runtime={runtime}>{children}</AvatarMaterialize>;
	return <AvatarPopUp runtime={runtime}>{children}</AvatarPopUp>;
}

/**
 * 足元で潰れた状態から、ぴょこんと立ち上がる。
 *
 * 伸び縮みの中心は部屋の原点ではなく足元でなければならない。原点で拡大すると
 * 部屋の隅から寄ってくるように見えてしまう。立ち位置ぶん動かしたグループを
 * 拡大し、その中で同じぶん戻すことで、足を床に着けたまま伸ばしている。
 *
 * マテリアルには触らないので、実体化の方と違って複製も後始末もいらない。
 */
function AvatarPopUp({ runtime, children }: { runtime: DropInRuntime; children: ReactNode }) {
	const root = useRef<THREE.Group>(null);
	const pivot = useRef<THREE.Group>(null);
	const dust = useRef<THREE.Points>(null);

	// 伸び縮みの中心。モーションで立ち位置が変わるので追従させる
	const center = AVATAR_PLACEMENTS[useAvatarMotion()].position;

	// ほこりの飛ぶ向きと勢い。毎フレーム位置だけ動かす
	const dustSeeds = useMemo(
		() =>
			Array.from({ length: DUST_COUNT }, () => ({
				angle: Math.random() * Math.PI * 2,
				reach: 0.5 + Math.random() * 0.5,
				lift: 0.3 + Math.random() * 0.7,
			})),
		[],
	);
	const dustPositions = useMemo(() => new Float32Array(DUST_COUNT * 3), []);

	useFrame(() => {
		const rootGroup = root.current;
		if (!rootGroup) return;

		const elapsed = dropInElapsed(runtime, "avatar");
		// 出番が来るまでは丸ごと出さない
		if (elapsed < 0) {
			rootGroup.visible = false;
			return;
		}
		rootGroup.visible = true;

		const duration = runtime.params.popUpDuration;
		const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

		// 縦に伸びる。一度 1 を行きすぎてから戻る
		const start = runtime.params.popUpSquash;
		const stretch = start + (1 - start) * easeOutBack(progress);
		// 縦が縮んだぶん横に広がる。潰れているときほど太く、伸び切ったときは細く
		const squash = THREE.MathUtils.clamp(
			stretch ** -SQUASH_STRENGTH,
			SQUASH_LIMIT.min,
			SQUASH_LIMIT.max,
		);
		pivot.current?.scale.set(squash, stretch, squash);

		// 足元のほこり。立ち上がりの前半で外へ広がって舞い上がり、消える
		if (dust.current) {
			const puff = Math.min(progress / 0.6, 1);
			dust.current.visible = puff < 1;
			const spread = DUST_SPREAD * easeOutCubic(puff);
			dustSeeds.forEach((seed, index) => {
				const radius = 0.04 + spread * seed.reach;
				dustPositions[index * 3] = Math.cos(seed.angle) * radius;
				// 舞い上がってから落ちてくるので、山なりの高さにする
				dustPositions[index * 3 + 1] = DUST_LIFT * seed.lift * Math.sin(puff * Math.PI);
				dustPositions[index * 3 + 2] = Math.sin(seed.angle) * radius;
			});
			dust.current.geometry.attributes.position.needsUpdate = true;
			setOpacity(dust.current, (1 - puff) * 0.5);
		}
	});

	return (
		<group ref={root} visible={false}>
			{/* 立ち位置へ移してから拡大し、中で同じぶん戻す。足元を中心に伸び縮みする */}
			<group ref={pivot} position={[center[0], 0, center[2]]}>
				<group position={[-center[0], 0, -center[2]]}>{children}</group>
			</group>

			{/* 床すれすれ。加算合成にしないので、光ではなく舞うほこりに見える */}
			<group position={[center[0], 0.01, center[2]]}>
				<points ref={dust}>
					<bufferGeometry>
						<bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
					</bufferGeometry>
					<pointsMaterial
						color={DUST_COLOR}
						size={0.035}
						sizeAttenuation
						transparent
						opacity={0}
						depthWrite={false}
					/>
				</points>
			</group>
		</group>
	);
}

function AvatarMaterialize({ runtime, children }: { runtime: DropInRuntime; children: ReactNode }) {
	const root = useRef<THREE.Group>(null);
	const content = useRef<THREE.Group>(null);
	const scanRing = useRef<THREE.Mesh>(null);
	const floorRing = useRef<THREE.Mesh>(null);
	const sparks = useRef<THREE.Points>(null);
	const glow = useRef<THREE.PointLight>(null);

	// 光の輪や粒を出す水平位置。アバターはモーションで立ち位置が変わるので追従させる
	const effectCenter = AVATAR_PLACEMENTS[useAvatarMotion()].position;

	const uniforms = useMemo<RevealUniforms>(
		() => ({
			uRevealY: { value: -1 },
			uEdgeWidth: { value: EDGE_WIDTH },
			uEdgeColor: { value: new THREE.Color(GLOW_COLOR) },
			uWorldToLocal: { value: new THREE.Matrix4() },
		}),
		[],
	);

	/** 走査する高さの範囲。実体化が始まる瞬間に、そのときのポーズから測る。 */
	const range = useRef({ from: 0, to: 1.8 });
	/** どの再生ぶんを測ったか。再生し直すとポーズも変わりうるので測り直す。 */
	const measuredFor = useRef<DropInRuntime | null>(null);

	// マテリアルはGLTFのキャッシュと共有されているので、複製してから差し込む。
	// 元のまま書き換えると、同じモデルを別の場所で使ったときにも効いてしまう。
	useLayoutEffect(() => {
		const group = content.current;
		if (!group) return;

		const patched: THREE.Material[] = [];
		group.traverse((object) => {
			const mesh = object as THREE.Mesh;
			if (!mesh.isMesh) return;

			const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
			const material = source.clone();
			patchForReveal(material, uniforms);
			mesh.material = material;
			patched.push(material);
		});

		return () => {
			for (const material of patched) material.dispose();
		};
	}, [uniforms]);

	// 粒の配置。角度と半径と走査面からのずれを固定しておいて、毎フレーム高さだけ動かす
	const sparkSeeds = useMemo(
		() =>
			Array.from({ length: SPARK_COUNT }, () => ({
				angle: Math.random() * Math.PI * 2,
				radius: 0.08 + Math.random() * 0.3,
				offset: (Math.random() - 0.5) * 0.4,
				speed: 0.3 + Math.random() * 0.7,
			})),
		[],
	);
	const sparkPositions = useMemo(() => new Float32Array(SPARK_COUNT * 3), []);

	useFrame(() => {
		const rootGroup = root.current;
		if (!rootGroup) return;

		const elapsed = dropInElapsed(runtime, "avatar");
		// 出番が来るまでは丸ごと出さない
		if (elapsed < 0) {
			rootGroup.visible = false;
			return;
		}
		rootGroup.visible = true;

		// 出番が来た最初のフレームで、いまのポーズの高さを測る
		if (measuredFor.current !== runtime && content.current) {
			range.current = measureRange(content.current, rootGroup);
			measuredFor.current = runtime;
		}

		const duration = runtime.params.materializeDuration;
		const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
		const eased = easeOutCubic(progress);
		const done = progress >= 1;

		// 走査面。ぼかし幅ぶん余分に上げて、最後に頭のてっぺんまで出し切る
		const { from, to } = range.current;
		const revealY = from + (to - from + EDGE_WIDTH) * eased;
		uniforms.uRevealY.value = done ? REVEAL_DONE : revealY;
		// R3F は useFrame のあとに行列を更新するので、ここで自分の分だけ先に確定させる
		rootGroup.updateWorldMatrix(true, false);
		uniforms.uWorldToLocal.value.copy(rootGroup.matrixWorld).invert();

		if (content.current) content.current.position.y = -RISE * (1 - eased);

		// 走査面の輪。実体化と一緒に上がり、上がりきる前に消える
		if (scanRing.current) {
			scanRing.current.visible = !done;
			scanRing.current.position.y = revealY;
			const swell = 1 + 0.25 * Math.sin(progress * Math.PI);
			scanRing.current.scale.setScalar(swell);
			setOpacity(scanRing.current, Math.min(progress * 12, 1) * (1 - progress * progress));
		}

		// 床の輪。始まった瞬間だけ広がって消える
		if (floorRing.current) {
			const burst = Math.min(elapsed / Math.max(duration * 0.4, 0.001), 1);
			floorRing.current.visible = burst < 1;
			floorRing.current.scale.setScalar(0.3 + burst * 1.7);
			setOpacity(floorRing.current, (1 - burst) * 0.7);
		}

		// 粒。走査面のまわりに散らして、上へ流す
		if (sparks.current) {
			sparks.current.visible = !done;
			sparkSeeds.forEach((seed, index) => {
				sparkPositions[index * 3] = Math.cos(seed.angle) * seed.radius;
				sparkPositions[index * 3 + 1] = revealY + seed.offset + seed.speed * progress * 0.4;
				sparkPositions[index * 3 + 2] = Math.sin(seed.angle) * seed.radius;
			});
			sparks.current.geometry.attributes.position.needsUpdate = true;
			setOpacity(sparks.current, Math.min(progress * 8, 1) * (1 - progress));
		}

		// 走査面の高さで弱く光らせて、まわりの家具にも演出を波及させる
		if (glow.current) {
			glow.current.visible = !done;
			glow.current.position.y = revealY;
			glow.current.intensity = Math.sin(progress * Math.PI) * 1.2;
		}
	});

	return (
		<group ref={root} visible={false}>
			<group ref={content}>{children}</group>

			{/*
				光はアバターの足元から出したいが、立ち位置を持っているのは
				AvatarPrototype の内側なので、ここでも同じ値を引いて真下に合わせる。
				高さは走査面が持つので、ここで指定するのは水平位置だけ。
			*/}
			<group position={[effectCenter[0], 0, effectCenter[2]]}>
				<mesh ref={scanRing} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[RING_RADIUS * 0.8, RING_RADIUS, 64]} />
					<meshBasicMaterial
						color={GLOW_COLOR}
						transparent
						opacity={0}
						depthWrite={false}
						side={THREE.DoubleSide}
						blending={THREE.AdditiveBlending}
					/>
				</mesh>

				{/* 床すれすれ。床とぶつかってちらつかないよう少しだけ浮かせてある */}
				<mesh ref={floorRing} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[RING_RADIUS * 0.75, RING_RADIUS, 64]} />
					<meshBasicMaterial
						color={GLOW_COLOR}
						transparent
						opacity={0}
						depthWrite={false}
						side={THREE.DoubleSide}
						blending={THREE.AdditiveBlending}
					/>
				</mesh>

				<points ref={sparks}>
					<bufferGeometry>
						<bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
					</bufferGeometry>
					<pointsMaterial
						color={GLOW_COLOR}
						size={0.022}
						sizeAttenuation
						transparent
						opacity={0}
						depthWrite={false}
						blending={THREE.AdditiveBlending}
					/>
				</points>

				<pointLight ref={glow} color={GLOW_COLOR} intensity={0} distance={2.5} decay={2} />
			</group>
		</group>
	);
}

/** マテリアルの型を絞るのが本筋ではないので、透明度の書き換えはここにまとめる。 */
function setOpacity(object: THREE.Mesh | THREE.Points, opacity: number) {
	const material = object.material as THREE.Material;
	material.opacity = opacity;
}
