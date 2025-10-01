import * as assert from 'assert';
import { generateDocblockLines } from '../../core/docblockGenerator.js';
import { Tag } from '../../types/index.js';

suite('Core Docblock Generator Test Suite', () => {
	suite('generateDocblockLines', () => {
		test('Should generate basic docblock with description only', () => {
			const result = generateDocblockLines('Test description', []);
			assert.strictEqual(result[0], '/**');
			assert.strictEqual(result[1], ' * Test description');
			assert.strictEqual(result[2], ' *');
			assert.strictEqual(result[3], ' */');
			assert.strictEqual(result.length, 4);
		});

		test('Should include param tags', () => {
			const params: Tag[] = [
				{ name: 'param', types: ['string'], variable: '$value', content: 'The value' },
			];
			const result = generateDocblockLines('Test function', params);
			assert.ok(result.some(line => line.includes('@param')));
			assert.ok(result.some(line => line.includes('string')));
			assert.ok(result.some(line => line.includes('$value')));
		});

		test('Should include multiple param tags', () => {
			const params: Tag[] = [
				{ name: 'param', types: ['string'], variable: '$arg1', content: 'First arg' },
				{ name: 'param', types: ['int'], variable: '$arg2', content: 'Second arg' },
			];
			const result = generateDocblockLines('Test', params);
			const paramLines = result.filter(line => line.includes('@param'));
			assert.strictEqual(paramLines.length, 2);
		});

		test('Should handle union types in params', () => {
			const params: Tag[] = [
				{ name: 'param', types: ['string', 'int'], variable: '$value', content: 'Mixed value' },
			];
			const result = generateDocblockLines('Test', params);
			assert.ok(result.some(line => line.includes('string|int')));
		});

		test('Should include return tag when provided', () => {
			const returnParam: Tag = { name: 'return', types: ['bool'], content: 'Success status' };
			const result = generateDocblockLines('Test', [], returnParam);
			assert.ok(result.some(line => line.includes('@return')));
			assert.ok(result.some(line => line.includes('bool')));
		});

		test('Should handle params without types', () => {
			const params: Tag[] = [
				{ name: 'param', variable: '$value', content: 'The value' },
			];
			const result = generateDocblockLines('Test', params);
			assert.ok(result.some(line => line.includes('@param')));
			assert.ok(result.some(line => line.includes('$value')));
		});

		test('Should handle params without variable names', () => {
			const params: Tag[] = [
				{ name: 'param', types: ['string'], content: 'A string value' },
			];
			const result = generateDocblockLines('Test', params);
			assert.ok(result.some(line => line.includes('@param')));
		});

		test('Should generate complete docblock structure', () => {
			const params: Tag[] = [
				{ name: 'param', types: ['WP_Post'], variable: '$post', content: 'Post object' },
			];
			const returnParam: Tag = { name: 'return', types: ['bool'], content: 'Success' };
			const result = generateDocblockLines('Process a post', params, returnParam);

			assert.strictEqual(result[0], '/**');
			assert.ok(result[1].includes('Process a post'));
			assert.strictEqual(result[2], ' *');
			assert.ok(result.some(line => line.includes('@param')));
			assert.ok(result.some(line => line.includes('@return')));
			assert.strictEqual(result[result.length - 1], ' */');
		});

		test('Should handle empty description', () => {
			const result = generateDocblockLines('', []);
			assert.strictEqual(result[1], ' * ');
		});

		test('Should close docblock with asterisk slash', () => {
			const result = generateDocblockLines('Test', []);
			assert.strictEqual(result[result.length - 1], ' */');
		});

		test('Should handle return param without types', () => {
			const returnParam: Tag = { name: 'return', content: 'A value' };
			const result = generateDocblockLines('Test', [], returnParam);
			assert.ok(result.some(line => line.includes('@return')));
			assert.ok(result.some(line => line.includes('A value')));
		});

		test('Should pad types to longest type length', () => {
			const params: Tag[] = [
				{ name: 'param', types: ['int'], variable: '$x', content: 'X' },
				{ name: 'param', types: ['WP_Post'], variable: '$post', content: 'Post' },
			];
			const result = generateDocblockLines('Test', params);
			const paramLines = result.filter(line => line.includes('@param'));
			assert.ok(paramLines.length === 2);
		});
	});
});
