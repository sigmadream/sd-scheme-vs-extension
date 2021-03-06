import * as vscode from 'vscode';
import { evaluate } from './scheme';

export function activate(context: vscode.ExtensionContext) {
	let scheme = vscode.window.createOutputChannel("Scheme");
	let disposable = vscode.commands.registerCommand('sdscheme.run', (event) => {
		const editor = vscode.window.activeTextEditor;
		console.log("sdScheme", editor);
		if (editor) {
			const document = editor.document;
			let documentContext = document.getText().split(/\r?\n/);
			let output = documentContext.map((exp) => evaluate(exp)).pop();
			scheme.appendLine("Scheme => " + output);
		}
	});
	context.subscriptions.push(disposable);
}

export function deactivate() { }
