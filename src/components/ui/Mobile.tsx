import type React from "react";

export default function Mobile({ children }: { children: React.ReactNode }) {
	return <div className="block md:hidden">{children}</div>;
}
