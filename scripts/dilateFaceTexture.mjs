/*
	顔テクスチャのUVの切れ目に出るグレーの線を消す。

	avatar_prototype.glb の Face マテリアルのテクスチャは、UVアイランドの外側が
	一様なグレー(#CCCCCC)のまま、ほとんど余白（パディング）を持っていない。
	頭部は正面に切れ目を入れた円盤としてUV展開されているので、アイランドの外周が
	そのまま顔の正面の切れ目になる。そこをバイリニア補間とミップマップが跨いで
	サンプリングするたび背景のグレーが混ざり、顔の中央に線として現れる。

	そこでUVの三角形が覆っていないテクセルを、最も近い覆われたテクセルの色で
	塗り潰す（いわゆるUVパディング／ダイレーション）。三角形の内側には一切
	触れないので見た目は変わらず、切れ目を跨いだサンプリングだけが肌色を拾う。

	背景色ではなく三角形の被覆で判定しているのは、背景に少しはみ出したブラシの跡が
	グレーとの中間色になっていて、色で見分けるとその中間色が外へ広がってしまうため。

	Blender から再エクスポートすると余白のない状態に戻るため、そのときは
	ベイク時のマージンを設定し直すか、このスクリプトを流し直すこと。

	使い方: node scripts/dilateFaceTexture.mjs
*/

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const GLB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../public/avatar_prototype.glb");
const MATERIAL_NAME = "Face";

// ---------------------------------------------------------------- PNG 入出力

const CRC_TABLE = (() => {
	const table = new Int32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c;
	}
	return table;
})();

function crc32(buf) {
	let c = 0xffffffff;
	for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

function paeth(a, b, c) {
	const p = a + b - c;
	const pa = Math.abs(p - a);
	const pb = Math.abs(p - b);
	const pc = Math.abs(p - c);
	if (pa <= pb && pa <= pc) return a;
	return pb <= pc ? b : c;
}

/** 8bit・非インターレースの PNG を生の画素列に展開する。 */
function decodePNG(buf) {
	let offset = 8;
	let header = null;
	const parts = [];
	while (offset < buf.length) {
		const length = buf.readUInt32BE(offset);
		const type = buf.toString("ascii", offset + 4, offset + 8);
		const body = buf.subarray(offset + 8, offset + 8 + length);
		if (type === "IHDR") header = body;
		else if (type === "IDAT") parts.push(body);
		offset += 12 + length;
	}

	const width = header.readUInt32BE(0);
	const height = header.readUInt32BE(4);
	const depth = header[8];
	const colorType = header[9];
	const interlace = header[12];
	const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
	if (depth !== 8 || interlace !== 0 || !channels) {
		throw new Error(
			`未対応の PNG です (depth=${depth}, colorType=${colorType}, interlace=${interlace})`,
		);
	}

	const raw = zlib.inflateSync(Buffer.concat(parts));
	const stride = width * channels;
	const data = Buffer.alloc(stride * height);
	let pos = 0;
	for (let y = 0; y < height; y++) {
		const filter = raw[pos++];
		const line = raw.subarray(pos, pos + stride);
		pos += stride;
		const row = data.subarray(y * stride, (y + 1) * stride);
		const prev = y > 0 ? data.subarray((y - 1) * stride, y * stride) : null;
		for (let x = 0; x < stride; x++) {
			const a = x >= channels ? row[x - channels] : 0;
			const b = prev ? prev[x] : 0;
			const c = prev && x >= channels ? prev[x - channels] : 0;
			let value = line[x];
			if (filter === 1) value += a;
			else if (filter === 2) value += b;
			else if (filter === 3) value += (a + b) >> 1;
			else if (filter === 4) value += paeth(a, b, c);
			row[x] = value & 0xff;
		}
	}
	return { width, height, channels, colorType, data };
}

function pngChunk(type, body) {
	const out = Buffer.alloc(body.length + 12);
	out.writeUInt32BE(body.length, 0);
	out.write(type, 4, "ascii");
	body.copy(out, 8);
	out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
	return out;
}

function encodePNG({ width, height, channels, colorType, data }) {
	const stride = width * channels;
	const raw = Buffer.alloc((stride + 1) * height);
	for (let y = 0; y < height; y++) {
		// フィルタは None 固定。可逆なので画素の値には影響しない
		raw[y * (stride + 1)] = 0;
		data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
	}
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header[8] = 8;
	header[9] = colorType;
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		pngChunk("IHDR", header),
		pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
		pngChunk("IEND", Buffer.alloc(0)),
	]);
}

