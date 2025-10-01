import * as vscode from 'vscode';
import { Hook } from '../types';
import { getHook } from '../utils/hookHelpers';
import { isInFunctionDeclaration } from '../utils/matchers';
import { getContainingSymbol } from '../utils/symbolHelpers';
import { generateDocblockLines } from '../generators/docblockGenerator';
import {
	generateCallbackSnippet,
	WORDPRESS_UTILITY_SNIPPETS,
	SNIPPET_TYPES
} from '../generators/snippetGenerator';

const extensionName = 'vscode-wordpress-hooks';

function createClosureCompletion(
	hook: Hook,
	docblockLines: string[],
	snippetCallback: string,
	documentationCallback: string,
	suffix: string,
	lineLeadingWhitespace: string,
	position: vscode.Position,
	docBlocksEnabled: boolean
): vscode.CompletionItem {
	const completionItemForClosure = new vscode.CompletionItem('Closure', vscode.CompletionItemKind.Function);
	completionItemForClosure.insertText = new vscode.SnippetString(`function${snippetCallback}${suffix}`);
	completionItemForClosure.documentation = `function${documentationCallback}${suffix}`;
	completionItemForClosure.preselect = true;
	completionItemForClosure.sortText = '1';

	if (docBlocksEnabled) {
		completionItemForClosure.additionalTextEdits = [
			vscode.TextEdit.insert(position.with({ character: 0 }), `${docblockLines.map((line) => `${lineLeadingWhitespace}${line}`).join('\n')}\n`),
		];
	}

	return completionItemForClosure;
}

function createArrowFunctionCompletion(
	params: Array<{ variable?: string }>,
	returnTypeString: string,
	snippetArgsString: string,
	docArgsString: string,
	suffix: string,
	docblockLines: string[],
	lineLeadingWhitespace: string,
	position: vscode.Position,
	docBlocksEnabled: boolean
): vscode.CompletionItem {
	const completionItemForArrow = new vscode.CompletionItem('Arrow function', vscode.CompletionItemKind.Function);

	const snippetArrow = `( ${snippetArgsString} )${returnTypeString} => \\${params[0].variable}\${1}`;
	const documentationArrow = `( ${docArgsString} )${returnTypeString} => ${params[0].variable}`;

	completionItemForArrow.insertText = new vscode.SnippetString(`fn${snippetArrow}${suffix}`);
	completionItemForArrow.documentation = `fn${documentationArrow}${suffix}`;
	completionItemForArrow.sortText = '2';

	if (docBlocksEnabled) {
		completionItemForArrow.additionalTextEdits = [
			vscode.TextEdit.insert(position.with({ character: 0 }), `${docblockLines.map((line) => `${lineLeadingWhitespace}${line}`).join('\n')}\n`),
		];
	}

	return completionItemForArrow;
}

function createUtilityFunctionCompletions(
	params: Array<{ types?: string[] }>
): vscode.CompletionItem[] {
	const completions: vscode.CompletionItem[] = [];

	for (const [snippet, documentation] of Object.entries(WORDPRESS_UTILITY_SNIPPETS)) {
		// If we don't know the types, show this snippet:
		let show = !params[0].types;

		if (params[0].types) {
			for (const paramType of params[0].types) {
				// If there's a parameter type which we're not aware of, show this snippet:
				if (!(paramType in SNIPPET_TYPES)) {
					show = true;
					break;
				}

				// If this parameter type supports this snippet, show it:
				if (SNIPPET_TYPES[paramType].includes(snippet)) {
					show = true;
				}
			}
		}

		if (show) {
			const itemSnippet = `'${snippet}' `;
			const completionItemForReturn = new vscode.CompletionItem(documentation, vscode.CompletionItemKind.Function);

			completionItemForReturn.insertText = new vscode.SnippetString(itemSnippet);
			completionItemForReturn.documentation = itemSnippet;
			completionItemForReturn.sortText = '3';

			completions.push(completionItemForReturn);
		}
	}

	// Always add __return_null
	const snippet = '\'__return_null\' ';
	const completionItemForReturnNull = new vscode.CompletionItem('Return null', vscode.CompletionItemKind.Function);
	completionItemForReturnNull.insertText = new vscode.SnippetString(snippet);
	completionItemForReturnNull.documentation = snippet;
	completionItemForReturnNull.sortText = '4';
	completions.push(completionItemForReturnNull);

	return completions;
}

