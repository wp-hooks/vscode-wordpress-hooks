import * as assert from 'assert';
import { isInFilter, isInAction, isInFunctionDeclaration } from '../../utils/matchers';

suite('Matchers Test Suite', () => {
	suite('isInAction', () => {
		const actionFunctions = ['add_action', 'remove_action', 'has_action', 'doing_action', 'did_action'];
		const quotes = ["'", '"'];
		const whitespaceVariations = ['', ' ', '   ', '\t'];

		actionFunctions.forEach((fn) => {
			quotes.forEach((quote) => {
				whitespaceVariations.forEach((ws) => {
					test(`Should match ${fn} with ${quote === "'" ? 'single' : 'double'} quotes and whitespace: "${ws}"`, () => {
						const line = `${fn}(${ws}${quote}`;
						const match = isInAction(line);
						assert.ok(match, `Should match: ${line}`);
					});
				});
			});
		});

		test('Should match action with partial hook name', () => {
			assert.ok(isInAction("add_action('ini"));
			assert.ok(isInAction("remove_action('wp_he"));
		});

		test('Should not match filter functions', () => {
			assert.strictEqual(isInAction("add_filter('"), null);
			assert.strictEqual(isInAction("remove_filter('"), null);
		});

		test('Should not match incomplete syntax', () => {
			assert.strictEqual(isInAction('add_action'), null);
			assert.strictEqual(isInAction('add_action('), null);
		});

		test('Should not match non-hook functions', () => {
			assert.strictEqual(isInAction("some_function('"), null);
			assert.strictEqual(isInAction("my_action('"), null);
		});
	});

	suite('isInFilter', () => {
		const filterFunctions = ['add_filter', 'remove_filter', 'has_filter', 'doing_filter'];
		const quotes = ["'", '"'];
		const whitespaceVariations = ['', ' ', '   ', '\t'];

		filterFunctions.forEach((fn) => {
			quotes.forEach((quote) => {
				whitespaceVariations.forEach((ws) => {
					test(`Should match ${fn} with ${quote === "'" ? 'single' : 'double'} quotes and whitespace: "${ws}"`, () => {
						const line = `${fn}(${ws}${quote}`;
						const match = isInFilter(line);
						assert.ok(match, `Should match: ${line}`);
					});
				});
			});
		});

		test('Should match filter with partial hook name', () => {
			assert.ok(isInFilter("add_filter('the_"));
			assert.ok(isInFilter("remove_filter('post_"));
		});

		test('Should not match action functions', () => {
			assert.strictEqual(isInFilter("add_action('"), null);
			assert.strictEqual(isInFilter("did_action('"), null);
		});

		test('Should not match incomplete syntax', () => {
			assert.strictEqual(isInFilter('add_filter'), null);
			assert.strictEqual(isInFilter('add_filter('), null);
		});

		test('Should not match non-hook functions', () => {
			assert.strictEqual(isInFilter("some_function('"), null);
			assert.strictEqual(isInFilter("my_filter('"), null);
		});
	});

	suite('isInFunctionDeclaration', () => {
		test('Should match add_action with callback parameter', () => {
			const match = isInFunctionDeclaration("add_action('init', my");
			assert.ok(match);
			assert.strictEqual(match?.groups?.hook, 'init');
		});

		test('Should match add_filter with callback parameter', () => {
			const match = isInFunctionDeclaration("add_filter('the_content', my");
			assert.ok(match);
			assert.strictEqual(match?.groups?.hook, 'the_content');
		});

		test('Should match with double quotes', () => {
			const match = isInFunctionDeclaration('add_action("init", my');
			assert.ok(match);
			assert.strictEqual(match?.groups?.hook, 'init');
		});

		test('Should match with whitespace variations', () => {
			assert.ok(isInFunctionDeclaration("add_action(  'init',  my"));
			assert.ok(isInFunctionDeclaration("add_filter(\t'the_content',\tmy"));
		});

		test('Should capture hook name in groups', () => {
			const tests = [
				{ line: "add_action('wp_head', ", expected: 'wp_head' },
				{ line: "add_filter('the_title', ", expected: 'the_title' },
				{ line: "add_action('custom_hook', ", expected: 'custom_hook' },
			];

			tests.forEach(({ line, expected }) => {
				const match = isInFunctionDeclaration(line);
				assert.ok(match, `Should match: ${line}`);
				assert.strictEqual(match?.groups?.hook, expected);
			});
		});

		test('Should not match without callback parameter', () => {
			assert.strictEqual(isInFunctionDeclaration("add_action('init'"), null);
			assert.strictEqual(isInFunctionDeclaration("add_filter('the_content'"), null);
		});

		test('Should not match incomplete syntax', () => {
			assert.strictEqual(isInFunctionDeclaration('add_action'), null);
			assert.strictEqual(isInFunctionDeclaration("add_action('"), null);
		});

		test('Should not match non-add functions', () => {
			assert.strictEqual(isInFunctionDeclaration("remove_action('init', "), null);
			assert.strictEqual(isInFunctionDeclaration("has_filter('the_content', "), null);
		});
	});
});