// ---------------------------------------------------------------- GLB 入出力

const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

const COMPONENT = {
	5120: { array: Int8Array, size: 1 },
	5121: { array: Uint8Array, size: 1 },
	5122: { array: Int16Array, size: 2 },
	5123: { array: Uint16Array, size: 2 },
	5125: { array: Uint32Array, size: 4 },
	5126: { array: Float32Array, size: 4 },
};
const NUM_COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function readGLB(path) {
	const buf = readFileSync(path);
	let offset = 12;
	let json = null;
	let bin = null;
	while (offset < buf.length) {
		const length = buf.readUInt32LE(offset);
		const type = buf.readUInt32LE(offset + 4);
		const body = buf.subarray(offset + 8, offset + 8 + length);
		if (type === CHUNK_JSON) json = JSON.parse(body.toString("utf8"));
		else if (type === CHUNK_BIN) bin = body;
		offset += 8 + length;
	}
	return { json, bin };
}

function writeGLB(path, json, bin) {
	// チャンクは 4 バイト境界で終わる必要がある。JSON は空白、BIN は 0 で埋める
	const pad = (buf, fill) => {
		const remainder = buf.length % 4;
		return remainder === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - remainder, fill)]);
	};
	const jsonChunk = pad(Buffer.from(JSON.stringify(json), "utf8"), 0x20);
	const binChunk = pad(bin, 0);

	const header = Buffer.alloc(12);
	header.write("glTF", 0, "ascii");
	header.writeUInt32LE(2, 4);
	header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

	const chunkHeader = (length, type) => {
		const out = Buffer.alloc(8);
		out.writeUInt32LE(length, 0);
		out.writeUInt32LE(type, 4);
		return out;
	};

	writeFileSync(
		path,
		Buffer.concat([
			header,
			chunkHeader(jsonChunk.length, CHUNK_JSON),
			jsonChunk,
			chunkHeader(binChunk.length, CHUNK_BIN),
			binChunk,
		]),
	);
}

function readAccessor(json, bin, index) {
	const accessor = json.accessors[index];
	const view = json.bufferViews[accessor.bufferView];
	const component = COMPONENT[accessor.componentType];
	const count = NUM_COMPONENTS[accessor.type];
	const base = (view.byteOffset || 0) + (accessor.byteOffset || 0);
	const stride = view.byteStride || component.size * count;
	const out = new component.array(accessor.count * count);
	for (let i = 0; i < accessor.count; i++) {
		const start = bin.byteOffset + base + i * stride;
		out.set(
			new component.array(bin.buffer.slice(start, start + component.size * count)),
			i * count,
		);
	}
	return { data: out, count: accessor.count };
}

function bufferViewBytes(json, bin, index) {
	const view = json.bufferViews[index];
	return bin.subarray(view.byteOffset, view.byteOffset + view.byteLength);
}

/**
 * bufferView の中身を差し替える。長さが変わるので BIN を作り直し、
 * すべての bufferView の byteOffset を詰め直す。
 */
function replaceBufferView(json, bin, index, replacement) {
	const order = json.bufferViews
		.map((_, i) => i)
		.sort((a, b) => json.bufferViews[a].byteOffset - json.bufferViews[b].byteOffset);

	const chunks = [];
	let cursor = 0;
	for (const i of order) {
		const view = json.bufferViews[i];
		const body = i === index ? replacement : bufferViewBytes(json, bin, i);
		// アクセサはコンポーネントの大きさに揃っている前提なので 4 バイト境界に置く
		const padding = cursor % 4 === 0 ? 0 : 4 - (cursor % 4);
		if (padding > 0) {
			chunks.push(Buffer.alloc(padding, 0));
			cursor += padding;
		}
		view.byteOffset = cursor;
		view.byteLength = body.length;
		chunks.push(body);
		cursor += body.length;
	}

	json.buffers[0].byteLength = cursor;
	return Buffer.concat(chunks);
}

// ------------------------------------------------------------ UVパディング

/**
 * UVの三角形が少しでも重なるテクセルに印をつける。
 * バイリニア補間は三角形の縁のテクセルも読むので、取りこぼさないよう
 * テクセルの四隅と中心を見て、ひとつでも三角形に入っていれば被覆とみなす。
 */
