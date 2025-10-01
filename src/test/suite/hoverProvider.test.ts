import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Hover Provider Test Suite', () => {
	test('Should provide hover information for actions', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nadd_action('init', 'my_callback');"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		// Position over 'init'
		const position = new vscode.Position(1, 14);

		const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
			'vscode.executeHoverProvider',
			doc.uri,
			position
		);

		assert.ok(hovers, 'Hover should be returned');
		assert.ok(hovers.length > 0, 'Should have hover information');

		const hoverText = hovers.map(h =>
			h.contents.map(c =>
				typeof c === 'string' ? c : c.value
			).join('')
		).join('');

		assert.ok(
			hoverText.toLowerCase().includes('wordpress') ||
			hoverText.toLowerCase().includes('fires') ||
			hoverText.toLowerCase().includes('loaded'),
			'Hover should contain WordPress hook description'
		);
	});

	test('Should provide hover information for filters', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nadd_filter('the_content', 'my_filter');"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		// Position over 'the_content'
		const position = new vscode.Position(1, 18);

		const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
			'vscode.executeHoverProvider',
			doc.uri,
			position
		);

		assert.ok(hovers, 'Hover should be returned');
		assert.ok(hovers.length > 0, 'Should have hover information');

		const hoverText = hovers.map(h =>
			h.contents.map(c =>
				typeof c === 'string' ? c : c.value
			).join('')
		).join('');

		assert.ok(
			hoverText.toLowerCase().includes('filter') ||
			hoverText.toLowerCase().includes('content'),
			'Hover should contain filter description'
		);
	});

	test('Should include link to developer.wordpress.org', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\nadd_action('wp_head', 'my_callback');"
		});

		await vscode.window.showTextDocument(doc);
		await new Promise(resolve => setTimeout(resolve, 100));

		const position = new vscode.Position(1, 16);

		const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
			'vscode.executeHoverProvider',
			doc.uri,
			position
		);

		assert.ok(hovers, 'Hover should be returned');
		assert.ok(hovers.length > 0, 'Should have hover information');

		const hoverText = hovers.map(h =>
			h.contents.map(c =>
				typeof c === 'string' ? c : c.value
			).join('')
		).join('');

		assert.ok(
			hoverText.includes('developer.wordpress.org'),
			'Hover should include link to WordPress developer docs'
		);
	});
});
