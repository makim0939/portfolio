type BodyTextProps = {
	children: React.ReactNode;
};

function BodyText({ children }: BodyTextProps) {
	return (
		<p className=" text-base md:text-xl leading-8 tracking-wider ">
			{children}
		</p>
	);
}

export default BodyText;
