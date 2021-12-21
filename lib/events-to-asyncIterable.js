const PAUSE_THRESHOLD = 2048;
const RESUME_THRESHOLD = 1;
const ITEM_EVENTS = ['data'];
const CLOSE_EVENTS = ['close', 'end'];
const ERROR_EVENTS = ['error'];

let FixedQueue;
function waitNext(emitter, next, events) {
	return new Promise((resolve, reject) => {
		const resolveNext = () => {
			events.forEach((event) => emitter.off(event, resolveNext));
			setImmediate(() => {
				try {
					resolve(next());
				} catch (promiseError) {
					reject(promiseError);
				}
			});
		};
		events.forEach((event) => emitter.once(event, resolveNext));
	});
}

function turnFactory(readable, callback, onOff) {
	return (event) => readable[onOff](event, callback);
}

exports.eventsToAsyncIterable = function eventsToAsyncIterable(readable, {
	pauseThreshold = PAUSE_THRESHOLD,
	resumeThreshold = RESUME_THRESHOLD,
	closeEvents = CLOSE_EVENTS,
	itemEvents = ITEM_EVENTS,errorEvents = ERROR_EVENTS
}) {
	if (!FixedQueue) {
		FixedQueue = require('./fixed_queue');
	}
	const events = [...itemEvents, ...errorEvents, ...closeEvents];
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
				turnOff();
				error = value;
			};
			const onClose = () => {
				turnOff();
				done = true;
			};
			const onItem = (value) => {
				queue.push(value);
				queueSize++;
				if (queueSize >= pauseThreshold) {
					readable.pause();
				}
			};
			const turnOff = () => {
				closeEvents.forEach(turnFactory(readable, onClose, 'off'));
				itemEvents.forEach(turnFactory(readable, onItem, 'off'));
				errorEvents.forEach(turnFactory(readable, onError, 'off'));
			};
			itemEvents.forEach(turnFactory(readable, onItem, 'on'));
			errorEvents.forEach(turnFactory(readable, onError, 'on'));
			closeEvents.forEach(turnFactory(readable, onClose, 'on'));

			function next() {
				if (!queue.isEmpty()) {
					const value = queue.shift();
					queueSize--;
					if (queueSize < resumeThreshold) {
						readable.resume();
					}
					return {
						value,
					};
				}
				if (error) {
					throw error;
				}
				if (done) {
					return { done };
				}
				return waitNext(readable, next, events);
			}

			return {
				next,
			};
		},
	};
}
