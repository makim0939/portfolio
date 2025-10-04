export function makeSmooth(prev: number, current: number, factor: number) {
	return prev + (current - prev) * factor;
}
