import { Readable } from 'stream';
import { Interface } from 'readline';

export declare function getReadlineIterable<T = any>(readable: Interface): AsyncIterable<T>;
export declare function getReadLineIterableFromStream<T = any>(readable: Readable): AsyncIterable<T>;
