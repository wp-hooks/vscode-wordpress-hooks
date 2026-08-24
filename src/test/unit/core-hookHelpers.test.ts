import * as assert from 'assert';
import { getHook, getHookSlug, getHookDescriptionData, getHookCompletionData } from '../../core/hookHelpers.js';
import { Hook } from '../../types/index.js';

suite('Core Hook Helpers Test Suite', () => {
	suite('getHook', () => {
		test('Should find common action hooks', () => {
			const hook = getHook('init');
			assert.ok(hook);
			assert.strictEqual(hook.name, 'init');
			assert.strictEqual(hook.type, 'action');
		});

		test('Should find common filter hooks', () => {
			const hook = getHook('the_content');
			assert.ok(hook);
			assert.strictEqual(hook.name, 'the_content');
			assert.strictEqual(hook.type, 'filter');
		});

		test('Should return undefined for non-existent hooks', () => {
			const hook = getHook('nonexistent_hook_name_12345');
			assert.strictEqual(hook, undefined);
		});

		test('Should check filters before actions', () => {
			const filterHook = getHook('the_content');
			assert.ok(filterHook);
			assert.strictEqual(filterHook.type, 'filter');
		});

		test('Should fallback to actions if not found in filters', () => {
			const hook = getHook('wp_footer');
			assert.ok(hook);
			assert.strictEqual(hook.type, 'action');
		});
	});

	suite('getHookSlug', () => {
		test('Should convert hook name to slug', () => {
			const hook: Hook = { name: 'the_content', type: 'filter' } as Hook;
			const slug = getHookSlug(hook);
			assert.strictEqual(slug, 'the_content');
		});

		test('Should remove invalid characters', () => {
			const hook: Hook = { name: 'hook{test}name', type: 'action' } as Hook;
			const slug = getHookSlug(hook);
			assert.strictEqual(slug, 'hooktestname');
		});

		test('Should preserve underscores and hyphens', () => {
			const hook: Hook = { name: 'my_hook-name', type: 'action' } as Hook;
			const slug = getHookSlug(hook);
			assert.strictEqual(slug, 'my_hook-name');
		});

		test('Should convert to lowercase', () => {
			const hook: Hook = { name: 'MyHookName', type: 'action' } as Hook;
			const slug = getHookSlug(hook);
			assert.strictEqual(slug, 'myhookname');
		});
	});

	suite('getHookDescriptionData', () => {
		test('Should return description data structure', () => {
			const hook = getHook('init');
			assert.ok(hook);
			const data = getHookDescriptionData(hook);
			assert.ok(data.description);
			assert.ok(data.slug);
			assert.ok(Array.isArray(data.params));
			assert.ok(Array.isArray(data.otherTags));
		});

		test('Should include long description', () => {
			const hook = getHook('init');
			assert.ok(hook);
			const data = getHookDescriptionData(hook);
			assert.ok(data.description.includes(hook.doc.long_description));
		});

		test('Should include developer.wordpress.org link', () => {
			const hook = getHook('init');
			assert.ok(hook);
			const data = getHookDescriptionData(hook);
			assert.ok(data.description.includes('developer.wordpress.org'));
		});

		test('Should separate params from other tags', () => {
			const hook = getHook('init');
			assert.ok(hook);
			const data = getHookDescriptionData(hook);
			const paramTags = hook.doc.tags.filter(tag => tag.name === 'param');
			const otherTags = hook.doc.tags.filter(tag => tag.name !== 'param');
			assert.strictEqual(data.params.length, paramTags.length);
			assert.strictEqual(data.otherTags.length, otherTags.length);
		});

		test('Should include slug in data', () => {
			const hook = getHook('init');
			assert.ok(hook);
			const data = getHookDescriptionData(hook);
			assert.strictEqual(data.slug, 'init');
		});
	});

	suite('getHookCompletionData', () => {
		test('Should return completion data structure', () => {
			const hook = getHook('init');
			assert.ok(hook);
			const data = getHookCompletionData(hook);
			assert.strictEqual(data.name, hook.name);
			assert.strictEqual(data.detail, hook.doc.description);
			assert.ok(data.descriptionData);
		});

		test('Should include hook name', () => {
			const hook = getHook('init');
			assert.ok(hook);
			const data = getHookCompletionData(hook);
			assert.strictEqual(data.name, 'init');
		});

		test('Should include short description as detail', () => {
			const hook = getHook('init');
			assert.ok(hook);
			const data = getHookCompletionData(hook);
			assert.ok(data.detail.length > 0);
		});

		test('Should include description data', () => {
			const hook = getHook('init');
			assert.ok(hook);
			const data = getHookCompletionData(hook);
			assert.ok(data.descriptionData.description);
			assert.ok(data.descriptionData.slug);
		});
	});
});
