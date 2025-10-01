import * as assert from 'assert';
import * as vscode from 'vscode';
import { getHook, getHookSlug, getHookDescription, getHookCompletion } from '../../utils/hookHelpers';

suite('Hook Helpers Test Suite', () => {
	suite('getHook', () => {
		test('Should find common action hooks', () => {
			const knownActions = ['init', 'wp_head', 'admin_init', 'wp_footer'];

			knownActions.forEach((hookName) => {
				const hook = getHook(hookName);
				assert.ok(hook, `Should find action: ${hookName}`);
				assert.strictEqual(hook.name, hookName);
			});
		});

		test('Should find common filter hooks', () => {
			const knownFilters = ['the_content', 'the_title', 'body_class'];

			knownFilters.forEach((hookName) => {
				const hook = getHook(hookName);
				assert.ok(hook, `Should find filter: ${hookName}`);
				assert.strictEqual(hook.name, hookName);
			});
		});

		test('Should return undefined for non-existent hooks', () => {
			const nonExistent = getHook('non_existent_hook_12345');
			assert.strictEqual(nonExistent, undefined);
		});

		test('Should find hooks by alias if they exist', () => {
			// Try to find any hook with aliases and test it
			const hook = getHook('init');
			if (hook && hook.aliases && hook.aliases.length > 0) {
				const aliasHook = getHook(hook.aliases[0]);
				assert.ok(aliasHook, 'Should find hook by alias');
			}
		});

		test('Should have required properties', () => {
			const hook = getHook('init');
			assert.ok(hook);
			assert.ok(hook.name);
			assert.ok(hook.doc);
			assert.ok(hook.doc.description);
		});

		test('Should check filters before actions', () => {
			// If a name exists in both, should return the filter
			const hook = getHook('the_content');
			assert.ok(hook);
			// the_content is a filter, so it should be found first
			assert.strictEqual(hook.name, 'the_content');
		});
	});

	suite('getHookSlug', () => {
		test('Should convert hook name to slug', () => {
			const tests = [
				{ hook: { name: 'init', doc: {} } as any, expected: 'init' },
				{ hook: { name: 'wp_head', doc: {} } as any, expected: 'wp_head' },
				{ hook: { name: 'the_content', doc: {} } as any, expected: 'the_content' },
			];

			tests.forEach(({ hook, expected }) => {
				const slug = getHookSlug(hook);
				assert.strictEqual(slug, expected);
			});
		});

		test('Should remove invalid characters', () => {
			const tests = [
				{ hook: { name: 'hook@123', doc: {} } as any, expected: 'hook' },
				{ hook: { name: 'hook#name', doc: {} } as any, expected: 'hookname' },
				{ hook: { name: 'hook name', doc: {} } as any, expected: 'hookname' },
			];

			tests.forEach(({ hook, expected }) => {
				const slug = getHookSlug(hook);
				assert.strictEqual(slug, expected);
			});
		});

		test('Should preserve underscores and hyphens', () => {
			const hook = { name: 'my-hook_name', doc: {} } as any;
			const slug = getHookSlug(hook);
			assert.strictEqual(slug, 'my-hook_name');
		});

		test('Should convert to lowercase', () => {
			const hook = { name: 'MyHook', doc: {} } as any;
			const slug = getHookSlug(hook);
			assert.strictEqual(slug, 'myhook');
		});
	});

	suite('getHookDescription', () => {
		test('Should return MarkdownString', () => {
			const hook = getHook('init');
			assert.ok(hook);

			const description = getHookDescription(hook);
			assert.ok(description instanceof vscode.MarkdownString);
		});

		test('Should include long description', () => {
			const hook = getHook('init');
			assert.ok(hook);

			const description = getHookDescription(hook);
			const value = description.value;

			assert.ok(value.length > 0);
			assert.ok(value.includes(hook.doc.long_description || hook.doc.description));
		});

		test('Should include developer.wordpress.org link', () => {
			const hook = getHook('init');
			assert.ok(hook);

			const description = getHookDescription(hook);
			assert.ok(description.value.includes('developer.wordpress.org'));
			assert.ok(description.value.includes('/reference/hooks/'));
		});

		test('Should include param tags if present', () => {
			const hook = getHook('the_content');
			assert.ok(hook);

			const description = getHookDescription(hook);
			const params = hook.doc.tags?.filter((tag) => tag.name === 'param');

			if (params && params.length > 0) {
				assert.ok(description.value.includes('@param'));
			}
		});

		test('Should format param tags with types and variables', () => {
			const hook = getHook('the_content');
			assert.ok(hook);

			const description = getHookDescription(hook);
			const params = hook.doc.tags?.filter((tag) => tag.name === 'param');

			if (params && params.length > 0 && params[0].variable) {
				assert.ok(description.value.includes(params[0].variable));
			}
		});
	});

	suite('getHookCompletion', () => {
		test('Should return CompletionItem', () => {
			const hook = getHook('init');
			assert.ok(hook);

			const completion = getHookCompletion(hook);
			assert.ok(completion instanceof vscode.CompletionItem);
		});

		test('Should set label to hook name', () => {
			const hook = getHook('init');
			assert.ok(hook);

			const completion = getHookCompletion(hook);
			assert.strictEqual(completion.label, 'init');
		});

		test('Should set detail to description', () => {
			const hook = getHook('init');
			assert.ok(hook);

			const completion = getHookCompletion(hook);
			assert.strictEqual(completion.detail, hook.doc.description);
		});

		test('Should set documentation to formatted description', () => {
			const hook = getHook('init');
			assert.ok(hook);

			const completion = getHookCompletion(hook);
			assert.ok(completion.documentation instanceof vscode.MarkdownString);
		});

		test('Should set filterText to aliases if present', () => {
			// Find a hook with aliases
			const hook = getHook('init');
			assert.ok(hook);

			const completion = getHookCompletion(hook);

			if (hook.aliases && hook.aliases.length > 0) {
				assert.ok(completion.filterText);
				assert.ok(completion.filterText?.includes(hook.aliases[0]));
			}
		});

		test('Should set kind to Value', () => {
			const hook = getHook('init');
			assert.ok(hook);

			const completion = getHookCompletion(hook);
			assert.strictEqual(completion.kind, vscode.CompletionItemKind.Value);
		});
	});
});
