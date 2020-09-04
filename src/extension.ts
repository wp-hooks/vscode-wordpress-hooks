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

interface tagType {
	type: string;
	nullable: boolean;
}

function getTagType( tag: Tag ): tagType | null {
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

	let tagType: tagType = {
		type: '',
		nullable: false,
	};

	// Type declarations disabled? Bail.
	if ( ! typeDeclarationsSupport ) {
		return null;
	}

	// No type info? Bail.
	if ( ! tag.types ) {
		return null;
	}

	let types = [ ...tag.types ];

	// Handle nullable type.
	if ( types.length === 2 && typeDeclarationsSupport >= 7.1 ) {
		if ( types[0] === 'null' ) {
			types.splice( 0, 1 );
			tagType.nullable = true;
		} else if ( types[1] === 'null' ) {
			types.splice( 1, 1 );
			tagType.nullable = true;
		}
	}

	// More than one type? Bail.
	if ( types.length !== 1 ) {
		return null;
	}

	let type = types[0];

	// Un-hintable type? Bail.
	if ( [ 'mixed' ].includes( type ) ) {
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

	tagType.type = type;

	return tagType;
}

function getReturnType( tag: Tag ) : tagType | null {
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

					if ( ! type ) {
						return val;
					}

					if ( ! type.nullable ) {
						return `${type.type} ${val}`;
					}

					return `\?${type.type} ${val}`;
				} ).join( ', ' );
				const docArgsString = snippetArgsString.replace( /\\\$/g, '$' );

				let snippetCallback = '';
				let documentationCallback = '';
				let docblockLines = [
					'/**',
					' * ' + hook.doc.description,
					' *',
				];
				let paramTypeLengths: number[] = [ 0 ];
				let paramNameLengths: number[] = [ 0 ];

				params.forEach( function( param ) {
					param.types && paramTypeLengths.push( param.types.join( '|' ).length );
					param.variable && paramNameLengths.push( param.variable.length );
				} );

				const longestParamType = Math.max( ...paramTypeLengths );
				const longestParamName = Math.max( ...paramNameLengths );

				params.forEach( function( param ) {
					docblockLines.push( ' * @param ' + ( param.types?.join( '|' ).padEnd( longestParamType, ' ' ) || '' ) + ' ' + ( param.variable?.padEnd( longestParamName, ' ' ) || '' ) + ' ' + param.content );
				} );

				const suffix = ( params.length > 1 ? ', 10, ' + params.length + ' ' : ' ' );

				if ( 'filter' === hook.type ) {
					let returnTypeString = '';
					const returnType = getReturnType( params[0] );

					if ( returnType ) {
						if ( returnType.nullable ) {
							returnTypeString = ` : \?${returnType.type}`;
						} else {
							returnTypeString = ` : ${returnType.type}`;
						}
					}

					snippetCallback = '( ' + snippetArgsString + ' )' + returnTypeString + ' {\n\t${1}\n\treturn \\' + params[0].variable + ';\n}';
					documentationCallback = '( ' + docArgsString + ' )' + returnTypeString + ' {\n\treturn ' + params[0].variable + ';\n}';

					docblockLines.push( ' * @return ' + ( params[0].types?.join( '|' ) || '' ) + ' ' + params[0].content );
				} else {
					let returnTypeString = ( getMinPHPVersion() >= 7.1 )
						? ' : void' : '';
					snippetCallback = '(' + ( snippetArgsString ? ' ' + snippetArgsString + ' ' : '' ) + ')' + returnTypeString + ' {\n\t${1}\n}';
					documentationCallback = '(' + ( docArgsString ? ' ' + docArgsString + ' ' : '' ) + ')' + returnTypeString + ' {\n}';
				}

				docblockLines.push( ' */' );

				var completionClosure = new vscode.CompletionItem('Closure', vscode.CompletionItemKind.Function);
				completionClosure.insertText = new vscode.SnippetString( `function${snippetCallback}${suffix}` );
				completionClosure.documentation = `function${documentationCallback}${suffix}`;
				completionClosure.preselect = true;

				const docBlocksEnabled: boolean = vscode.workspace.getConfiguration( meta.name ).get('docBlocks.enable') ?? true;
				const lineLeadingMatch = document.lineAt(position).text.match( /^[\s]+/ );
				const lineLeadingWhitespace = lineLeadingMatch ? lineLeadingMatch[0] : '';

				if ( docBlocksEnabled ) {
					completionClosure.additionalTextEdits = [
						vscode.TextEdit.insert( position.with( { character: 0 } ), docblockLines.map( line => `${lineLeadingWhitespace}${line}` ).join( '\n' ) + '\n' ),
					];
				}

				completions.push( completionClosure );

				if ( 'filter' === hook.type ) {
					const snippets = {
						__return_true: 'Return true',
						__return_false: 'Return false',
						__return_zero: 'Return zero',
						__return_empty_array: 'Return empty array',
						__return_empty_string: 'Return empty string'
					};
					const snippetTypes: { [key: string]: string[] } = {
						'null': [
						],
						'self': [
						],
						'array': [
							'__return_empty_array',
						],
						'callable': [
						],
						'bool': [
							'__return_true',
							'__return_false',
						],
						'float': [
							'__return_zero',
						],
						'int': [
							'__return_zero',
						],
						'string': [
							'__return_empty_string',
						],
						'iterable': [
							'__return_empty_array',
						],
						'object': [
						],
					};

					for ( let [ snippet, documentation ] of Object.entries( snippets ) ) {
						// If we don't know the types, show this snippet:
						let show = ! params[0].types;

						if ( params[0].types ) {
							for ( let paramType of params[0].types ) {
								// If there's a parameter type which we're not aware of, show this snippet:
								if ( ! ( paramType in snippetTypes ) ) {
									show = true;
									break;
								}

								// If this parameter type supports this snippet, show it:
								if ( snippetTypes[ paramType ].includes( snippet ) ) {
									show = true;
								}
							}
						}

						if ( ! show ) {
							continue;
						}

						snippet = `'${snippet}' `;

						var completionItem = new vscode.CompletionItem( documentation, vscode.CompletionItemKind.Function );
						completionItem.insertText = new vscode.SnippetString( snippet );
						completionItem.documentation = snippet;

						completions.push( completionItem );
					}

					let snippet = `'__return_null' `;

					var nullCompletionItem = new vscode.CompletionItem( 'Return null', vscode.CompletionItemKind.Function );
					nullCompletionItem.insertText = new vscode.SnippetString( snippet );
					nullCompletionItem.documentation = snippet;
					nullCompletionItem.sortText = 'z';

					completions.push( nullCompletionItem );
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
								let completionMethod = new vscode.CompletionItem('Class method', vscode.CompletionItemKind.Method);
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
								let completionFunction = new vscode.CompletionItem('Function', vscode.CompletionItemKind.Function);
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
