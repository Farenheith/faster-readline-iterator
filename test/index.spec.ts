import { getReadLineIterableFromStream, getReadlineIterable } from '../index';
import { createInterface } from 'readline';
import { Readable } from 'stream';

jest.setTimeout(9999999);

const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Dui accumsan sit amet nulla facilisi morbi tempus iaculis urna.
Eget dolor morbi non arcu risus quis varius quam quisque.
Lacus viverra vitae congue eu consequat ac felis donec.
Amet porttitor eget dolor morbi non arcu.
Velit ut tortor pretium viverra suspendisse.
Mauris nunc congue nisi vitae suscipit tellus.
Amet nisl suscipit adipiscing bibendum est ultricies integer.
Sit amet dictum sit amet justo donec enim diam.
Condimentum mattis pellentesque id nibh tortor id aliquet lectus proin.
Diam in arcu cursus euismod quis viverra nibh.
`;

const REPETITIONS = 10000;
const SAMPLE = 100;
const THRESHOLD = 81;

function getLoremIpsumStream() {
	const readable = new Readable({
		objectMode: true,
	});
	let i = 0;
	readable._read = () => readable.push(i++ >= REPETITIONS ? null : loremIpsum);
	return readable;
}

function getAvg(mean: number, x: number, n: number) {
	return (mean * n + x) / (n + 1);
}

describe(getReadlineIterable.name, () => {
	it('should be faster than vanilla', async () => {
		let totalTimeVanillaWay = 0;
		let totalTimeNewWay = 0;
		let totalTimeNewerWay = 0;
		let totalCharsVanillaWay = 0;
		let totalCharsNewWay = 0;
		let totalCharsNewerWay = 0;
		for (let time = 0; time < SAMPLE; time++) {
			const rlVanillaWay = createInterface({
				input: getLoremIpsumStream(),
			});
			let currenttotalTimeVanillaWay = Date.now();
			for await (const line of rlVanillaWay) {
				totalCharsVanillaWay += line.length;
			}
			currenttotalTimeVanillaWay = Date.now() - currenttotalTimeVanillaWay;
			totalTimeVanillaWay = getAvg(
				totalTimeVanillaWay,
				currenttotalTimeVanillaWay,
				SAMPLE,
			);

			const rlNewWay = createInterface({
				input: getLoremIpsumStream(),
			});
			let currentTotalTimeNewWay = Date.now();
			for await (const line of getReadlineIterable(rlNewWay)) {
				totalCharsNewWay += line.length;
			}
			currentTotalTimeNewWay = Date.now() - currentTotalTimeNewWay;
			totalTimeNewWay = getAvg(totalTimeNewWay, currentTotalTimeNewWay, SAMPLE);

			const rlNewerWay = getReadLineIterableFromStream(getLoremIpsumStream());
			let currentTotalTimeNewerWay = Date.now();
			for await (const line of rlNewerWay) {
				totalCharsNewerWay += line.length;
			}
			currentTotalTimeNewerWay = Date.now() - currentTotalTimeNewerWay;
			totalTimeNewerWay = getAvg(totalTimeNewerWay, currentTotalTimeNewerWay, SAMPLE);
		}

		expect(totalCharsNewWay).toBe(totalCharsVanillaWay);
		expect(totalCharsNewerWay).toBe(totalCharsVanillaWay);
		const newPercentage = (totalTimeNewWay * 100) / totalTimeVanillaWay;
		expect(newPercentage).toBeLessThanOrEqual(THRESHOLD);
		console.log(`New Percentage: ${newPercentage}`);
		const newerPercentage = (totalTimeNewerWay * 100) / totalTimeVanillaWay;
		// expect(newerPercentage).toBeLessThanOrEqual(THRESHOLD);
		console.log(`Newer Percentage: ${newerPercentage}`);
	});

	it('should yield exactly as vanilla one', async () => {
		const rlVanillaWay = createInterface({
			input: getLoremIpsumStream(),
		});
		const vanillaWay = [];
		for await (const line of rlVanillaWay) {
			vanillaWay.push(line);
		}
		const rlNewWay = createInterface({
			input: getLoremIpsumStream(),
		});
		const timeNewWay = [];
		for await (const line of getReadlineIterable(rlNewWay)) {
			timeNewWay.push(line);
		}
    const timeNewerWay = [];
		for await (const line of getReadLineIterableFromStream(getLoremIpsumStream())) {
			timeNewerWay.push(line);
		}

		expect(vanillaWay).toEqual(timeNewWay);
		expect(vanillaWay).toEqual(timeNewerWay);
	});
});
