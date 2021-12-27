const eventsToAsyncIterable = require('./lib/events-to-asyncIterable');
const getReadLineIterableFromStream = require('./lib/test');
const ITEM_EVENTS = ['line'];
const CLOSE_EVENTS = ['close'];

exports.getReadlineIterable = function getReadlineIterable(readable) {
	return eventsToAsyncIterable(readable, {
		closeEvents: CLOSE_EVENTS,
		itemEvents: ITEM_EVENTS,
	});
};
exports.getReadLineIterableFromStream = getReadLineIterableFromStream;