function rasterizeCoverage(uv, indices, width, height) {
	const covered = new Uint8Array(width * height);
	const at = (i) => [uv.data[i * 2] * width, uv.data[i * 2 + 1] * height];
	const cross = (a, b, px, py) => (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);

	for (let t = 0; t < indices.count; t += 3) {
		const a = at(indices.data[t]);
		const b = at(indices.data[t + 1]);
		const c = at(indices.data[t + 2]);
		const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])) - 1);
		const maxX = Math.min(width - 1, Math.ceil(Math.max(a[0], b[0], c[0])) + 1);
		const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])) - 1);
		const maxY = Math.min(height - 1, Math.ceil(Math.max(a[1], b[1], c[1])) + 1);

		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				if (covered[y * width + x]) continue;
				// テクセル x が占めるのは [x, x+1] の範囲。その四隅と中心を試す
				for (let sy = 0; sy < 3 && !covered[y * width + x]; sy++) {
					for (let sx = 0; sx < 3; sx++) {
						const px = x + sx * 0.5;
						const py = y + sy * 0.5;
						const d1 = cross(a, b, px, py);
						const d2 = cross(b, c, px, py);
						const d3 = cross(c, a, px, py);
						// 3 つの符号が揃っていれば三角形の内側（縮退三角形は 0 が並ぶ）
						const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
						const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
						if (!(hasNegative && hasPositive)) {
							covered[y * width + x] = 1;
							break;
						}
					}
				}
			}
		}
	}
	return covered;
}

/**
 * 被覆されていないテクセルを、最も近い被覆テクセルの色で塗り潰す。
 * 被覆テクセルを種にした幅優先探索で、色の出どころを外へ運んでいく。
 */
function dilate(image, covered) {
	const { width, height, channels, data } = image;
	const pixels = width * height;

	const source = new Int32Array(pixels).fill(-1);
	let queue = [];
	for (let i = 0; i < pixels; i++) {
		if (covered[i]) {
			source[i] = i;
			queue.push(i);
		}
	}
	if (queue.length === 0) throw new Error("UVに覆われたテクセルがありません");

	while (queue.length > 0) {
		const next = [];
		for (const i of queue) {
			const x = i % width;
			const y = (i / width) | 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
					const n = ny * width + nx;
					if (source[n] !== -1) continue;
					source[n] = source[i];
					next.push(n);
				}
			}
		}
		queue = next;
	}

	// 種は書き換えないので、読み出し元が塗り替わることはない
	let filled = 0;
	for (let i = 0; i < pixels; i++) {
		if (source[i] === i) continue;
		data.copy(data, i * channels, source[i] * channels, (source[i] + 1) * channels);
		filled++;
	}
	return filled;
}

// ---------------------------------------------------------------- 実行

const { json, bin } = readGLB(GLB_PATH);

const materialIndex = json.materials.findIndex((m) => m.name === MATERIAL_NAME);
if (materialIndex < 0) throw new Error(`${MATERIAL_NAME} マテリアルが見つかりませんでした`);
const textureIndex = json.materials[materialIndex].pbrMetallicRoughness?.baseColorTexture?.index;
if (textureIndex === undefined)
	throw new Error(`${MATERIAL_NAME} マテリアルにベースカラーのテクスチャがありません`);
const image = json.images[json.textures[textureIndex].source];

const decoded = decodePNG(bufferViewBytes(json, bin, image.bufferView));

// 同じマテリアルを使うプリミティブすべてのUVを重ねて被覆を取る
const covered = new Uint8Array(decoded.width * decoded.height);
for (const mesh of json.meshes) {
	for (const primitive of mesh.primitives) {
		if (primitive.material !== materialIndex) continue;
		const uv = readAccessor(json, bin, primitive.attributes.TEXCOORD_0);
		const indices = readAccessor(json, bin, primitive.indices);
		const part = rasterizeCoverage(uv, indices, decoded.width, decoded.height);
		for (let i = 0; i < covered.length; i++) covered[i] ||= part[i];
	}
}

const filled = dilate(decoded, covered);
const rebuilt = replaceBufferView(json, bin, image.bufferView, encodePNG(decoded));
writeGLB(GLB_PATH, json, rebuilt);

console.log(
	`${image.name}: ${decoded.width}x${decoded.height} のうち ${filled} テクセルを余白として埋めました`,
);
