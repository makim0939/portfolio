import type React from "react";

export default function Desktop({ children }: { children: React.ReactNode }) {
	return <div className="hidden md:block">{children}</div>;
}