function createFunctionCompletion(
	hook: Hook,
	documentationCallback: string,
	suffix: string,
	docblockLines: string[],
	leadingWhitespace: string,
	insertionPosition: vscode.Position,
	docBlocksEnabled: boolean
): vscode.CompletionItem {
	const functionName = `${hook.type}_${hook.name.replace(/[^a-z_]/g, '')}`;
	const completionItemForFunction = new vscode.CompletionItem('Function', vscode.CompletionItemKind.Function);
	const insertFunction = `function ${functionName}${documentationCallback}`;

	completionItemForFunction.insertText = new vscode.SnippetString(`'${functionName}'${suffix}`);
	completionItemForFunction.documentation = `'${functionName}'${suffix}\n\nfunction ${functionName}${documentationCallback}`;
	completionItemForFunction.preselect = true;
	completionItemForFunction.sortText = '0';
	completionItemForFunction.additionalTextEdits = [];

	completionItemForFunction.additionalTextEdits.push(
		vscode.TextEdit.insert(insertionPosition, '\n\n'),
	);

	if (docBlocksEnabled) {
		completionItemForFunction.additionalTextEdits.push(
			vscode.TextEdit.insert(insertionPosition, `${docblockLines.join('\n')}\n`),
		);
	}

	completionItemForFunction.additionalTextEdits.push(
		vscode.TextEdit.insert(insertionPosition, insertFunction),
	);

	return completionItemForFunction;
}

function createMethodCompletion(
	hook: Hook,
	documentationCallback: string,
	suffix: string,
	docblockLines: string[],
	leadingWhitespace: string,
	methodInsertionPosition: vscode.Position,
	docBlocksEnabled: boolean
): vscode.CompletionItem {
	const functionName = `${hook.type}_${hook.name.replace(/[^a-z_]/g, '')}`;
	const completionItemForMethod = new vscode.CompletionItem('Class method', vscode.CompletionItemKind.Method);

	completionItemForMethod.insertText = new vscode.SnippetString(`[ \\$this, '${functionName}' ]${suffix}`);
	completionItemForMethod.documentation = `[ $this, '${functionName}' ]${suffix}\n\npublic function ${functionName}${documentationCallback}`;
	completionItemForMethod.preselect = true;
	completionItemForMethod.sortText = '0';
	completionItemForMethod.additionalTextEdits = [];

	let insertMethod = `public function ${functionName}${documentationCallback}`;
	insertMethod = insertMethod.split('\n').map((line) => `${leadingWhitespace}${line}`).join('\n');

	completionItemForMethod.additionalTextEdits.push(
		vscode.TextEdit.insert(methodInsertionPosition, '\n\n'),
	);

	if (docBlocksEnabled) {
		completionItemForMethod.additionalTextEdits.push(
			vscode.TextEdit.insert(methodInsertionPosition, `${docblockLines.map((line) => `${leadingWhitespace}${line}`).join('\n')}\n`),
		);
	}

	completionItemForMethod.additionalTextEdits.push(
		vscode.TextEdit.insert(methodInsertionPosition, insertMethod),
	);

	return completionItemForMethod;
}

