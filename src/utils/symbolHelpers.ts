import * as vscode from 'vscode';
import { ContextualPosition } from '../types';

export function getContainingSymbol(
	symbols: vscode.DocumentSymbol[],
	position: vscode.Position,
) : ContextualPosition {
	const inside = symbols.filter((symbol) => symbol.range.contains(position));
	const inNamespace = symbols.filter((symbol) => (vscode.SymbolKind.Namespace === symbol.kind)).length > 0;

	const context: ContextualPosition = {
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
