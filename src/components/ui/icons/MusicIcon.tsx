type NavIconProps = React.SVGAttributes<SVGElement>;

export function MusicIcon({ ...props }: NavIconProps) {
	return (
		<svg
			width="32"
			height="32"
			viewBox="0 0 32 32"
			fill="#252528"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="music"
			{...props}
		>
			<path
				d="M13.5 6.6C13.5 6.2 13.8 5.9 14.2 5.8L25.6 3.1C26.1 3 26.6 3.4 26.6 3.9V6.1C26.6 6.5 26.3 6.8 25.9 6.9L15.6 9.3V22.5H13.5V6.6Z"
				fill="#252528"
			/>
			<path d="M24.5 6.9L26.6 6.4V19.5H24.5V6.9Z" fill="#252528" />
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M10.5 20.6C12.6 20.6 14.5 21.9 14.5 23.9C14.5 25.9 12.6 27.2 10.5 27.2C8.4 27.2 6.5 25.9 6.5 23.9C6.5 21.9 8.4 20.6 10.5 20.6ZM10.5 22.1C9.1 22.1 8 22.8 8 23.9C8 25 9.1 25.7 10.5 25.7C11.9 25.7 13 25 13 23.9C13 22.8 11.9 22.1 10.5 22.1Z"
				fill="#252528"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M21.6 17.6C23.7 17.6 25.6 18.9 25.6 20.9C25.6 22.9 23.7 24.2 21.6 24.2C19.5 24.2 17.6 22.9 17.6 20.9C17.6 18.9 19.5 17.6 21.6 17.6ZM21.6 19.1C20.2 19.1 19.1 19.8 19.1 20.9C19.1 22 20.2 22.7 21.6 22.7C23 22.7 24.1 22 24.1 20.9C24.1 19.8 23 19.1 21.6 19.1Z"
				fill="#252528"
			/>
		</svg>
	);
}
