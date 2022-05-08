const isScreenSmall = () => {
	const res = window.matchMedia('screen and (max-width: 39.9375em)').matches
	return res
}

export default isScreenSmall