import * as assert from 'assert';
import { generateCallbackSnippet, WORDPRESS_UTILITY_SNIPPETS, SNIPPET_TYPES } from '../../core/snippetGenerator.js';
import { Tag } from '../../types/index.js';

suite('Core Snippet Generator Test Suite', () => {
	suite('generateCallbackSnippet', () => {
		test('Should generate action callback with no parameters', () => {
			const result = generateCallbackSnippet('action', []);
			assert.strictEqual(result.snippetCallback, '() : void {\n\t${1}\n}');
			assert.strictEqual(result.suffix, ' ');
		});

		test('Should generate action callback with single parameter', () => {
			const params: Tag[] = [{ name: 'param', types: ['string'], variable: '$value', content: '' }];
			const result = generateCallbackSnippet('action', params);
			assert.ok(result.snippetCallback.includes('\\$value'));
			assert.strictEqual(result.suffix, ' ');
		});

		test('Should generate action callback with multiple parameters', () => {
			const params: Tag[] = [
				{ name: 'param', types: ['string'], variable: '$arg1', content: '' },
				{ name: 'param', types: ['int'], variable: '$arg2', content: '' },
			];
			const result = generateCallbackSnippet('action', params);
			assert.strictEqual(result.suffix, ', 10, 2 ');
		});

		test('Should generate filter callback with return statement', () => {
			const params: Tag[] = [{ name: 'param', types: ['WP_Post'], variable: '$post', content: '' }];
			const result = generateCallbackSnippet('filter', params);
			assert.ok(result.snippetCallback.includes('return \\$post'));
		});

		test('Should handle nullable return types for filters', () => {
			const params: Tag[] = [{ name: 'param', types: ['null', 'WP_User'], variable: '$user', content: '' }];
			const result = generateCallbackSnippet('filter', params);
			assert.strictEqual(result.returnTypeString, ' : ?WP_User');
		});

		test('Should handle filter_reference hook type', () => {
			const params: Tag[] = [{ name: 'param', types: ['array'], variable: '$data', content: '' }];
			const result = generateCallbackSnippet('filter_reference', params);
			assert.ok(result.snippetCallback.includes('return \\$data'));
		});

		test('Should escape dollar signs in snippet', () => {
			const params: Tag[] = [{ name: 'param', variable: '$test', content: '' }];
			const result = generateCallbackSnippet('action', params);
			assert.ok(result.snippetCallback.includes('\\$test'));
			assert.ok(result.documentationCallback.includes('$test'));
		});

		test('Should set correct suffix for multiple parameters', () => {
			const params: Tag[] = [
				{ name: 'param', variable: '$arg1', content: '' },
				{ name: 'param', variable: '$arg2', content: '' },
				{ name: 'param', variable: '$arg3', content: '' },
			];
			const result = generateCallbackSnippet('action', params);
			assert.strictEqual(result.suffix, ', 10, 3 ');
		});

		test('Should handle filter with no return type hint', () => {
			const params: Tag[] = [{ name: 'param', types: ['string'], variable: '$value', content: '' }];
			const result = generateCallbackSnippet('filter', params);
			assert.strictEqual(result.returnTypeString, '');
		});

		test('Should handle nullable parameter types', () => {
			const params: Tag[] = [{ name: 'param', types: ['null', 'WP_Error'], variable: '$error', content: '' }];
			const result = generateCallbackSnippet('action', params);
			assert.ok(result.snippetCallback.includes('?WP_Error \\$error'));
		});
	});

	suite('WORDPRESS_UTILITY_SNIPPETS', () => {
		test('Should contain expected utility functions', () => {
			assert.strictEqual(WORDPRESS_UTILITY_SNIPPETS.__return_true, 'Return true');
			assert.strictEqual(WORDPRESS_UTILITY_SNIPPETS.__return_false, 'Return false');
			assert.strictEqual(WORDPRESS_UTILITY_SNIPPETS.__return_zero, 'Return zero');
		});
	});

	suite('SNIPPET_TYPES', () => {
		test('Should map bool to true/false snippets', () => {
			assert.deepStrictEqual(SNIPPET_TYPES.bool, ['__return_true', '__return_false']);
		});

		test('Should map numeric types to zero snippet', () => {
			assert.deepStrictEqual(SNIPPET_TYPES.float, ['__return_zero']);
			assert.deepStrictEqual(SNIPPET_TYPES.int, ['__return_zero']);
		});

		test('Should map string to empty string snippet', () => {
			assert.deepStrictEqual(SNIPPET_TYPES.string, ['__return_empty_string']);
		});
	});
});
