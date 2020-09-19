import * as vscode from 'vscode';
import actions from '@johnbillion/wp-hooks/hooks/actions.json';
import filters from '@johnbillion/wp-hooks/hooks/filters.json';
import { Hook, Tag } from '@johnbillion/wp-hooks/interface';
import * as meta from '../package.json';

function getHookCompletion(
	hook: Hook,
): vscode.CompletionItem {
	const completion = new vscode.CompletionItem(hook.name, vscode.CompletionItemKind.Value);
	completion.detail = hook.doc.description;
	completion.documentation = getHookDescription(hook);

	return completion;
}

function getHookDescription(
	hook: Hook,
): vscode.MarkdownString {
	let description = hook.doc.long_description;
	const slug = getHookSlug(hook);

	description += `\n\n[View on developer.wordpress.org →](https://developer.wordpress.org/reference/hooks/${slug}/)\n\n`;

	const params = hook.doc.tags.filter((tag) => tag.name === 'param');

	params.forEach((tag: Tag) => {
		if (!tag.types) {
			return;
		}

		const types = tag.types.join('|');
		description += `\n\n_@param_ \`${types} ${tag.variable}\`  \n${tag.content}`;
	});

	const everythingElse = hook.doc.tags.filter((tag) => tag.name !== 'param');

	everythingElse.forEach((tag: Tag) => {
		description += `\n\n_@${tag.name}_ ${tag.content || tag.refers || ''} ${tag.description || ''}`;
	});

	return new vscode.MarkdownString(description);
}

function getHookSlug(
	hook: Hook,
): string {
	return hook.name.toLowerCase().replace(/[^a-z_-]/g, '');
}

