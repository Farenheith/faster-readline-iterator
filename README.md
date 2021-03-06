[![test-coverage](https://github.com/Farenheith/faster-readable-iterator/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/Farenheith/faster-readable-iterator/actions/workflows/test-coverage.yml)
[![test](https://github.com/Farenheith/faster-readable-iterator/actions/workflows/test.yml/badge.svg)](https://github.com/Farenheith/faster-readable-iterator/actions/workflows/test.yml)

# faster-readable-iterator
A faster version for the readline's implementation of Symbol.asyncIterator.
With this version, you can achieve a performance 20% to 58% better than with the vanilla one.

# how to install

```
npm i faster-readable-iterator

```

# how to use it

Just get your readline interface:

```ts
import { createInterface } from 'readline';
import { getReadlineIterable } from 'faster-readline-iterator';

const interfaceInstance = createInterface({
    input: getLoremIpsumStream(),
});
```

Then get your iterable from it using **getReadlineIterable**:

```ts
const iterable = getReadlineIterable(interfaceInstance);

for await (const line of iterable) {
    console.log(line);
}
```