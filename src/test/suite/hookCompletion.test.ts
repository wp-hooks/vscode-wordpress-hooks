import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Hook Completion Test Suite', () => {
	vscode.window.showInformationMessage('Start hook completion tests.');

	test('Should provide autocomplete for add_action', async () => {
		// Create a PHP document with content that triggers our completion provider
		const content = "<?php\nadd_action('";
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content
		});

		await vscode.window.showTextDocument(doc);

		// Wait a bit for extension to activate
		await new Promise(resolve => setTimeout(resolve, 100));

		// Position is right after the opening quote
		const position = new vscode.Position(1, 12);

		// Execute the completion provider
		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');

		// Check that we have WordPress actions
		const labels = completions.items.map(item =>
			typeof item.label === 'string' ? item.label : item.label.label
		);

		// Should have "init" action
		assert.ok(
			labels.includes('init'),
			`Should include "init" action. Got ${labels.length} items, first 10: ${labels.slice(0, 10).join(', ')}`
		);
	});

	test('Should provide autocomplete for add_filter', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nadd_filter('"
		});

		await vscode.window.showTextDocument(doc);

		const position = new vscode.Position(1, 12);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');

		// Check for a common WordPress filter
		const labels = completions.items.map(item =>
			typeof item.label === 'string' ? item.label : item.label.label
		);
		assert.ok(
			labels.some(label => label === 'the_content'),
			'Should include "the_content" filter'
		);
	});

	test('Should not provide hook completions outside of hook functions', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\n$var = '"
		});

		await vscode.window.showTextDocument(doc);

		const position = new vscode.Position(1, 8);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		// Either no completions or the completions shouldn't be WordPress hooks
		if (completions && completions.items.length > 0) {
			const labels = completions.items.map(item =>
				typeof item.label === 'string' ? item.label : item.label.label
			);
			// Our extension shouldn't provide completions here
			// Other extensions might, so we just check our hooks aren't there
			assert.ok(
				!labels.some(label => label === 'init' || label === 'wp_enqueue_scripts'),
				'Should not provide WordPress action completions in random strings'
			);
		}
	});
});
