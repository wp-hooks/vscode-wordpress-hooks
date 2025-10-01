import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Hover Provider Test Suite', () => {
	const actionFunctions = ['add_action', 'remove_action', 'has_action', 'doing_action', 'did_action'];
	const filterFunctions = ['add_filter', 'remove_filter', 'has_filter', 'doing_filter'];

	const hookTestCases = [
		{ hook: 'init', expectedTexts: ['wordpress', 'fires', 'loaded'] },
		{ hook: 'wp_head', expectedTexts: ['developer.wordpress.org'], exactMatch: true },
	];

	actionFunctions.forEach((fn) => {
		hookTestCases.forEach(({ hook, expectedTexts, exactMatch }) => {
			test(`Should provide hover for ${fn} with ${hook}`, async () => {
				const doc = await vscode.workspace.openTextDocument({
					language: 'php',
					content: `<?php\n${fn}('${hook}', 'my_callback');`,
				});

				await vscode.window.showTextDocument(doc);
				await new Promise((resolve) => setTimeout(resolve, 100));

				const hoverPos = fn.length + 3 + Math.floor(hook.length / 2);
				const position = new vscode.Position(1, hoverPos);

				const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
					'vscode.executeHoverProvider',
					doc.uri,
					position,
				);

				assert.ok(hovers, 'Hover should be returned');
				assert.ok(hovers.length > 0, 'Should have hover information');

				const hoverText = hovers
					.map((h) => h.contents.map((c) => (typeof c === 'string' ? c : c.value)).join(''))
					.join('');

				if (exactMatch) {
					assert.ok(
						expectedTexts.some((text) => hoverText.includes(text)),
						`Hover should contain one of: ${expectedTexts.join(', ')}`,
					);
				} else {
					assert.ok(
						expectedTexts.some((text) => hoverText.toLowerCase().includes(text)),
						`Hover should contain one of: ${expectedTexts.join(', ')}`,
					);
				}
			});
		});
	});

	const filterHookTestCases = [
		{ hook: 'the_content', expectedTexts: ['filter', 'content'] },
	];

	filterFunctions.forEach((fn) => {
		filterHookTestCases.forEach(({ hook, expectedTexts }) => {
			test(`Should provide hover for ${fn} with ${hook}`, async () => {
				const doc = await vscode.workspace.openTextDocument({
					language: 'php',
					content: `<?php\n${fn}('${hook}', 'my_callback');`,
				});

				await vscode.window.showTextDocument(doc);
				await new Promise((resolve) => setTimeout(resolve, 100));

				const hoverPos = fn.length + 3 + Math.floor(hook.length / 2);
				const position = new vscode.Position(1, hoverPos);

				const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
					'vscode.executeHoverProvider',
					doc.uri,
					position,
				);

				assert.ok(hovers, 'Hover should be returned');
				assert.ok(hovers.length > 0, 'Should have hover information');

				const hoverText = hovers
					.map((h) => h.contents.map((c) => (typeof c === 'string' ? c : c.value)).join(''))
					.join('');

				assert.ok(
					expectedTexts.some((text) => hoverText.toLowerCase().includes(text)),
					`Hover should contain one of: ${expectedTexts.join(', ')}`,
				);
			});
		});
	});
});