export function createCallbackCompletionProvider(): vscode.Disposable {
	return vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				const declaration = isInFunctionDeclaration(linePrefix);

				if (!declaration) {
					return undefined;
				}

				const hook = getHook(declaration.groups?.hook || '');

				if (!hook) {
					return undefined;
				}

				const completions: vscode.CompletionItem[] = [];
				const params = hook.doc.tags.filter((tag) => tag.name === 'param');

				// Generate callback snippet
				const { snippetCallback, documentationCallback, returnTypeString, suffix } = generateCallbackSnippet(hook.type, params);
				const snippetArgsString = params.map((param) => `\\${param.variable}`).join(', ');
				const docArgsString = snippetArgsString.replace(/\\\$/g, '$');

				// Generate docblock
				const returnParam = (hook.type === 'filter' || hook.type === 'filter_reference') ? params[0] : undefined;
				const docblockLines = generateDocblockLines(hook.doc.description, params, returnParam);

				const docBlocksEnabled: boolean = vscode.workspace.getConfiguration(extensionName).get('docBlocks.enable') ?? true;
				const lineLeadingMatch = document.lineAt(position).text.match(/^[\s]+/);
				const lineLeadingWhitespace = lineLeadingMatch ? lineLeadingMatch[0] : '';

				// Add closure completion
				completions.push(createClosureCompletion(
					hook,
					docblockLines,
					snippetCallback,
					documentationCallback,
					suffix,
					lineLeadingWhitespace,
					position,
					docBlocksEnabled
				));

				// Add arrow function and utility functions for filters
				if (hook.type === 'filter') {
					completions.push(createArrowFunctionCompletion(
						params,
						returnTypeString,
						snippetArgsString,
						docArgsString,
						suffix,
						docblockLines,
						lineLeadingWhitespace,
						position,
						docBlocksEnabled
					));

					completions.push(...createUtilityFunctionCompletions(params));
				}

				// Add function/method completions
				if (vscode.window.activeTextEditor !== undefined) {
					return vscode.commands
						.executeCommand<vscode.DocumentSymbol[]>(
							'vscode.executeDocumentSymbolProvider',
							vscode.window.activeTextEditor.document.uri,
						)
						.then((symbols) => {
							let insertionPosition = document.lineAt(position.line).range.end;

							if (symbols === undefined) {
								completions.push(createFunctionCompletion(
									hook,
									documentationCallback,
									suffix,
									docblockLines,
									'',
									insertionPosition,
									docBlocksEnabled
								));
								return completions;
							}

							const positionContext = getContainingSymbol(symbols, position);

							let leadingMatch = null;
							if (positionContext.symbol) {
								leadingMatch = document.lineAt(positionContext.symbol.range.end).text.match(/^[\s]+/);
							} else {
								leadingMatch = document.lineAt(position).text.match(/^[\s]+/);
							}

							const leadingWhitespace = leadingMatch ? leadingMatch[0] : '';

							if (positionContext.inMethod && positionContext.symbol) {
								completions.push(createMethodCompletion(
									hook,
									documentationCallback,
									suffix,
									docblockLines,
									leadingWhitespace,
									positionContext.symbol.range.end,
									docBlocksEnabled
								));
							} else {
								const functionName = `${hook.type}_${hook.name.replace(/[^a-z_]/g, '')}`;
								const completionItemForFunction = createFunctionCompletion(
									hook,
									documentationCallback,
									suffix,
									docblockLines,
									leadingWhitespace,
									positionContext.symbol ? positionContext.symbol.range.end : insertionPosition,
									docBlocksEnabled
								);

								if (positionContext.inNamespace) {
									completionItemForFunction.insertText = new vscode.SnippetString(`__NAMESPACE__ . '\\\\\\\\${functionName}'${suffix}`);
									completionItemForFunction.documentation = `__NAMESPACE__ . '\\\\${functionName}'${suffix}\n\nfunction ${functionName}${documentationCallback}`;
								}

								completions.push(completionItemForFunction);
							}

							return completions;
						});
				}

				return completions;
			},
		},
		',',
		' ',
	);
}
