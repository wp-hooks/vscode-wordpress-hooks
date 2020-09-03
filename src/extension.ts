import * as vscode from 'vscode';
import actions from '@johnbillion/wp-hooks/hooks/actions.json';
import filters from '@johnbillion/wp-hooks/hooks/filters.json';
import { Hook, Tag } from '@johnbillion/wp-hooks/interface';
import * as meta from '../package.json';

function get_hook_completion( hook: Hook ): vscode.CompletionItem {
	var completion = new vscode.CompletionItem(hook.name, vscode.CompletionItemKind.Value);
	completion.detail = hook.doc.description;

	var description = hook.doc.long_description;

	description += "\n\n";

	const params = hook.doc.tags.filter( tag => 'param' === tag.name );

	params.forEach(function( tag: Tag ){
		if ( ! tag.types ) {
			return;
		}

		const types = tag.types.join('|');
		description += "\n\n";
		description += '_@param_' + " `" + types + " " + tag.variable + "`  \n";
		description += tag.content;
	});

	const everything_else = hook.doc.tags.filter( tag => 'param' !== tag.name );

	everything_else.forEach(function( tag: Tag ){
		description += "\n\n";
		description += '_@' + tag.name + '_' + " " + ( tag.content || "" ) + " " + ( tag.description || "" );
	});

	completion.documentation = new vscode.MarkdownString( description );

	return completion;
}

