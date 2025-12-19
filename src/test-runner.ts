import * as fs from 'fs';
import * as path from 'path';
import { evaluate, setDisplayOutput } from './scheme';

// 괄호 매칭을 통해 완전한 표현식 추출 (extension.ts에서 가져옴)
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

interface ExpressionResult {
	input: string;
	output?: any;
	error?: string;
	displayOutput?: string[];
}

interface TestResult {
	file: string;
	expressions: ExpressionResult[];
	success: boolean;
	totalExpressions: number;
	successfulExpressions: number;
	failedExpressions: number;
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

// display 출력을 수집하기 위한 변수
let displayOutputs: string[] = [];

// display 출력 핸들러 설정
setDisplayOutput((value: any) => {
	displayOutputs.push(formatValue(value));
});

// 단일 Scheme 파일 실행
function runSchemeFile(filePath: string): TestResult {
	const fileName = path.basename(filePath);
	const fileContent = fs.readFileSync(filePath, 'utf-8');
	const expressions = extractExpressions(fileContent);
	
	const results: ExpressionResult[] = [];
	let successfulCount = 0;
	let failedCount = 0;

	// 각 표현식 실행
	for (const expr of expressions) {
		displayOutputs = []; // display 출력 초기화
		
		try {
			const result = evaluate(expr);
			const expressionResult: ExpressionResult = {
				input: expr,
				output: result !== undefined ? result : undefined
			};
			
			if (displayOutputs.length > 0) {
				expressionResult.displayOutput = [...displayOutputs];
			}
			
			results.push(expressionResult);
			successfulCount++;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			results.push({
				input: expr,
				error: message
			});
			failedCount++;
		}
	}

	return {
		file: fileName,
		expressions: results,
		success: failedCount === 0,
		totalExpressions: expressions.length,
		successfulExpressions: successfulCount,
		failedExpressions: failedCount
	};
}

// 결과를 콘솔에 출력
function printTestResult(result: TestResult): void {
	console.log(`\n${'='.repeat(60)}`);
	console.log(`파일: ${result.file}`);
	console.log(`${'='.repeat(60)}`);
	console.log(`총 표현식: ${result.totalExpressions}`);
	console.log(`성공: ${result.successfulExpressions}`);
	console.log(`실패: ${result.failedExpressions}`);
	
	if (result.failedExpressions > 0) {
		console.log(`\n❌ 상태: 실패`);
	} else {
		console.log(`\n✅ 상태: 성공`);
	}
	
	// 실패한 표현식만 간단히 출력
	if (result.failedExpressions > 0) {
		console.log(`\n실패한 표현식:`);
		result.expressions.forEach((expr, index) => {
			if (expr.error) {
				console.log(`  ${index + 1}. ${expr.input.substring(0, 50)}${expr.input.length > 50 ? '...' : ''}`);
				console.log(`     에러: ${expr.error}`);
			}
		});
	}
}

// 결과를 로그 파일에 저장
function saveTestResultToFile(result: TestResult, resultsDir: string): void {
	const logFileName = `${result.file}.log`;
	const logFilePath = path.join(resultsDir, logFileName);
	
	let logContent = `============================================================\n`;
	logContent += `테스트 결과: ${result.file}\n`;
	logContent += `============================================================\n`;
	logContent += `실행 시간: ${new Date().toLocaleString('ko-KR')}\n`;
	logContent += `총 표현식: ${result.totalExpressions}\n`;
	logContent += `성공: ${result.successfulExpressions}\n`;
	logContent += `실패: ${result.failedExpressions}\n`;
	logContent += `상태: ${result.success ? '✅ 성공' : '❌ 실패'}\n`;
	logContent += `============================================================\n\n`;

	result.expressions.forEach((expr, index) => {
		logContent += `[${index + 1}/${result.totalExpressions}] ${expr.input}\n`;
		
		if (expr.error) {
			logContent += `❌ Error: ${expr.error}\n`;
		} else {
			if (expr.output !== undefined) {
				logContent += `=> ${formatValue(expr.output)}\n`;
			}
			if (expr.displayOutput && expr.displayOutput.length > 0) {
				expr.displayOutput.forEach(output => {
					logContent += `[display] ${output}\n`;
				});
			}
		}
		logContent += `\n`;
	});

	fs.writeFileSync(logFilePath, logContent, 'utf-8');
}

// test-results 디렉토리 생성
function ensureResultsDirectory(): string {
	const resultsDir = path.join(process.cwd(), 'test-results');
	if (!fs.existsSync(resultsDir)) {
		fs.mkdirSync(resultsDir, { recursive: true });
	}
	return resultsDir;
}

// examples 폴더의 모든 .scheme 파일 실행
function runAllExamples(): void {
	const examplesDir = path.join(process.cwd(), 'examples');
	const resultsDir = ensureResultsDirectory();
	
	if (!fs.existsSync(examplesDir)) {
		console.error(`❌ examples 폴더를 찾을 수 없습니다: ${examplesDir}`);
		process.exit(1);
	}

	const files = fs.readdirSync(examplesDir)
		.filter(file => file.endsWith('.scheme'))
		.sort()
		.map(file => path.join(examplesDir, file));

	if (files.length === 0) {
		console.error(`❌ examples 폴더에 .scheme 파일이 없습니다.`);
		process.exit(1);
	}

	console.log(`\n📋 ${files.length}개의 예제 파일을 테스트합니다...\n`);

	const allResults: TestResult[] = [];
	let totalSuccess = 0;
	let totalFailed = 0;

	for (const file of files) {
		const result = runSchemeFile(file);
		allResults.push(result);
		printTestResult(result);
		saveTestResultToFile(result, resultsDir);
		
		if (result.success) {
			totalSuccess++;
		} else {
			totalFailed++;
		}
	}

	// 전체 요약
	console.log(`\n${'='.repeat(60)}`);
	console.log(`전체 요약`);
	console.log(`${'='.repeat(60)}`);
	console.log(`총 파일: ${files.length}`);
	console.log(`성공: ${totalSuccess}`);
	console.log(`실패: ${totalFailed}`);
	console.log(`\n상세 로그는 test-results/ 폴더를 확인하세요.`);
	console.log(`${'='.repeat(60)}\n`);
}

// 특정 파일 실행
function runSingleFile(fileName: string): void {
	const examplesDir = path.join(process.cwd(), 'examples');
	const filePath = path.join(examplesDir, fileName);
	
	if (!fs.existsSync(filePath)) {
		console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
		process.exit(1);
	}

	const resultsDir = ensureResultsDirectory();
	const result = runSchemeFile(filePath);
	
	printTestResult(result);
	saveTestResultToFile(result, resultsDir);
	
	console.log(`\n상세 로그: test-results/${result.file}.log\n`);
}

// 메인 실행부
function main(): void {
	const args = process.argv.slice(2);
	
	if (args.length === 0) {
		// 인자가 없으면 모든 예제 실행
		runAllExamples();
	} else if (args.length === 1 && args[0] === '--help' || args[0] === '-h') {
		console.log('사용법:');
		console.log('  npm test              - 모든 예제 파일 실행');
		console.log('  npm run test:file <파일명>  - 특정 파일만 실행');
		console.log('  예: npm run test:file basics.scheme');
	} else {
		// 특정 파일 실행
		const fileName = args[0];
		if (!fileName.endsWith('.scheme')) {
			console.error(`❌ .scheme 파일만 실행할 수 있습니다: ${fileName}`);
			process.exit(1);
		}
		runSingleFile(fileName);
	}
}

main();
