import { useEffect, useState } from "react";

export function useResponsiveBreakpoint() {
	const [breakpoint, setBreakpoint] = useState<"none" | "md" | "lg">("none");

	useEffect(() => {
		const updateBreakpoint = () => {
			let result = "none" as "none" | "md" | "lg";
			if (window.matchMedia("(min-width: 768px)").matches) {
				result = "md";
			}
			if (window.matchMedia("(min-width: 1024px)").matches) {
				result = "lg";
			}
			setBreakpoint(result);
		};

		updateBreakpoint();
		window.addEventListener("resize", updateBreakpoint);

		return () => {
			window.removeEventListener("resize", updateBreakpoint);
		};
	}, []);

	return breakpoint;
}
