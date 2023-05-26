export const limitMaxCalls = <T extends any[], U>(
	fn: (...args: T) => U,
	maxCalls: number,
	name: string
) => {
	let calls = 0;

	return (...args: T): U => {
		calls++;

		if (calls > maxCalls) {
			return Promise.reject(
				new Error(
					`Maximum number of calls (${maxCalls}) to ${name} exceeded`
				)
			) as U;
		}

		return fn(...args);
	};
};