function isInFilter(line: string): RegExpMatchArray | null {
	return line.match( /(add|remove|has|doing)_filter\([\s]*('|")[^"|']*$/ );
}

function isInAction(line: string): RegExpMatchArray | null {
	return line.match( /(add|remove|has|doing|did)_action\([\s]*('|")[^"|']*$/ );
}

function isInFunctionDeclaration(line: string): RegExpMatchArray | null {
	return line.match( /add_(filter|action)\([\s]*['|"]([\S]+?)['|"],[\s]*[\w]*?$/ );
}

function getHook( name: string ): Hook | void {
	var hooks = filters.filter( filter => filter.name === name );

	if ( hooks.length == 0 ) {
		hooks = actions.filter( action => action.name === name );
	}

	if ( hooks.length ) {
		return hooks[0];
	}
}

function getTagType( tag: Tag ): string | null {
	const typeDeclarationsSupport = getMinPHPVersion();

	// https://www.php.net/manual/en/functions.arguments.php#functions.arguments.type-declaration
	const allowedTypes: { [key: string]: number } = {
		'self' :     5.0,
		'array' :    5.1,
		'callable' : 5.4,
		'bool' :     7.0,
		'float' :    7.0,
		'int' :      7.0,
		'string' :   7.0,
		'iterable' : 7.1,
		'object' :   7.2,
	};

	// Type declarations disabled? Bail.
	if ( ! typeDeclarationsSupport ) {
		return null;
	}

	// No type info? Bail.
	if ( ! tag.types ) {
		return null;
	}

	// More than one type? Bail.
	if ( tag.types.length !== 1 ) {
		return null;
	}

	let type = tag.types[0];

	// Un-hintable type? Bail.
	if ( [ 'null', 'mixed' ].includes( type ) ) {
		return null;
	}

	// Hinting for typed-arrays.
	if ( type.indexOf( '[]' ) !== -1 ) {
		type = 'array';
	}

	// Aliases for bool.
	if ( [ 'false', 'true', 'boolean' ].includes( type ) ) {
		type = 'bool';
	}

	// Alias for callable.
	if ( type === 'callback' ) {
		type = 'callable';
	}

	// Alias for int.
	if ( type === 'integer' ) {
		type = 'int';
	}

	// Check the allowed types, ignoring unknown types such as class and interface names.
	if ( allowedTypes[ type ] && ( allowedTypes[ type ] > typeDeclarationsSupport ) ) {
		return null;
	}

	return type;
}

function getReturnType( tag: Tag ) : string | null {
	// Return type declarations require PHP 7 or higher.
	if ( getMinPHPVersion() < 7 ) {
		return null;
	}

	return getTagType( tag );
}

function getMinPHPVersion() : number {
	const typeDeclarationsEnabled: boolean = vscode.workspace.getConfiguration( meta.name ).get('typeDeclarations.enable') ?? true;
	let typeDeclarationsSupportSetting: string = vscode.workspace.getConfiguration( meta.name ).get('typeDeclarations.olderPhpVersionSupport') ?? '';

	if ( ! typeDeclarationsEnabled ) {
		return 0;
	}

	if ( ! typeDeclarationsSupportSetting || 'None' === typeDeclarationsSupportSetting ) {
		return 999;
	}

	return parseFloat( typeDeclarationsSupportSetting );
}

interface contextualPosition {
	symbol: vscode.DocumentSymbol | null;
	inNamespace: boolean;
	inMethod: boolean;
	inFunction: boolean;
}

function getContainingSymbol( symbols: vscode.DocumentSymbol[], position: vscode.Position ) : contextualPosition {
	const inside = symbols.filter(symbol => symbol.range.contains(position));
	const inNamespace = symbols.filter(symbol => ( vscode.SymbolKind.Namespace === symbol.kind )).length > 0;

	let context: contextualPosition = {
		symbol: null,
		inNamespace,
		inMethod: false,
		inFunction: false,
	};

	if ( ! inside.length ) {
		return context;
	}

	context.symbol = inside[0];

	if ( context.symbol.children.length ) {
		const methods = context.symbol.children.filter(symbol => symbol.range.contains(position));
		if ( methods.length ) {
			context.symbol = methods[0];
		}
	}

	context.inMethod = ( context.symbol.kind === vscode.SymbolKind.Method );
	context.inFunction = ( context.symbol.kind === vscode.SymbolKind.Function );

	return context;
}

export function activate(context: vscode.ExtensionContext): void {
	const hooksProvider = vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads a certain value and if so then complete
				let linePrefix = document.lineAt(position).text.substr(0, position.character);

				if ( isInAction( linePrefix ) ) {
					return actions.map(get_hook_completion);
				}

				if ( isInFilter( linePrefix ) ) {
					return filters.map(get_hook_completion);
				}

				return undefined;
			}
		},
		"'",
		'"'
	);

	const callbackProvider = vscode.languages.registerCompletionItemProvider(
		'php',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads a certain value and if so then complete
				let linePrefix  = document.lineAt(position).text.substr(0, position.character);
				let declaration = isInFunctionDeclaration( linePrefix );

				if ( ! declaration ) {
					return undefined;
				}

				const hook = getHook( declaration[2] );

				if ( ! hook ) {
					return undefined;
				}

				let completions: vscode.CompletionItem[] = [];

				const params            = hook.doc.tags.filter( tag => 'param' === tag.name );
				const snippetArgsString = params.map( function( param ) {
					let val = `\\${param.variable}`;
					let type = getTagType( param );

					return type ? ( type + ' ' + val ) : val;
				} ).join( ', ' );
				const docArgsString = snippetArgsString.replace( /\\\$/g, '$' );

				let snippetCallback = '';
				let documentationCallback = '';
				let docblockLines = [
					' ' + hook.doc.description,
					'',
				];
				let longestParamType = 0;
				let longestParamName = 0;

				params.forEach( function( param ) {
					const paramTypeLength = param.types?.join( '|' ).length || 0;
					const paramNameLength = param.variable?.length || 0;

					if ( paramTypeLength > longestParamType ) {
						longestParamType = paramTypeLength;
					}

					if ( paramNameLength > longestParamName ) {
						longestParamName = paramNameLength;
					}
				} );

				params.forEach( function( param ) {
					docblockLines.push( ' @param ' + ( param.types?.join( '|' ).padEnd( longestParamType, ' ' ) || '' ) + ' ' + ( param.variable?.padEnd( longestParamName, ' ' ) || '' ) + ' ' + param.content );
				} );

				const suffix = ( params.length > 1 ? ', 10, ' + params.length + ' ' : ' ' );

				if ( 'filter' === hook.type ) {
					let returnType = null;
					let returnTypeString = '';

					returnType = getReturnType( params[0] );

					if ( returnType ) {
						returnTypeString = ' : ' + returnType;
					}

					snippetCallback = '( ' + snippetArgsString + ' )' + returnTypeString + ' {\n\t${1}\n\treturn \\' + params[0].variable + ';\n}';
					documentationCallback = '( ' + docArgsString + ' )' + returnTypeString + ' {\n\treturn ' + params[0].variable + ';\n}';

					docblockLines.push( ' @return ' + ( params[0].types?.join( '|' ) || '' ) + ' ' + params[0].content );
				} else {
					let returnTypeString = ( getMinPHPVersion() >= 7.1 )
						? ' : void' : '';
					snippetCallback = '(' + ( snippetArgsString ? ' ' + snippetArgsString + ' ' : '' ) + ')' + returnTypeString + ' {\n\t${1}\n}';
					documentationCallback = '(' + ( docArgsString ? ' ' + docArgsString + ' ' : '' ) + ')' + returnTypeString + ' {\n}';
				}

				let docblockCallback = '/**\n *' + docblockLines.join( '\n *' ) + '\n */\n';

				var completionClosure = new vscode.CompletionItem('Closure callback', vscode.CompletionItemKind.Function);
				completionClosure.insertText = new vscode.SnippetString( `function${snippetCallback}${suffix}` );
				completionClosure.documentation = `function${documentationCallback}${suffix}`;
				completionClosure.preselect = true;

				const docBlocksEnabled: boolean = vscode.workspace.getConfiguration( meta.name ).get('docBlocks.enable') ?? true;

				if ( docBlocksEnabled ) {
					completionClosure.additionalTextEdits = [
						vscode.TextEdit.insert( position.with( { character: 0 } ), docblockCallback ),
					];
				}

				completions.push( completionClosure );

				if ( 'filter' === hook.type ) {
					const snippets = {
						__return_true: 'Return true',
						__return_false: 'Return false',
						__return_zero: 'Return zero',
						__return_null: 'Return null',
						__return_empty_array: 'Return empty array',
						__return_empty_string: 'Return empty string'
					};

					for ( let [ snippet, documentation ] of Object.entries( snippets ) ) {
						snippet = `'${snippet}' `;

						var completionItem = new vscode.CompletionItem( documentation, vscode.CompletionItemKind.Function );
						completionItem.insertText = new vscode.SnippetString( snippet );
						completionItem.documentation = snippet;

						completions.push( completionItem );
					}
				}

				if (vscode.window.activeTextEditor !== undefined) {
					return vscode.commands
						.executeCommand<vscode.DocumentSymbol[]>(
							'vscode.executeDocumentSymbolProvider',
							vscode.window.activeTextEditor.document.uri
						)
						.then(symbols => {
							if (symbols === undefined) {
								// @TODO this needs to return a non-positional function
								return completions;
							}

							const context = getContainingSymbol( symbols, position );

							let functionName = hook.type + '_' + hook.name.replace( /[^a-z_]/g, '' );

							if ( context.inMethod && context.symbol ) {
								let completionMethod = new vscode.CompletionItem('Method callback', vscode.CompletionItemKind.Method);
								completionMethod.insertText = new vscode.SnippetString( `[ \\$this, '${functionName}' ]${suffix}` );
								completionMethod.documentation = `[ \$this, '${functionName}' ]${suffix}\n\npublic function ${functionName}${documentationCallback}`;
								completionMethod.preselect = true;
								completionMethod.sortText = 'a';
								completionMethod.additionalTextEdits = [];

								const insertMethod = `public function ${functionName}${documentationCallback}`;

								completionMethod.additionalTextEdits.push(
									vscode.TextEdit.insert( context.symbol.range.end, `\n\n` ),
								);

								if ( docBlocksEnabled ) {
									completionMethod.additionalTextEdits.push(
										vscode.TextEdit.insert( context.symbol.range.end, `${docblockCallback}` ),
									);
								}

								completionMethod.additionalTextEdits.push(
									vscode.TextEdit.insert( context.symbol.range.end, insertMethod ),
								);

								completions.push( completionMethod );
							} else {
								let completionFunction = new vscode.CompletionItem('Function callback', vscode.CompletionItemKind.Function);
								const insertFunction = `function ${functionName}${documentationCallback}`;

								if ( context.inNamespace ) {
									completionFunction.insertText = new vscode.SnippetString( `__NAMESPACE__ . '\\\\\\\\${functionName}'${suffix}` );
									completionFunction.documentation = `__NAMESPACE__ . '\\\\${functionName}'${suffix}\n\nfunction ${functionName}${documentationCallback}`;
								} else {
									completionFunction.insertText = new vscode.SnippetString( `'${functionName}'${suffix}` );
									completionFunction.documentation = `'${functionName}'${suffix}\n\nfunction ${functionName}${documentationCallback}`;
								}

								completionFunction.preselect = true;
								completionFunction.sortText = 'a';
								completionFunction.additionalTextEdits = [];

								let insertionPosition: vscode.Position = document.lineAt(position.line).range.end;

								if ( context.symbol ) {
									insertionPosition = context.symbol.range.end;
								}

								completionFunction.additionalTextEdits.push(
									vscode.TextEdit.insert( insertionPosition, `\n\n` ),
								);

								if ( docBlocksEnabled ) {
									completionFunction.additionalTextEdits.push(
										vscode.TextEdit.insert( insertionPosition, docblockCallback ),
									);
								}

								completionFunction.additionalTextEdits.push(
									vscode.TextEdit.insert( insertionPosition, insertFunction ),
								);

								completions.push( completionFunction );
							}

							return completions;
						})
					;
				}

				return completions;
			}
		},
		',',
		' '
	);

	context.subscriptions.push(hooksProvider,callbackProvider);
}
