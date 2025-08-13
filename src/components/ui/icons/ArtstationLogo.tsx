import type { SocialLogoProps } from "@/lib/socialLinks";

function ArtstationLogo({ fill, ...props }: SocialLogoProps) {
	return (
		<svg
			width="32"
			height="32"
			viewBox="0 0 32 32"
			fill={fill}
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="X logo"
			{...props}
		>
			<path
				d="M3 21.7806L5.18715 25.5943C5.62949 26.4611 6.51418 27.0554 7.52174 27.0554H22.0945L19.0718 21.7806H3Z"
				fill={fill}
			/>
			<path
				d="M28.9998 21.8055C28.9998 21.2854 28.8523 20.7901 28.582 20.3691L20.03 5.41156C19.5877 4.56958 18.7275 4 17.72 4H13.1982L26.3948 27.0307L28.4837 23.3904C28.8769 22.697 28.9998 22.3998 28.9998 21.8055Z"
				fill={fill}
			/>
			<path
				d="M16.9334 18.0164L11.06 7.73926L5.16211 18.0164H16.9334Z"
				fill={fill}
			/>
		</svg>
	);
}

export default ArtstationLogo;
