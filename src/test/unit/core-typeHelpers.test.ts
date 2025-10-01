import * as assert from 'assert';
import { getTagType, getReturnType } from '../../core/typeHelpers.js';
import { Tag } from '../../types/index.js';

suite('Core Type Helpers Test Suite', () => {
	suite('getTagType', () => {
		test('Should return null when tag has no types', () => {
			const tag: Tag = { name: 'param', variable: '$test', content: '' };
			const result = getTagType(tag);
			assert.strictEqual(result, null);
		});

		test('Should return null for mixed type', () => {
			const tag: Tag = { name: 'param', types: ['mixed'], variable: '$test', content: '' };
			const result = getTagType(tag);
			assert.strictEqual(result, null);
		});

		test('Should return null for allowed PHP types', () => {
			const allowedTypes = ['self', 'array', 'callable', 'bool', 'float', 'int', 'string', 'iterable', 'object'];
			allowedTypes.forEach(type => {
				const tag: Tag = { name: 'param', types: [type], variable: '$test', content: '' };
				const result = getTagType(tag);
				assert.strictEqual(result, null, `Expected null for allowed type: ${type}`);
			});
		});

		test('Should handle nullable types with null first', () => {
			const tag: Tag = { name: 'param', types: ['null', 'WP_Post'], variable: '$post', content: '' };
			const result = getTagType(tag);
			assert.deepStrictEqual(result, { type: 'WP_Post', nullable: true });
		});

		test('Should handle nullable types with null last', () => {
			const tag: Tag = { name: 'param', types: ['WP_User', 'null'], variable: '$user', content: '' };
			const result = getTagType(tag);
			assert.deepStrictEqual(result, { type: 'WP_User', nullable: true });
		});

		test('Should return null for multiple non-nullable types', () => {
			const tag: Tag = { name: 'param', types: ['string', 'int'], variable: '$value', content: '' };
			const result = getTagType(tag);
			assert.strictEqual(result, null);
		});

		test('Should return class names as custom types', () => {
			const tag: Tag = { name: 'param', types: ['WP_Post'], variable: '$post', content: '' };
			const result = getTagType(tag);
			assert.deepStrictEqual(result, { type: 'WP_Post', nullable: false });
		});

		test('Should handle namespaced class names', () => {
			const tag: Tag = { name: 'param', types: ['\\Namespace\\ClassName'], variable: '$obj', content: '' };
			const result = getTagType(tag);
			assert.deepStrictEqual(result, { type: '\\Namespace\\ClassName', nullable: false });
		});
	});

	suite('getReturnType', () => {
		test('Should delegate to getTagType', () => {
			const tag: Tag = { name: 'return', types: ['WP_Post'], content: 'The post object' };
			const result = getReturnType(tag);
			assert.deepStrictEqual(result, { type: 'WP_Post', nullable: false });
		});

		test('Should return null for no types', () => {
			const tag: Tag = { name: 'return', content: 'The result' };
			const result = getReturnType(tag);
			assert.strictEqual(result, null);
		});
	});
});
