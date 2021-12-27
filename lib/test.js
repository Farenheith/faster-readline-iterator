/* eslint-disable camelcase */
'use strict';

const eventsToAsyncIterable = require('./events-to-asyncIterable');

module.exports = function getReadLineIterable(input, crlfDelay) {
  let kSawReturnAt;
  let kLine_buffer;
  let current;

  if (input?.input) {
    input = input.input;
    crlfDelay = input.crlfDelay;
  }

  if (crlfDelay === undefined) {
    crlfDelay = Number.POSITIVE_INFINITY;
  }

  function splitLines(b) {
    if (b === undefined) {
      return [];
    }
    let string = b;
    if (
      kSawReturnAt &&
      Date.now() - kSawReturnAt <= crlfDelay
    ) {
      string = string.replace(string, /^\n/, '');
      kSawReturnAt = 0;
    }

    let start = 0;
    let end = 0;

    function nextEnd() {
      const lastEnd = end;
      end = string.indexOf('\n', lastEnd);
      if (end === -1) {
        end = string.indexOf('\r', lastEnd);
      }
    }

    function nextLine() {
      end++;
      if (string[end] === '\r') {
        end++;
        if (string[end] === '\n') {
          end++;
        }
      } else if (string[end] === '\n') {
        end++;
      }
      start = end;
      nextEnd();
    }

    nextEnd();

    return {
      next() {
        if (end === -1) {
          if (start < string.length - 1) {
            const value = string.substr(start);
            if (kLine_buffer) {
              kLine_buffer += value;
            } else {
              kLine_buffer = value;
            }
          }
          return { done: true };
        }
        let value = string.substr(start, end - start);
        if (kLine_buffer) {
          value = kLine_buffer + value;
          kLine_buffer = null;
        }
        const result = {
          done: false,
          value,
        };
        nextLine();

        return result;
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  const iterator = eventsToAsyncIterable(input, {
    closeEvents: ['end'],
    pauseThreshold: 1,
  });

  async function nextChunk() {
    input.resume();
    current = await iterator.next();
    input.pause();
    if (current.done) {
      if (typeof kLine_buffer === 'string' &&
          kLine_buffer.length > 0
      ) {
        return { done: false, value: kLine_buffer };
      }
    } else {
      current = splitLines(current.value);
    }
    return nextItem();
  }

  function nextItem() {
    if (current.done) {
      return current;
    }
    const node = current.next();
    if (node.done) {
      return nextChunk();
    }
    return node;
  }

  const result = {
    next: () => current ? nextItem() : nextChunk(),
  };
  result[Symbol.asyncIterator] = () => result;

  return result;
};
