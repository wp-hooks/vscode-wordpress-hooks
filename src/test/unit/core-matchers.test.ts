import * as assert from 'assert';
import { isInFilter, isInAction, isInFunctionDeclaration } from '../../core/matchers.js';

suite('Core Matchers Test Suite', () => {
	suite('isInAction', () => {
		test('Should match add_action with single quotes', () => {
			const result = isInAction('add_action( \'');
			assert.ok(result !== null);
		});

		test('Should match remove_action', () => {
			const result = isInAction('remove_action( "');
			assert.ok(result !== null);
		});

		test('Should match has_action', () => {
			const result = isInAction('has_action( \'');
			assert.ok(result !== null);
		});

		test('Should match doing_action', () => {
			const result = isInAction('doing_action( "');
			assert.ok(result !== null);
		});

		test('Should match did_action', () => {
			const result = isInAction('did_action( \'');
			assert.ok(result !== null);
		});

		test('Should not match filter functions', () => {
			const result = isInAction('add_filter( \'');
			assert.strictEqual(result, null);
		});

		test('Should not match incomplete syntax', () => {
			const result = isInAction('add_action');
			assert.strictEqual(result, null);
		});
	});

	suite('isInFilter', () => {
		test('Should match add_filter with single quotes', () => {
			const result = isInFilter('add_filter( \'');
			assert.ok(result !== null);
		});

		test('Should match remove_filter', () => {
			const result = isInFilter('remove_filter( "');
			assert.ok(result !== null);
		});

		test('Should match has_filter', () => {
			const result = isInFilter('has_filter( \'');
			assert.ok(result !== null);
		});

		test('Should match doing_filter', () => {
			const result = isInFilter('doing_filter( "');
			assert.ok(result !== null);
		});

		test('Should not match action functions', () => {
			const result = isInFilter('add_action( \'');
			assert.strictEqual(result, null);
		});

		test('Should not match incomplete syntax', () => {
			const result = isInFilter('add_filter');
			assert.strictEqual(result, null);
		});
	});

	suite('isInFunctionDeclaration', () => {
		test('Should match add_action with callback parameter', () => {
			const result = isInFunctionDeclaration('add_action( \'init\', ');
			assert.ok(result !== null);
		});

		test('Should match add_filter with callback parameter', () => {
			const result = isInFunctionDeclaration('add_filter( "the_content", ');
			assert.ok(result !== null);
		});

		test('Should capture hook name in groups', () => {
			const result = isInFunctionDeclaration('add_action( \'init\', ');
			assert.strictEqual(result?.groups?.hook, 'init');
		});

		test('Should not match without callback parameter', () => {
			const result = isInFunctionDeclaration('add_action( \'init\' ');
			assert.strictEqual(result, null);
		});

		test('Should not match incomplete syntax', () => {
			const result = isInFunctionDeclaration('add_action( \'init');
			assert.strictEqual(result, null);
		});
	});
});
