import * as assert from 'assert';
import { generateDocblockLines } from '../../generators/docblockGenerator';
import { Tag } from '../../types';

suite('Docblock Generator Test Suite', () => {
	suite('generateDocblockLines', () => {
		test('Should generate basic docblock with description only', () => {
			const description = 'My function description';
			const params: Tag[] = [];

			const lines = generateDocblockLines(description, params);

			assert.ok(lines.length > 0);
			assert.strictEqual(lines[0], '/**');
			assert.strictEqual(lines[1], ` * ${description}`);
			assert.strictEqual(lines[lines.length - 1], ' */');
		});

		test('Should include param tags', () => {
			const description = 'Function with parameters';
			const params: Tag[] = [
				{ name: 'param', types: ['string'], variable: '$content', content: 'The content' },
			];

			const lines = generateDocblockLines(description, params);

			const paramLine = lines.find((line) => line.includes('@param'));
			assert.ok(paramLine, 'Should have a @param line');
			assert.ok(paramLine?.includes('string'));
			assert.ok(paramLine?.includes('$content'));
			assert.ok(paramLine?.includes('The content'));
		});

		test('Should include multiple param tags', () => {
			const description = 'Function with multiple parameters';
			const params: Tag[] = [
				{ name: 'param', types: ['string'], variable: '$content', content: 'The content' },
				{ name: 'param', types: ['int'], variable: '$id', content: 'The ID' },
				{ name: 'param', types: ['bool'], variable: '$force', content: 'Force update' },
			];

			const lines = generateDocblockLines(description, params);

			const paramLines = lines.filter((line) => line.includes('@param'));
			assert.strictEqual(paramLines.length, 3, 'Should have 3 @param lines');
		});

		test('Should handle union types in params', () => {
			const description = 'Function with union type';
			const params: Tag[] = [
				{ name: 'param', types: ['string', 'int', 'null'], variable: '$value', content: 'The value' },
			];

			const lines = generateDocblockLines(description, params);

			const paramLine = lines.find((line) => line.includes('@param'));
			assert.ok(paramLine);
			assert.ok(paramLine?.includes('string|int|null'));
		});

		test('Should include return tag when provided', () => {
			const description = 'Function with return value';
			const params: Tag[] = [];
			const returnParam: Tag = {
				name: 'return',
				types: ['bool'],
				content: 'True on success',
			};

			const lines = generateDocblockLines(description, params, returnParam);

			const returnLine = lines.find((line) => line.includes('@return'));
			assert.ok(returnLine, 'Should have a @return line');
			assert.ok(returnLine?.includes('bool'));
			assert.ok(returnLine?.includes('True on success'));
		});

		test('Should align param types and names', () => {
			const description = 'Function with aligned params';
			const params: Tag[] = [
				{ name: 'param', types: ['string'], variable: '$a', content: 'Short' },
				{ name: 'param', types: ['int'], variable: '$longer_name', content: 'Longer' },
			];

			const lines = generateDocblockLines(description, params);

			const paramLines = lines.filter((line) => line.includes('@param'));
			assert.strictEqual(paramLines.length, 2);

			// Check that padding is applied (types and names should be padded)
			assert.ok(paramLines[0].includes('string'));
			assert.ok(paramLines[1].includes('int'));
		});

		test('Should handle params without types', () => {
			const description = 'Function with untyped param';
			const params: Tag[] = [
				{ name: 'param', variable: '$value', content: 'Some value' },
			];

			const lines = generateDocblockLines(description, params);

			const paramLine = lines.find((line) => line.includes('@param'));
			assert.ok(paramLine);
			assert.ok(paramLine?.includes('$value'));
			assert.ok(paramLine?.includes('Some value'));
		});

		test('Should handle params without variable names', () => {
			const description = 'Function with unnamed param';
			const params: Tag[] = [
				{ name: 'param', types: ['string'], content: 'Some value' },
			];

			const lines = generateDocblockLines(description, params);

			const paramLine = lines.find((line) => line.includes('@param'));
			assert.ok(paramLine);
			assert.ok(paramLine?.includes('string'));
		});

		test('Should generate complete docblock structure', () => {
			const description = 'Complete function';
			const params: Tag[] = [
				{ name: 'param', types: ['string'], variable: '$content', content: 'The content' },
			];
			const returnParam: Tag = {
				name: 'return',
				types: ['string'],
				content: 'Modified content',
			};

			const lines = generateDocblockLines(description, params, returnParam);

			assert.strictEqual(lines[0], '/**');
			assert.ok(lines[1].includes('Complete function'));
			assert.ok(lines.some((line) => line.includes('@param')));
			assert.ok(lines.some((line) => line.includes('@return')));
			assert.strictEqual(lines[lines.length - 1], ' */');
		});

		test('Should handle empty description', () => {
			const description = '';
			const params: Tag[] = [];

			const lines = generateDocblockLines(description, params);

			assert.strictEqual(lines[0], '/**');
			assert.strictEqual(lines[1], ' * ');
			assert.strictEqual(lines[lines.length - 1], ' */');
		});

		test('Should include blank line after description', () => {
			const description = 'My function';
			const params: Tag[] = [
				{ name: 'param', types: ['string'], variable: '$value', content: 'Value' },
			];

			const lines = generateDocblockLines(description, params);

			assert.strictEqual(lines[2], ' *', 'Third line should be blank comment line');
		});
	});
});
