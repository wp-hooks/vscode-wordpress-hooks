import * as assert from 'assert';
import { generateCallbackSnippet, WORDPRESS_UTILITY_SNIPPETS, SNIPPET_TYPES } from '../../generators/snippetGenerator';
import { Tag } from '../../types';

suite('Snippet Generator Test Suite', () => {
	suite('generateCallbackSnippet', () => {
		test('Should generate action callback with no parameters', () => {
			const hookType = 'action';
			const params: Tag[] = [];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.ok(snippet.snippetCallback.includes('void'));
			assert.ok(snippet.snippetCallback.includes('${1}'));
			assert.strictEqual(snippet.suffix, ' ');
		});

		test('Should generate action callback with single parameter', () => {
			const hookType = 'action';
			const params: Tag[] = [
				{ name: 'param', variable: '$post', types: ['WP_Post'], content: 'The post' },
			];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.ok(snippet.snippetCallback.includes('WP_Post \\$post'));
			assert.ok(snippet.snippetCallback.includes('void'));
			assert.strictEqual(snippet.suffix, ' ');
		});

		test('Should generate action callback with multiple parameters', () => {
			const hookType = 'action';
			const params: Tag[] = [
				{ name: 'param', variable: '$post', types: ['WP_Post'], content: 'The post' },
				{ name: 'param', variable: '$id', types: ['int'], content: 'The ID' },
			];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.ok(snippet.snippetCallback.includes('WP_Post \\$post'));
			assert.ok(snippet.snippetCallback.includes('\\$id'));
			assert.strictEqual(snippet.suffix, ', 10, 2 ');
		});

		test('Should generate filter callback with return statement', () => {
			const hookType = 'filter';
			const params: Tag[] = [
				{ name: 'param', variable: '$content', types: ['WP_Post'], content: 'The content' },
			];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.ok(snippet.snippetCallback.includes('return \\$content'));
			assert.ok(snippet.returnTypeString.includes('WP_Post'));
		});

		test('Should handle nullable return types for filters', () => {
			const hookType = 'filter';
			const params: Tag[] = [
				{ name: 'param', variable: '$value', types: ['null', 'WP_Post'], content: 'The value' },
			];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.ok(snippet.returnTypeString.includes('?WP_Post'));
		});

		test('Should handle filter_reference hook type', () => {
			const hookType = 'filter_reference';
			const params: Tag[] = [
				{ name: 'param', variable: '$data', types: ['array'], content: 'The data' },
			];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.ok(snippet.snippetCallback.includes('return \\$data'));
		});

		test('Should handle parameters without type hints', () => {
			const hookType = 'action';
			const params: Tag[] = [
				{ name: 'param', variable: '$value', content: 'Some value' },
			];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.ok(snippet.snippetCallback.includes('\\$value'));
			assert.ok(!snippet.snippetCallback.includes('WP_Post'));
		});

		test('Should handle nullable parameter types', () => {
			const hookType = 'action';
			const params: Tag[] = [
				{ name: 'param', variable: '$post', types: ['null', 'WP_Post'], content: 'The post' },
			];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.ok(snippet.snippetCallback.includes('?WP_Post \\$post'));
		});

		test('Should escape dollar signs in snippet', () => {
			const hookType = 'action';
			const params: Tag[] = [
				{ name: 'param', variable: '$value', types: ['string'], content: 'Value' },
			];

			const snippet = generateCallbackSnippet(hookType, params);

			// Snippet should have escaped dollar signs
			assert.ok(snippet.snippetCallback.includes('\\$value'));
			// Documentation should not have escaped dollar signs
			assert.ok(snippet.documentationCallback.includes('$value'));
			assert.ok(!snippet.documentationCallback.includes('\\$value'));
		});

		test('Should set correct suffix for single parameter', () => {
			const hookType = 'action';
			const params: Tag[] = [
				{ name: 'param', variable: '$value', types: ['string'], content: 'Value' },
			];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.strictEqual(snippet.suffix, ' ');
		});

		test('Should set correct suffix for multiple parameters', () => {
			const tests = [
				{ count: 2, expected: ', 10, 2 ' },
				{ count: 3, expected: ', 10, 3 ' },
				{ count: 5, expected: ', 10, 5 ' },
			];

			tests.forEach(({ count, expected }) => {
				const params: Tag[] = Array(count).fill(null).map((_, i) => ({
					name: 'param',
					variable: `$param${i}`,
					types: ['string'],
					content: 'Param',
				}));

				const snippet = generateCallbackSnippet('action', params);
				assert.strictEqual(snippet.suffix, expected);
			});
		});

		test('Should include placeholder in snippet callback', () => {
			const hookType = 'action';
			const params: Tag[] = [];

			const snippet = generateCallbackSnippet(hookType, params);

			assert.ok(snippet.snippetCallback.includes('${1}'));
		});
	});

	suite('WORDPRESS_UTILITY_SNIPPETS', () => {
		test('Should contain expected utility functions', () => {
			const expectedKeys = [
				'__return_true',
				'__return_false',
				'__return_zero',
				'__return_empty_array',
				'__return_empty_string',
			];

			expectedKeys.forEach((key) => {
				assert.ok(key in WORDPRESS_UTILITY_SNIPPETS, `Should have ${key}`);
			});
		});

		test('Should have descriptive labels', () => {
			assert.strictEqual(WORDPRESS_UTILITY_SNIPPETS.__return_true, 'Return true');
			assert.strictEqual(WORDPRESS_UTILITY_SNIPPETS.__return_false, 'Return false');
			assert.strictEqual(WORDPRESS_UTILITY_SNIPPETS.__return_zero, 'Return zero');
			assert.strictEqual(WORDPRESS_UTILITY_SNIPPETS.__return_empty_array, 'Return empty array');
			assert.strictEqual(WORDPRESS_UTILITY_SNIPPETS.__return_empty_string, 'Return empty string');
		});
	});

	suite('SNIPPET_TYPES', () => {
		test('Should map bool to true/false snippets', () => {
			assert.ok(SNIPPET_TYPES.bool.includes('__return_true'));
			assert.ok(SNIPPET_TYPES.bool.includes('__return_false'));
		});

		test('Should map numeric types to zero snippet', () => {
			assert.ok(SNIPPET_TYPES.int.includes('__return_zero'));
			assert.ok(SNIPPET_TYPES.float.includes('__return_zero'));
		});

		test('Should map string to empty string snippet', () => {
			assert.ok(SNIPPET_TYPES.string.includes('__return_empty_string'));
		});

		test('Should map array types to empty array snippet', () => {
			assert.ok(SNIPPET_TYPES.array.includes('__return_empty_array'));
			assert.ok(SNIPPET_TYPES.iterable.includes('__return_empty_array'));
		});

		test('Should have empty arrays for unsupported types', () => {
			assert.strictEqual(SNIPPET_TYPES.null.length, 0);
			assert.strictEqual(SNIPPET_TYPES.self.length, 0);
			assert.strictEqual(SNIPPET_TYPES.callable.length, 0);
			assert.strictEqual(SNIPPET_TYPES.object.length, 0);
		});

		test('Should contain all expected type mappings', () => {
			const expectedTypes = ['null', 'self', 'array', 'callable', 'bool', 'float', 'int', 'string', 'iterable', 'object'];

			expectedTypes.forEach((type) => {
				assert.ok(type in SNIPPET_TYPES, `Should have mapping for ${type}`);
			});
		});
	});
});
