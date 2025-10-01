import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Callback Completion Test Suite', () => {
	test('Should provide callback completions for add_action', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nadd_action('init', ",
		});

		await vscode.window.showTextDocument(doc);
		await new Promise((resolve) => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 20);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position,
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');

		const labels = completions.items.map((item) => (typeof item.label === 'string' ? item.label : item.label.label));

		// Should have standard callback types
		assert.ok(
			labels.some((label) => label === 'Closure' || label.includes('Closure')),
			'Should include Closure option',
		);
		assert.ok(
			labels.some((label) => label === 'Function' || label.includes('Function')),
			'Should include Function option',
		);
	});

	test('Should provide callback completions for add_filter', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nadd_filter('the_content', ",
		});

		await vscode.window.showTextDocument(doc);
		await new Promise((resolve) => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 32);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position,
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');

		const labels = completions.items.map((item) => (typeof item.label === 'string' ? item.label : item.label.label));

		// Should have callback types including arrow function for filters
		assert.ok(
			labels.some((label) => label === 'Arrow function' || label.includes('Arrow')),
			'Should include Arrow function option for filters',
		);
	});

	test('Should include WordPress utility functions for filters', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nadd_filter('the_content', ",
		});

		await vscode.window.showTextDocument(doc);
		await new Promise((resolve) => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 32);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position,
		);

		assert.ok(completions, 'Completions should be returned');
		const labels = completions.items.map((item) => (typeof item.label === 'string' ? item.label : item.label.label));

		// Check for WordPress utility functions
		const hasUtilityFunctions = labels.some((label) => label && (
				label.includes('Return true')
				|| label.includes('Return false')
				|| label.includes('Return null')
				|| label.includes('return')
			));

		assert.ok(
			hasUtilityFunctions,
			`Should include WordPress utility function options. Got: ${labels.slice(0, 15).join(', ')}`,
		);
	});
});
