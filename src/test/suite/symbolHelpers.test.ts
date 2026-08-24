import * as assert from 'assert';
import * as vscode from 'vscode';
import { getContainingSymbol } from '../../utils/symbolHelpers';

suite('Symbol Helpers Test Suite', () => {
	suite('getContainingSymbol', () => {
		function createSymbol(
			name: string,
			kind: vscode.SymbolKind,
			range: vscode.Range,
			children: vscode.DocumentSymbol[] = [],
		): vscode.DocumentSymbol {
			return {
				name,
				kind,
				range,
				selectionRange: range,
				children,
			} as vscode.DocumentSymbol;
		}

		test('Should return default context when no symbols contain position', () => {
			const symbols = [
				createSymbol('test', vscode.SymbolKind.Function, new vscode.Range(0, 0, 5, 0)),
			];
			const position = new vscode.Position(10, 0);

			const context = getContainingSymbol(symbols, position);

			assert.strictEqual(context.symbol, null);
			assert.strictEqual(context.inFunction, false);
			assert.strictEqual(context.inMethod, false);
			assert.strictEqual(context.inNamespace, false);
		});

		test('Should detect when inside a function', () => {
			const symbols = [
				createSymbol('myFunction', vscode.SymbolKind.Function, new vscode.Range(0, 0, 10, 0)),
			];
			const position = new vscode.Position(5, 0);

			const context = getContainingSymbol(symbols, position);

			assert.ok(context.symbol);
			assert.strictEqual(context.symbol.name, 'myFunction');
			assert.strictEqual(context.inFunction, true);
			assert.strictEqual(context.inMethod, false);
		});

		test('Should detect when inside a method', () => {
			const method = createSymbol('myMethod', vscode.SymbolKind.Method, new vscode.Range(2, 0, 8, 0));
			const classSymbol = createSymbol('MyClass', vscode.SymbolKind.Class, new vscode.Range(0, 0, 10, 0), [method]);

			const symbols = [classSymbol];
			const position = new vscode.Position(5, 0);

			const context = getContainingSymbol(symbols, position);

			assert.ok(context.symbol);
			assert.strictEqual(context.symbol.name, 'myMethod');
			assert.strictEqual(context.inMethod, true);
			assert.strictEqual(context.inFunction, false);
		});

		test('Should detect namespace presence', () => {
			const symbols = [
				createSymbol('MyNamespace', vscode.SymbolKind.Namespace, new vscode.Range(0, 0, 20, 0)),
			];
			const position = new vscode.Position(5, 0);

			const context = getContainingSymbol(symbols, position);

			assert.strictEqual(context.inNamespace, true);
		});

		test('Should return class symbol when position is in class but not in method', () => {
			const classSymbol = createSymbol('MyClass', vscode.SymbolKind.Class, new vscode.Range(0, 0, 10, 0), [
				createSymbol('myMethod', vscode.SymbolKind.Method, new vscode.Range(2, 0, 4, 0)),
			]);

			const symbols = [classSymbol];
			const position = new vscode.Position(5, 0); // After the method

			const context = getContainingSymbol(symbols, position);

			assert.ok(context.symbol);
			assert.strictEqual(context.symbol.name, 'MyClass');
			assert.strictEqual(context.inMethod, false);
			assert.strictEqual(context.inFunction, false);
		});

		test('Should handle nested symbols correctly', () => {
			const innerMethod = createSymbol('innerMethod', vscode.SymbolKind.Method, new vscode.Range(5, 2, 8, 2));
			const outerClass = createSymbol('OuterClass', vscode.SymbolKind.Class, new vscode.Range(0, 0, 10, 0), [
				innerMethod,
			]);

			const symbols = [outerClass];
			const position = new vscode.Position(6, 0); // Inside innerMethod

			const context = getContainingSymbol(symbols, position);

			assert.ok(context.symbol);
			assert.strictEqual(context.symbol.name, 'innerMethod');
			assert.strictEqual(context.inMethod, true);
		});

		test('Should handle multiple top-level symbols', () => {
			const symbols = [
				createSymbol('function1', vscode.SymbolKind.Function, new vscode.Range(0, 0, 5, 0)),
				createSymbol('function2', vscode.SymbolKind.Function, new vscode.Range(6, 0, 10, 0)),
				createSymbol('function3', vscode.SymbolKind.Function, new vscode.Range(11, 0, 15, 0)),
			];
			const position = new vscode.Position(7, 0); // Inside function2

			const context = getContainingSymbol(symbols, position);

			assert.ok(context.symbol);
			assert.strictEqual(context.symbol.name, 'function2');
			assert.strictEqual(context.inFunction, true);
		});

		test('Should return first matching symbol when multiple overlap', () => {
			const symbols = [
				createSymbol('symbol1', vscode.SymbolKind.Function, new vscode.Range(0, 0, 10, 0)),
				createSymbol('symbol2', vscode.SymbolKind.Function, new vscode.Range(0, 0, 10, 0)),
			];
			const position = new vscode.Position(5, 0);

			const context = getContainingSymbol(symbols, position);

			assert.ok(context.symbol);
			assert.strictEqual(context.symbol.name, 'symbol1');
		});

		test('Should handle empty symbol array', () => {
			const symbols: vscode.DocumentSymbol[] = [];
			const position = new vscode.Position(0, 0);

			const context = getContainingSymbol(symbols, position);

			assert.strictEqual(context.symbol, null);
			assert.strictEqual(context.inFunction, false);
			assert.strictEqual(context.inMethod, false);
			assert.strictEqual(context.inNamespace, false);
		});
	});
});