function isInFilter(
	line: string,
): RegExpMatchArray | null {
	return line.match(/(add|remove|has|doing)_filter\([\s]*('|")[^"|']*$/);
}

function isInAction(
	line: string,
): RegExpMatchArray | null {
	return line.match(/(add|remove|has|doing|did)_action\([\s]*('|")[^"|']*$/);
}

function isInHookUse(
	line: string,
): RegExpMatchArray | null {
	return line.match(/add_(filter|action)\(/);
}


function isInCurrentNamespaceFunctionCallback(
	line: string,
): RegExpMatchArray | null {
	return line.match(/add_(?:filter|action)\(\s*['"](?<hook>\S+?)['"],\s*__NAMESPACE__ \. ['"](?<func>\S*)/);
}

function isInFunctionCallback(
	line: string,
): RegExpMatchArray | null {
	//                 add_   filter|action  (    '" {  hook     } '" ,    '" {  func     }
	return line.match(/add_(?:filter|action)\(\s*['"](?<hook>\S+?)['"],\s*['"](?<func>\S*)/);
}

function isInFunctionDeclaration(
	line: string,
): RegExpMatchArray | null {
	//                 add_   filter|action  (    '"    {hook}     '" ,
	return line.match(/add_(?:filter|action)\(\s*['"](?<hook>\S+?)['"],\s*\w*?$/);
}

function getHook(
	name: string,
): Hook | void {
	let hooks = filters.filter((filter) => filter.name === name);

	if (hooks.length === 0) {
		hooks = actions.filter((action) => action.name === name);
	}

	if (hooks.length) {
		return hooks[0];
	}
}

interface tagType {
	type: string;
	nullable: boolean;
}

function getTagType(
	tag: Tag,
): tagType | null {
	const typeDeclarationsSupport = getMinPHPVersion();

	// https://www.php.net/manual/en/functions.arguments.php#functions.arguments.type-declaration
	const allowedTypes: { [key: string]: number } = {
		self: 5.0,
		array: 5.1,
		callable: 5.4,
		bool: 7.0,
		float: 7.0,
		int: 7.0,
		string: 7.0,
		iterable: 7.1,
		object: 7.2,
	};

	const typeData: tagType = {
		type: '',
		nullable: false,
	};

	// Type declarations disabled? Bail.
	if (!typeDeclarationsSupport) {
		return null;
	}

	// No type info? Bail.
	if (!tag.types) {
		return null;
	}

	const types = [...tag.types];

	// Handle nullable type.
	if (types.length === 2 && typeDeclarationsSupport >= 7.1) {
		if (types[0] === 'null') {
			types.splice(0, 1);
			typeData.nullable = true;
		} else if (types[1] === 'null') {
			types.splice(1, 1);
			typeData.nullable = true;
		}
	}

	// More than one type? Bail.
	if (types.length !== 1) {
		return null;
	}

	let type = types[0];

	// Un-hintable type? Bail.
	if (['mixed'].includes(type)) {
		return null;
	}

	// Hinting for typed-arrays.
	if (type.indexOf('[]') !== -1) {
		type = 'array';
	}

	// Aliases for bool.
	if (['false', 'true', 'boolean'].includes(type)) {
		type = 'bool';
	}

	// Alias for callable.
	if (type === 'callback') {
		type = 'callable';
	}

	// Alias for int.
	if (type === 'integer') {
		type = 'int';
	}

	// Convert stdClass to object to avoid fatals when the stdClass gets promoted to a real class.
	if (type === '\\stdClass') {
		type = 'object';
	}

	// Check the allowed types, ignoring unknown types such as class and interface names.
	if (allowedTypes[type] && (allowedTypes[type] > typeDeclarationsSupport)) {
		return null;
	}

	typeData.type = type;

	return typeData;
}

function getReturnType(
	tag: Tag,
) : tagType | null {
	// Return type declarations require PHP 7 or higher.
	if (getMinPHPVersion() < 7) {
		return null;
	}

	return getTagType(tag);
}

function getMinPHPVersion() : number {
	const typeDeclarationsEnabled: boolean = vscode.workspace.getConfiguration(meta.name).get('typeDeclarations.enable') ?? true;
	const typeDeclarationsSupportSetting: string = vscode.workspace.getConfiguration(meta.name).get('typeDeclarations.olderPhpVersionSupport') ?? '';

	if (!typeDeclarationsEnabled) {
		return 0;
	}

	if (!typeDeclarationsSupportSetting || typeDeclarationsSupportSetting === 'None') {
		return 999;
	}

	return parseFloat(typeDeclarationsSupportSetting);
}

interface contextualPosition {
	symbol: vscode.DocumentSymbol | null;
	inNamespace: boolean;
	inMethod: boolean;
	inFunction: boolean;
}

function getContainingSymbol(
	symbols: vscode.DocumentSymbol[],
	position: vscode.Position,
) : contextualPosition {
	const inside = symbols.filter((symbol) => symbol.range.contains(position));
	const inNamespace = symbols.filter((symbol) => (vscode.SymbolKind.Namespace === symbol.kind)).length > 0;

	const context: contextualPosition = {
		symbol: null,
		inNamespace,
		inMethod: false,
		inFunction: false,
	};

	if (!inside.length) {
		return context;
	}

	[context.symbol] = inside;

	if (context.symbol.children.length) {
		const methods = context.symbol.children.filter((symbol) => symbol.range.contains(position));
		if (methods.length) {
			[context.symbol] = methods;
		}
	}

	context.inMethod = (context.symbol.kind === vscode.SymbolKind.Method);
	context.inFunction = (context.symbol.kind === vscode.SymbolKind.Function);

	return context;
}

function getSymbolLocationForGlobalFunction(match: RegExpMatchArray) {
	const search = match.groups?.func || null;

	if (!search) {
		return undefined;
	}

	return searchWorkspaceSymbols(search).then((symbols) => {
		if (!symbols) {
			return undefined;
		}

		// eslint-disable-next-line arrow-body-style
		const functionSymbols = symbols.filter((symbol) => {
			return (
				symbol.name === search
				&& !symbol.containerName
				&& symbol.kind === vscode.SymbolKind.Function
			);
		});
		const functionLocations = functionSymbols.map((symbol) => symbol.location);

		return functionLocations;
	});
}

function getCurrentNamespace() {
	if (vscode.window.activeTextEditor === undefined) {
		return undefined;
	}

	const symbolProvider = vscode.commands
		.executeCommand<vscode.DocumentSymbol[]>(
			'vscode.executeDocumentSymbolProvider',
			vscode.window.activeTextEditor.document.uri,
		);

	return symbolProvider.then((symbols) => {
		if (!symbols) {
			return undefined;
		}

		const namespaces = symbols.filter((symbol) => symbol.kind === vscode.SymbolKind.Namespace);

		if (!namespaces) {
			return undefined;
		}

		const [currentNamespace] = namespaces;

		return currentNamespace.name;
	});
}

function getSymbolLocationForNamespacedFunction(namespace: string, match: RegExpMatchArray) {
	const search = match.groups?.func || null;

	if (!search) {
		return undefined;
	}

	const functionSearch = search.replace(/^\\\\?/g, '');

	return searchWorkspaceSymbols(functionSearch).then((symbols) => {
		if (!symbols) {
			return undefined;
		}

		// eslint-disable-next-line arrow-body-style
		const functionSymbols = symbols.filter((symbol) => {
			return (
				symbol.name === functionSearch
				&& symbol.containerName === namespace
				&& symbol.kind === vscode.SymbolKind.Function
			);
		});
		const functionLocations = functionSymbols.map((symbol) => symbol.location);

		return functionLocations;
	});
}

function searchWorkspaceSymbols(search: string) {
	return vscode.commands
		.executeCommand<vscode.SymbolInformation[]>(
			'vscode.executeWorkspaceSymbolProvider',
			search,
		);
}

export function activate(
	context: vscode.ExtensionContext,
): void {
	const hooksProvider = vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads a certain value and if so then complete
				const linePrefix = document.lineAt(position).text.substr(0, position.character);

				if (isInAction(linePrefix)) {
					return actions.map(getHookCompletion);
				}

				if (isInFilter(linePrefix)) {
					return filters.map(getHookCompletion);
				}

				return undefined;
			},
		},
		"'",
		'"',
	);

	const callbackProvider = vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads a certain value and if so then complete
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
				const snippetArgsString = params.map((param) => {
					const val = `\\${param.variable}`;
					const type = getTagType(param);

					if (!type) {
						return val;
					}

					if (!type.nullable) {
						return `${type.type} ${val}`;
					}

					return `?${type.type} ${val}`;
				}).join(', ');
				const docArgsString = snippetArgsString.replace(/\\\$/g, '$');

				let snippetCallback = '';
				let documentationCallback = '';
				const docblockLines = [
					'/**',
					` * ${hook.doc.description}`,
					' *',
				];
				const paramTypeLengths: number[] = [0];
				const paramNameLengths: number[] = [0];

				params.forEach((param) => {
					if (param.types) {
						paramTypeLengths.push(param.types.join('|').length);
					}
					if (param.variable) {
						paramNameLengths.push(param.variable.length);
					}
				});

				const longestParamType = Math.max(...paramTypeLengths);
				const longestParamName = Math.max(...paramNameLengths);

				params.forEach((param) => {
					const types = param.types?.join('|').padEnd(longestParamType, ' ') || '';
					const variable = param.variable?.padEnd(longestParamName, ' ') || '';
					docblockLines.push(` * @param ${types} ${variable} ${param.content}`);
				});

				const suffix = (params.length > 1 ? `, 10, ${params.length} ` : ' ');
				let returnTypeString = '';

				if (hook.type === 'filter') {
					const returnType = getReturnType(params[0]);

					if (returnType) {
						if (returnType.nullable) {
							returnTypeString = ` : ?${returnType.type}`;
						} else {
							returnTypeString = ` : ${returnType.type}`;
						}
					}

					snippetCallback = `( ${snippetArgsString} )${returnTypeString} {\n\t\${1}\n\treturn \\${params[0].variable};\n}`;
					documentationCallback = `( ${docArgsString} )${returnTypeString} {\n\treturn ${params[0].variable};\n}`;

					docblockLines.push(` * @return ${params[0].types?.join('|') || ''} ${params[0].content}`);
				} else {
					const actionArgsString = snippetArgsString ? ` ${snippetArgsString} ` : '';
					returnTypeString = (getMinPHPVersion() >= 7.1) ? ' : void' : '';
					snippetCallback = `(${actionArgsString})${returnTypeString} {\n\t\${1}\n}`;
					documentationCallback = `(${actionArgsString})${returnTypeString} {\n}`;
				}

				docblockLines.push(' */');

				const docBlocksEnabled: boolean = vscode.workspace.getConfiguration(meta.name).get('docBlocks.enable') ?? true;
				const lineLeadingMatch = document.lineAt(position).text.match(/^[\s]+/);
				const lineLeadingWhitespace = lineLeadingMatch ? lineLeadingMatch[0] : '';

				const completionClosure = new vscode.CompletionItem('Closure', vscode.CompletionItemKind.Function);
				completionClosure.insertText = new vscode.SnippetString(`function${snippetCallback}${suffix}`);
				completionClosure.documentation = `function${documentationCallback}${suffix}`;
				completionClosure.preselect = true;
				completionClosure.sortText = '1';

				if (docBlocksEnabled) {
					completionClosure.additionalTextEdits = [
						vscode.TextEdit.insert(position.with({ character: 0 }), `${docblockLines.map((line) => `${lineLeadingWhitespace}${line}`).join('\n')}\n`),
					];
				}

				completions.push(completionClosure);

				if (hook.type === 'filter') {
					const completionArrow = new vscode.CompletionItem('Arrow function', vscode.CompletionItemKind.Function);

					const snippetArrow = `( ${snippetArgsString} )${returnTypeString} => \\${params[0].variable}\${1}`;
					const documentationArrow = `( ${docArgsString} )${returnTypeString} => ${params[0].variable}`;

					completionArrow.insertText = new vscode.SnippetString(`fn${snippetArrow}${suffix}`);
					completionArrow.documentation = `fn${documentationArrow}${suffix}`;
					completionArrow.sortText = '2';

					if (docBlocksEnabled) {
						completionArrow.additionalTextEdits = [
							vscode.TextEdit.insert(position.with({ character: 0 }), `${docblockLines.map((line) => `${lineLeadingWhitespace}${line}`).join('\n')}\n`),
						];
					}

					completions.push(completionArrow);

					const snippets = {
						__return_true: 'Return true',
						__return_false: 'Return false',
						__return_zero: 'Return zero',
						__return_empty_array: 'Return empty array',
						__return_empty_string: 'Return empty string',
					};
					const snippetTypes: { [key: string]: string[] } = {
						null: [
						],
						self: [
						],
						array: [
							'__return_empty_array',
						],
						callable: [
						],
						bool: [
							'__return_true',
							'__return_false',
						],
						float: [
							'__return_zero',
						],
						int: [
							'__return_zero',
						],
						string: [
							'__return_empty_string',
						],
						iterable: [
							'__return_empty_array',
						],
						object: [
						],
					};

					for (const [snippet, documentation] of Object.entries(snippets)) {
						// If we don't know the types, show this snippet:
						let show = !params[0].types;

						if (params[0].types) {
							for (const paramType of params[0].types) {
								// If there's a parameter type which we're not aware of, show this snippet:
								if (!(paramType in snippetTypes)) {
									show = true;
									break;
								}

								// If this parameter type supports this snippet, show it:
								if (snippetTypes[paramType].includes(snippet)) {
									show = true;
								}
							}
						}

						if (show) {
							const itemSnippet = `'${snippet}' `;
							const completionItem = new vscode.CompletionItem(documentation, vscode.CompletionItemKind.Function);

							completionItem.insertText = new vscode.SnippetString(itemSnippet);
							completionItem.documentation = itemSnippet;
							completionItem.sortText = '3';

							completions.push(completionItem);
						}
					}

					const snippet = '\'__return_null\' ';

					const nullCompletionItem = new vscode.CompletionItem('Return null', vscode.CompletionItemKind.Function);
					nullCompletionItem.insertText = new vscode.SnippetString(snippet);
					nullCompletionItem.documentation = snippet;
					nullCompletionItem.sortText = '4';

					completions.push(nullCompletionItem);
				}

				if (vscode.window.activeTextEditor !== undefined) {
					return vscode.commands
						.executeCommand<vscode.DocumentSymbol[]>(
							'vscode.executeDocumentSymbolProvider',
							vscode.window.activeTextEditor.document.uri,
						)
						.then((symbols) => {
							const functionName = `${hook.type}_${hook.name.replace(/[^a-z_]/g, '')}`;
							const completionFunction = new vscode.CompletionItem('Function', vscode.CompletionItemKind.Function);
							const insertFunction = `function ${functionName}${documentationCallback}`;
							let insertionPosition = document.lineAt(position.line).range.end;

							completionFunction.insertText = new vscode.SnippetString(`'${functionName}'${suffix}`);
							completionFunction.documentation = `'${functionName}'${suffix}\n\nfunction ${functionName}${documentationCallback}`;

							completionFunction.preselect = true;
							completionFunction.sortText = '0';
							completionFunction.additionalTextEdits = [];

							if (symbols === undefined) {
								completionFunction.additionalTextEdits.push(
									vscode.TextEdit.insert(insertionPosition, '\n\n'),
								);

								if (docBlocksEnabled) {
									completionFunction.additionalTextEdits.push(
										vscode.TextEdit.insert(insertionPosition, `${docblockLines.join('\n')}\n`),
									);
								}

								completionFunction.additionalTextEdits.push(
									vscode.TextEdit.insert(insertionPosition, insertFunction),
								);

								completions.push(completionFunction);

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
								const completionMethod = new vscode.CompletionItem('Class method', vscode.CompletionItemKind.Method);
								completionMethod.insertText = new vscode.SnippetString(`[ \\$this, '${functionName}' ]${suffix}`);
								completionMethod.documentation = `[ $this, '${functionName}' ]${suffix}\n\npublic function ${functionName}${documentationCallback}`;
								completionMethod.preselect = true;
								completionMethod.sortText = '0';
								completionMethod.additionalTextEdits = [];

								let insertMethod = `public function ${functionName}${documentationCallback}`;

								insertMethod = insertMethod.split('\n').map((line) => `${leadingWhitespace}${line}`).join('\n');

								completionMethod.additionalTextEdits.push(
									vscode.TextEdit.insert(positionContext.symbol.range.end, '\n\n'),
								);

								if (docBlocksEnabled) {
									completionMethod.additionalTextEdits.push(
										vscode.TextEdit.insert(positionContext.symbol.range.end, `${docblockLines.map((line) => `${leadingWhitespace}${line}`).join('\n')}\n`),
									);
								}

								completionMethod.additionalTextEdits.push(
									vscode.TextEdit.insert(positionContext.symbol.range.end, insertMethod),
								);

								completions.push(completionMethod);
							} else {
								if (positionContext.inNamespace) {
									completionFunction.insertText = new vscode.SnippetString(`__NAMESPACE__ . '\\\\\\\\${functionName}'${suffix}`);
									completionFunction.documentation = `__NAMESPACE__ . '\\\\${functionName}'${suffix}\n\nfunction ${functionName}${documentationCallback}`;
								}

								if (positionContext.symbol) {
									insertionPosition = positionContext.symbol.range.end;
								}

								completionFunction.additionalTextEdits.push(
									vscode.TextEdit.insert(insertionPosition, '\n\n'),
								);

								if (docBlocksEnabled) {
									completionFunction.additionalTextEdits.push(
										vscode.TextEdit.insert(insertionPosition, `${docblockLines.map((line) => `${leadingWhitespace}${line}`).join('\n')}\n`),
									);
								}

								completionFunction.additionalTextEdits.push(
									vscode.TextEdit.insert(insertionPosition, insertFunction),
								);

								completions.push(completionFunction);
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

	const hoverProvider = vscode.languages.registerHoverProvider(
		'php',
		{
			provideHover(document, position) {
				const linePrefix = document.lineAt(position).text.substr(0, position.character);

				if (!isInAction(linePrefix) && !isInFilter(linePrefix)) {
					return undefined;
				}

				const hook = getHook(document.getText(document.getWordRangeAtPosition(position)));

				if (!hook) {
					return undefined;
				}

				return new vscode.Hover([
					new vscode.MarkdownString().appendCodeblock(hook.doc.description),
					getHookDescription(hook),
				]);
			},
		},
	);

	const definitionProvider = vscode.languages.registerDefinitionProvider(
		'php',
		{
			provideDefinition(document, position) {
				const pos = document.getWordRangeAtPosition(position);

				if (!pos) {
					return undefined;
				}

				const linePrefix = document.lineAt(position).text.substr(0, pos.end.character);

				if (!isInHookUse(linePrefix)) {
					return undefined;
				}

				const namespacedFunctionCallback = isInCurrentNamespaceFunctionCallback(linePrefix);

				if (namespacedFunctionCallback) {
					const currentNamespace = getCurrentNamespace();

					if (!currentNamespace) {
						return undefined;
					}

					return currentNamespace.then((namespace) => {
						if (!namespace) {
							return undefined;
						}

						return getSymbolLocationForNamespacedFunction(namespace, namespacedFunctionCallback);
					});
				}

				const functionCallback = isInFunctionCallback(linePrefix);

				if (functionCallback) {
					return getSymbolLocationForGlobalFunction(functionCallback);
				}

				return undefined;
			},
		},
	);

	context.subscriptions.push(hooksProvider, callbackProvider, hoverProvider, definitionProvider);
}
