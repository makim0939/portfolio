import type { SocialLogoProps } from "@/lib/socialLinks";

function XLogo({ fill, ...props }: SocialLogoProps) {
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
				d="M17.9209 14.0092L27.2543 3H25.0426L16.9384 12.5592L10.4656 3H3L12.7881 17.4551L3 29H5.21184L13.7701 18.9052L20.6058 29H28.0714L17.9204 14.0092H17.9209ZM14.8915 17.5825L13.8997 16.1431L6.0088 4.68958H9.40606L15.7741 13.9329L16.7659 15.3723L25.0436 27.3873H21.6464L14.8915 17.583V17.5825Z"
				fill={fill}
			/>
		</svg>
	);
}

export default XLogo;
