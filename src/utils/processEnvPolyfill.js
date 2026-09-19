(function () {
	const gt = window;
	gt.process = gt.process || {};
	gt.process.env = gt.process.env || {};
	gt.process.env = { ...gt.global_env, ...gt.process.env };
})();
