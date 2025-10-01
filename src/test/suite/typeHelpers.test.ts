import * as assert from 'assert';
import { getTagType, getReturnType } from '../../utils/typeHelpers';
import { Tag } from '../../types';

suite('Type Helpers Test Suite', () => {
	suite('getTagType', () => {
		test('Should return null when tag has no types', () => {
			const tag: Tag = { name: 'param', content: 'test' };
			const result = getTagType(tag);
			assert.strictEqual(result, null);
		});

		test('Should return null for mixed type', () => {
			const tag: Tag = { name: 'param', types: ['mixed'], content: 'test' };
			const result = getTagType(tag);
			assert.strictEqual(result, null);
		});

		test('Should return null for allowed PHP types', () => {
			const allowedTypes = ['self', 'array', 'callable', 'bool', 'float', 'int', 'string', 'iterable', 'object'];

			allowedTypes.forEach((type) => {
				const tag: Tag = { name: 'param', types: [type], content: 'test' };
				const result = getTagType(tag);
				assert.strictEqual(result, null, `Should return null for type: ${type}`);
			});
		});

		test('Should handle nullable types', () => {
			const tests = [
				{ types: ['null', 'WP_Post'], expectedNullable: true, expectedType: 'WP_Post' },
				{ types: ['WP_User', 'null'], expectedNullable: true, expectedType: 'WP_User' },
			];

			tests.forEach(({ types, expectedNullable, expectedType }) => {
				const tag: Tag = { name: 'param', types, content: 'test' };
				const result = getTagType(tag);
				assert.ok(result, `Should return result for types: ${types.join(', ')}`);
				assert.strictEqual(result?.nullable, expectedNullable);
				assert.strictEqual(result?.type, expectedType);
			});
		});

		test('Should return null for multiple non-nullable types', () => {
			const tag: Tag = { name: 'param', types: ['WP_Post', 'WP_User'], content: 'test' };
			const result = getTagType(tag);
			assert.strictEqual(result, null, 'Should return null for union types');
		});

		test('Should convert typed arrays to array', () => {
			const tests = ['WP_Post[]', 'string[]', 'int[]'];

			tests.forEach((type) => {
				const tag: Tag = { name: 'param', types: [type], content: 'test' };
				const result = getTagType(tag);
				assert.strictEqual(result, null, `Typed array ${type} should convert to array which is an allowed type`);
			});
		});

		test('Should convert boolean aliases to bool', () => {
			const boolAliases = ['false', 'true', 'boolean'];

			boolAliases.forEach((alias) => {
				const tag: Tag = { name: 'param', types: [alias], content: 'test' };
				const result = getTagType(tag);
				assert.strictEqual(result, null, `${alias} should convert to bool which is an allowed type`);
			});
		});

		test('Should convert callback to callable', () => {
			const tag: Tag = { name: 'param', types: ['callback'], content: 'test' };
			const result = getTagType(tag);
			assert.strictEqual(result, null, 'callback should convert to callable which is an allowed type');
		});

		test('Should convert integer to int', () => {
			const tag: Tag = { name: 'param', types: ['integer'], content: 'test' };
			const result = getTagType(tag);
			assert.strictEqual(result, null, 'integer should convert to int which is an allowed type');
		});

		test('Should convert \\stdClass to object', () => {
			const tag: Tag = { name: 'param', types: ['\\stdClass'], content: 'test' };
			const result = getTagType(tag);
			assert.strictEqual(result, null, '\\stdClass should convert to object which is an allowed type');
		});

		test('Should return class names as custom types', () => {
			const classNames = ['WP_Post', 'WP_User', 'WP_Query', 'Custom_Class'];

			classNames.forEach((className) => {
				const tag: Tag = { name: 'param', types: [className], content: 'test' };
				const result = getTagType(tag);
				assert.ok(result, `Should return result for class: ${className}`);
				assert.strictEqual(result?.type, className);
				assert.strictEqual(result?.nullable, false);
			});
		});

		test('Should handle namespaced class names', () => {
			const tag: Tag = { name: 'param', types: ['\\Namespace\\ClassName'], content: 'test' };
			const result = getTagType(tag);
			assert.ok(result);
			assert.strictEqual(result?.type, '\\Namespace\\ClassName');
		});
	});

	suite('getReturnType', () => {
		test('Should delegate to getTagType', () => {
			const tag: Tag = { name: 'return', types: ['WP_Post'], content: 'test' };
			const result = getReturnType(tag);
			assert.ok(result);
			assert.strictEqual(result?.type, 'WP_Post');
		});

		test('Should return null for no types', () => {
			const tag: Tag = { name: 'return', content: 'test' };
			const result = getReturnType(tag);
			assert.strictEqual(result, null);
		});

		test('Should handle nullable return types', () => {
			const tag: Tag = { name: 'return', types: ['null', 'WP_Post'], content: 'test' };
			const result = getReturnType(tag);
			assert.ok(result);
			assert.strictEqual(result?.nullable, true);
			assert.strictEqual(result?.type, 'WP_Post');
		});
	});
});
