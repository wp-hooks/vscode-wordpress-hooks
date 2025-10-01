import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Edge Cases Test Suite', () => {
	test('Should handle remove_action', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nremove_action('"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 16);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');

		const labels = completions.items.map(item =>
			typeof item.label === 'string' ? item.label : item.label.label
		);

		assert.ok(labels.includes('init'), 'Should include actions for remove_action');
	});

	test('Should handle remove_filter', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nremove_filter('"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 16);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');

		const labels = completions.items.map(item =>
			typeof item.label === 'string' ? item.label : item.label.label
		);

		assert.ok(labels.includes('the_content'), 'Should include filters for remove_filter');
	});

	test('Should handle has_action', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nhas_action('"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 13);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');
	});

	test('Should handle has_filter', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nhas_filter('"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 13);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');
	});

	test('Should handle doing_action', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\ndoing_action('"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 16);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');
	});

	test('Should handle did_action', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\ndid_action('"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 14);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Completions should be returned');
		assert.ok(completions.items.length > 0, 'Should have completion items');
	});

	test('Should handle double quotes', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: 'add_action("'
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		const position = new vscode.Position(0, 12);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Should work with double quotes');
		assert.ok(completions.items.length > 0, 'Should have completion items');

		const labels = completions.items.map(item =>
			typeof item.label === 'string' ? item.label : item.label.label
		);

		assert.ok(labels.includes('init'), 'Should include actions with double quotes');
	});

	test('Should handle extra whitespace', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nadd_action(   '"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 16);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position
		);

		assert.ok(completions, 'Should handle extra whitespace');
		assert.ok(completions.items.length > 0, 'Should have completion items');
	});
});
