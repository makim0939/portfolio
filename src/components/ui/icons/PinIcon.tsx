type PinIconProps = React.SVGAttributes<SVGElement>;

export function PinIcon({ ...props }: PinIconProps) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="pin"
			{...props}
		>
			<path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2Z" />
		</svg>
	);
}
