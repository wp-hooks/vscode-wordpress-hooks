import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Hook Completion Test Suite', () => {
	vscode.window.showInformationMessage('Start hook completion tests.');

	const actionFunctions = ['add_action', 'remove_action', 'has_action', 'doing_action', 'did_action'];
	const filterFunctions = ['add_filter', 'remove_filter', 'has_filter', 'doing_filter'];

	const testVariations = [
		{ quote: "'", whitespace: '', description: 'single quotes' },
		{ quote: '"', whitespace: '', description: 'double quotes' },
		{ quote: "'", whitespace: '   ', description: 'extra whitespace' },
	];

	actionFunctions.forEach((fn) => {
		testVariations.forEach(({ quote, whitespace, description }) => {
			test(`Should provide action completions for ${fn} with ${description}`, async () => {
				const ws = whitespace || '';
				const doc = await vscode.workspace.openTextDocument({
					language: 'php',
					content: `<?php\n${fn}(${ws}${quote}`,
				});

				await vscode.window.showTextDocument(doc);
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Position is after the opening quote
				const pos = fn.length + 1 + ws.length + 1;
				const position = new vscode.Position(1, pos);

				const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
					'vscode.executeCompletionItemProvider',
					doc.uri,
					position,
				);

				assert.ok(completions, 'Completions should be returned');
				assert.ok(completions.items.length > 0, 'Should have completion items');

				const labels = completions.items.map((item) => (typeof item.label === 'string' ? item.label : item.label.label));
				assert.ok(labels.includes('init'), `Should include init hook for ${fn}`);
			});
		});
	});

	filterFunctions.forEach((fn) => {
		testVariations.forEach(({ quote, whitespace, description }) => {
			test(`Should provide filter completions for ${fn} with ${description}`, async () => {
				const ws = whitespace || '';
				const doc = await vscode.workspace.openTextDocument({
					language: 'php',
					content: `<?php\n${fn}(${ws}${quote}`,
				});

				await vscode.window.showTextDocument(doc);
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Position is after the opening quote
				const pos = fn.length + 1 + ws.length + 1;
				const position = new vscode.Position(1, pos);

				const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
					'vscode.executeCompletionItemProvider',
					doc.uri,
					position,
				);

				assert.ok(completions, 'Completions should be returned');
				assert.ok(completions.items.length > 0, 'Should have completion items');

				const labels = completions.items.map((item) => (typeof item.label === 'string' ? item.label : item.label.label));
				assert.ok(labels.includes('the_content'), `Should include the_content hook for ${fn}`);
			});
		});
	});

	test('Should not provide hook completions outside of hook functions', async () => {
		const doc = await vscode.workspace.openTextDocument({
			language: 'php',
			content: "<?php\n$var = '",
		});

		await vscode.window.showTextDocument(doc);

		const position = new vscode.Position(1, 8);

		const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
			'vscode.executeCompletionItemProvider',
			doc.uri,
			position,
		);

		// Either no completions or the completions shouldn't be WordPress hooks
		if (completions && completions.items.length > 0) {
			const labels = completions.items.map((item) => (typeof item.label === 'string' ? item.label : item.label.label));
			// Our extension shouldn't provide completions here
			// Other extensions might, so we just check our hooks aren't there
			assert.ok(
				!labels.some((label) => label === 'init' || label === 'wp_enqueue_scripts'),
				'Should not provide WordPress action completions in random strings',
			);
		}
	});
});
