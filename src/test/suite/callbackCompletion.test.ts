import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Callback Completion Test Suite', () => {
	// Only add_action and add_filter support callbacks
	const callbackFunctions = [
		{ fn: 'add_action', hook: 'init' },
		{ fn: 'add_filter', hook: 'the_content' },
	];

	const commonCallbackTypes = [
		{ label: 'Closure' },
		{ label: 'Function' },
	];

	const filterSpecificTypes = [
		{ label: 'Arrow' },
	];

	callbackFunctions.forEach(({ fn, hook }) => {
		const isFilter = fn.includes('filter');

		test(`Should provide callback completions for ${fn}`, async () => {
			const doc = await vscode.workspace.openTextDocument({
				language: 'php',
				content: `<?php\n${fn}('${hook}', `,
			});

			await vscode.window.showTextDocument(doc);
			await new Promise((resolve) => setTimeout(resolve, 100));

			const pos = fn.length + hook.length + 7;
			const position = new vscode.Position(1, pos);

			const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
				'vscode.executeCompletionItemProvider',
				doc.uri,
				position,
			);

			assert.ok(completions, 'Completions should be returned');
			assert.ok(completions.items.length > 0, 'Should have completion items');

			const labels = completions.items.map((item) => (typeof item.label === 'string' ? item.label : item.label.label));

			// Test common callback types
			commonCallbackTypes.forEach(({ label }) => {
				assert.ok(
					labels.some((l) => l === label || l.includes(label)),
					`Should include ${label} option for ${fn}`,
				);
			});

			// Test filter-specific types
			if (isFilter) {
				filterSpecificTypes.forEach(({ label }) => {
					assert.ok(
						labels.some((l) => l === label || l.includes(label)),
						`Should include ${label} option for ${fn}`,
					);
				});
			}
		});
	});
});
