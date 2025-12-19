import * as vscode from 'vscode';
import { evaluate, getEnvironment, setDisplayOutput } from './scheme';

// 괄호 매칭을 통해 완전한 표현식 추출
function extractExpressions(text: string): string[] {
	const expressions: string[] = [];
	let current = '';
	let depth = 0;
	let inString = false;
	let stringChar = '';
	let i = 0;

	// 주석 제거 (;;로 시작하는 줄)
	const lines = text.split(/\r?\n/);
	const cleanedLines: string[] = [];
	
	for (const line of lines) {
		const trimmed = line.trim();
		// 빈 줄이거나 ;;로 시작하는 주석 줄은 건너뛰기
		if (trimmed.length === 0 || trimmed.startsWith(';;')) {
			continue;
		}
		// 줄 내부의 주석 제거 (;; 이후 부분)
		const commentIndex = trimmed.indexOf(';;');
		if (commentIndex !== -1) {
			cleanedLines.push(trimmed.substring(0, commentIndex).trim());
		} else {
			cleanedLines.push(trimmed);
		}
	}
	
	const cleanedText = cleanedLines.join(' ').trim();
	if (cleanedText.length === 0) {
		return [];
	}

	while (i < cleanedText.length) {
		const char = cleanedText[i];
		const prevChar = i > 0 ? cleanedText[i - 1] : '';

		// 문자열 처리
		if ((char === '"' || char === "'") && prevChar !== '\\') {
			if (!inString) {
				inString = true;
				stringChar = char;
				current += char;
			} else if (char === stringChar) {
				inString = false;
				stringChar = '';
				current += char;
			} else {
				current += char;
			}
		} else {
			current += char;

			if (!inString) {
				if (char === '(') {
					if (depth === 0) {
						// 이전에 단일 토큰이 있었다면 저장
						const beforeParen = current.slice(0, -1).trim();
						if (beforeParen.length > 0) {
							expressions.push(beforeParen);
							current = '(';
						}
					}
					depth++;
				} else if (char === ')') {
					depth--;
					if (depth === 0) {
						// 완전한 표현식 발견
						const expr = current.trim();
						if (expr.length > 0) {
							expressions.push(expr);
						}
						current = '';
					}
				} else if (depth === 0) {
					// 괄호 밖에서 공백을 만나면 단일 토큰 표현식일 수 있음
					if (char === ' ' || char === '\t') {
						const trimmed = current.trim();
						if (trimmed.length > 0) {
							expressions.push(trimmed);
							current = '';
						}
					}
				}
			}
		}
		i++;
	}

	// 마지막 남은 표현식 처리
	const remaining = current.trim();
	if (remaining.length > 0 && depth === 0) {
		expressions.push(remaining);
	}

	// 빈 표현식 제거 및 정리
	return expressions
		.map(expr => expr.trim())
		.filter(expr => expr.length > 0);
}

export function activate(context: vscode.ExtensionContext) {
	let scheme = vscode.window.createOutputChannel("Scheme");
	
	// display 함수를 출력 채널에 연결
	setDisplayOutput((value: any) => {
		scheme.append(formatValue(value));
	});
	
	// 기존 run 명령
	let disposable = vscode.commands.registerCommand('sdscheme.run', (event) => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const text = document.getText();
			const expressions = extractExpressions(text);
			
			if (expressions.length > 0) {
				scheme.show(true);
				scheme.appendLine('--- 실행 시작 ---');
				
				expressions.forEach((expr, index) => {
					try {
						scheme.appendLine(`> ${expr}`);
						const result = evaluate(expr);
						if (result !== undefined) {
							scheme.appendLine(`=> ${formatValue(result)}`);
						}
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						scheme.appendLine(`❌ Error: ${message}`);
						vscode.window.showErrorMessage(`Scheme Error: ${message}`);
					}
					if (index < expressions.length - 1) {
						scheme.appendLine('');
					}
				});
				
				scheme.appendLine('--- 실행 완료 ---');
			} else {
				scheme.appendLine('실행할 표현식이 없습니다.');
			}
		}
	});

	// 선택된 코드만 실행
	let runSelectionDisposable = vscode.commands.registerCommand('sdscheme.runSelection', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const text = selection.isEmpty 
				? editor.document.getText() 
				: editor.document.getText(selection);
			
			const expressions = extractExpressions(text);
			
			if (expressions.length > 0) {
				scheme.show(true);
				scheme.appendLine('--- 선택 영역 실행 ---');
				
				expressions.forEach((expr, index) => {
					try {
						scheme.appendLine(`> ${expr}`);
						const result = evaluate(expr);
						if (result !== undefined) {
							scheme.appendLine(`=> ${formatValue(result)}`);
						}
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						scheme.appendLine(`❌ Error: ${message}`);
						vscode.window.showErrorMessage(`Scheme Error: ${message}`);
					}
					if (index < expressions.length - 1) {
						scheme.appendLine('');
					}
				});
				
				scheme.appendLine('--- 실행 완료 ---');
			} else {
				scheme.appendLine('실행할 표현식이 없습니다.');
			}
		}
	});

	// 출력 채널 초기화
	let clearOutputDisposable = vscode.commands.registerCommand('sdscheme.clearOutput', () => {
		scheme.clear();
		scheme.appendLine('출력이 초기화되었습니다.');
	});

	// 환경 변수 목록 표시
	let showEnvironmentDisposable = vscode.commands.registerCommand('sdscheme.showEnvironment', () => {
		const env = getEnvironment();
		scheme.show(true);
		scheme.appendLine('--- 현재 환경 변수 ---');
		
		const keys = Object.keys(env).sort();
		if (keys.length === 0) {
			scheme.appendLine('정의된 변수가 없습니다.');
		} else {
			keys.forEach(key => {
				const value = env[key];
				if (typeof value === 'function') {
					scheme.appendLine(`${key}: [함수]`);
				} else {
					scheme.appendLine(`${key}: ${formatValue(value)}`);
				}
			});
		}
		scheme.appendLine('---');
	});

	context.subscriptions.push(disposable, runSelectionDisposable, clearOutputDisposable, showEnvironmentDisposable);
}

// 값 포맷팅 함수
function formatValue(value: any): string {
	if (value === null || value === undefined) {
		return 'null';
	}
	if (typeof value === 'string') {
		return `"${value}"`;
	}
	if (Array.isArray(value)) {
		return `(${value.map(formatValue).join(' ')})`;
	}
	if (typeof value === 'function') {
		return '[함수]';
	}
	return String(value);
}

export function deactivate() { }
