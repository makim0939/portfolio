/**
 * トップページの3Dが読む glb のパス。
 *
 * これらは client のコードが動き出してから初めて取りに行くと出遅れるので、
 * トップページの HTML に <link rel="preload"> を置いて先に走らせている。
 * サーバコンポーネントから参照できるよう、client のコンポーネントではなくここに置く。
 */

export const ROOM_GLB = "/portfolio_room_1_2.glb";
export const AVATAR_GLB = "/avatar_prototype.glb";

/** 先読みしておくもの。並び順がそのまま取得を始める順になる。 */
export const SCENE_GLBS = [ROOM_GLB, AVATAR_GLB] as const;
