const PAUSE_THRESHOLD = 2048;
const RESUME_THRESHOLD = 0;
let FixedQueue;

exports.getReadlineIterable = function getReadlineIterable(readable) {
	if (!FixedQueue) {
		FixedQueue = require('./lib/fixed_queue');
	}
	return {
		[Symbol.asyncIterator]() {
			if (!FixedQueue) {
				FixedQueue = require('internal/fixed_queue');
			}
			const queue = new FixedQueue();
			let done = false;
			let error;
			let queueSize = 0;
			const onError = (value) => {
				readable.off('close', onClose);
				readable.off('line', onLine);
				error = value;
			};
			const onClose = () => {
				readable.off('error', onError);
				readable.off('line', onLine);
				done = true;
			};
			const onLine = (value) => {
				queue.push(value);
				queueSize++;
				if (queueSize >= PAUSE_THRESHOLD) {
					readable.pause();
				}
			};
			readable.on('line', onLine);
			readable.once('error', onError);
			readable.once('close', onClose);

			const next = () => {
				if (error) {
					throw error;
				}
				if (!queue.isEmpty()) {
					const value = queue.shift();
					queueSize--;
					if (queueSize < RESUME_THRESHOLD) {
						readable.resume();
					}
					return {
						value,
					};
				} else if (done) {
					return { done };
				}
				readable.resume();
				return new Promise((resolve, reject) => {
					const onErrorOnce = (promiseError) => {
						readable.off('close', onCloseOnce);
						readable.off('line', onLineOnce);
						reject(promiseError);
					};
					const onCloseOnce = () => {
						readable.off('error', onErrorOnce);
						readable.off('line', onLineOnce);
						resolve({ done: true });
					};
					const onLineOnce = () => {
						readable.off('close', onCloseOnce);
						readable.off('error', onErrorOnce);
						setImmediate(() => resolve(next()));
					};
					readable.once('line', onLineOnce);
					readable.once('error', onErrorOnce);
					readable.once('close', onCloseOnce);
				});
			};

			return {
				next,
			};
		},
	};
};
