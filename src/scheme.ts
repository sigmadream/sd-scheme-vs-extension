const globalEnv: any = {};

// Math 함수들 추가
Object.getOwnPropertyNames(Math).forEach(method => {
	if (typeof Math[method as keyof typeof Math] === 'function') {
		globalEnv[method] = Math[method as keyof typeof Math];
	}
});
globalEnv["pi"] = Math.PI;
globalEnv["e"] = Math.E;

// 산술 연산자
globalEnv["+"] = (...args: number[]) => args.reduce((a, b) => a + b, 0);
globalEnv["-"] = (x: number, ...args: number[]) => args.length === 0 ? -x : args.reduce((a, b) => a - b, x);
globalEnv["*"] = (...args: number[]) => args.reduce((a, b) => a * b, 1);
globalEnv["/"] = (x: number, ...args: number[]) => args.length === 0 ? 1 / x : args.reduce((a, b) => a / b, x);
globalEnv[">"] = (x: number, y: number) => x > y;
globalEnv["<"] = (x: number, y: number) => x < y;
globalEnv[">="] = (x: number, y: number) => x >= y;
globalEnv["<="] = (x: number, y: number) => x <= y;
globalEnv["remainder"] = (x: number, y: number) => x % y;
globalEnv["modulo"] = (x: number, y: number) => ((x % y) + y) % y;

// 비교 연산자
globalEnv["="] = (x: any, y: any) => JSON.stringify(x) === JSON.stringify(y);
globalEnv["equal?"] = globalEnv["="];
globalEnv["eq?"] = (x: any, y: any) => x === y;
globalEnv["not"] = (x: any) => !x;

// 논리 연산자
globalEnv["or"] = (...args: any[]) => {
	for (const arg of args) {
		if (arg) {
			return arg;
		}
	}
	return args.length > 0 ? args[args.length - 1] : false;
};
globalEnv["and"] = (...args: any[]) => {
	if (args.length === 0) return true;
	for (const arg of args) {
		if (!arg) {
			return arg;
		}
	}
	return args[args.length - 1];
};

// null 리터럴 (빈 리스트)
globalEnv["null"] = null;

// 리스트 함수
globalEnv["list"] = (...x: any[]) => x;
globalEnv["list?"] = (x: any) => Array.isArray(x);
globalEnv["null?"] = (x: any) => x === null || (Array.isArray(x) && x.length === 0);
globalEnv["pair?"] = (x: any) => Array.isArray(x) && x.length > 0;
globalEnv["length"] = (x: any[]) => x.length;
globalEnv["car"] = (x: any[]) => (x && x.length !== 0) ? x[0] : null;
globalEnv["cdr"] = (x: any[]) => (x && x.length > 1) ? x.slice(1) : (x && x.length === 1) ? [] : null;
globalEnv["cons"] = (x: any, y: any) => [x].concat(Array.isArray(y) ? y : (y !== null ? [y] : []));
globalEnv["append"] = (...lists: any[][]) => lists.reduce((acc, list) => acc.concat(list), []);
globalEnv["reverse"] = (list: any[]) => list.slice().reverse();

// 고차 함수
globalEnv["map"] = (cb: Function, list: any[]) => list.map((item) => cb(item));
globalEnv["filter"] = (pred: Function, list: any[]) => list.filter((item) => pred(item));
globalEnv["fold"] = (fn: Function, init: any, list: any[]) => list.reduce((acc, item) => fn(acc, item), init);
globalEnv["reduce"] = globalEnv["fold"];
globalEnv["apply"] = (fn: Function, args: any[]) => fn.apply(null, args);

// 출력 함수 (나중에 extension에서 재정의될 수 있음)
let displayOutput: ((value: any) => void) | null = null;
globalEnv["display"] = (value: any) => {
	if (displayOutput) {
		displayOutput(value);
	} else {
		console.log(value);
	}
};

// display 출력 핸들러 설정 함수
export function setDisplayOutput(handler: (value: any) => void) {
	displayOutput = handler;
}

// 환경 접근 함수
export function getEnvironment(): any {
	return globalEnv;
}

// Token
const tokenize = (input: string) => {
    // 문자열을 먼저 보호 (임시 플레이스홀더로 교체)
    const stringPlaceholders: string[] = [];
    let placeholderIndex = 0;
    
    // 따옴표로 둘러싸인 문자열을 찾아서 플레이스홀더로 교체
    const protectedInput = input.replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, (match) => {
        const placeholder = `__STRING_${placeholderIndex}__`;
        stringPlaceholders[placeholderIndex] = match;
        placeholderIndex++;
        return placeholder;
    });
    
    // 괄호 주변에 공백 추가
    const spaced = protectedInput.replace(/(\()|(\))/g, (_, a, b) => {
        if (a) {
            return ` ${a} `;
        } else {
            return ` ${b} `;
        }
    });
    
    // 공백 정규화 및 토큰화
    const tokens = spaced.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").split(" ");
    
    // 플레이스홀더를 원래 문자열로 복원
    return tokens.map(token => {
        const match = token.match(/^__STRING_(\d+)__$/);
        if (match) {
            return stringPlaceholders[parseInt(match[1])];
        }
        return token;
    });
};

const atom = (token) => {
    // boolean 리터럴 처리
    if (token === "#t" || token === "#true") {
        return true;
    }
    if (token === "#f" || token === "#false") {
        return false;
    }
    // 숫자 변환 시도
    const ret = Number(token);
    return isNaN(ret) ? token : ret;
};

const parse = (tokens: Array<string>) => {
    if (tokens.length === 0) { throw Error("Error: Unexpected EOF while reading!"); }
    const no1 = tokens.shift();
    if (no1 === "(") {
        let list: (string)[] = [];
        while (tokens[0] !== ")") {
            list.push(parse(tokens));
        }
        tokens.shift();
        return list;
    } else if (no1 === ")") {
        throw Error("Error: Unexpected [)]!");
    } else {
        return atom(no1);
    }
};

function merge(a, b) {
    const obj = {};
    for (let key in a) {
        obj[key] = a[key];
    }
    for (let key in b) {
        obj[key] = b[key];
    }
    return obj;
}

const matchString = /(^"(.*)"$)|(^'(.*)'$)/;

function _evaluate(s: string | number | Array<any>, env: any = globalEnv): any {
    if (typeof s === 'string') {
        const ret = s.match(matchString) ? s.replace(matchString, (_, a, b, c, d) => {
            if (b) {
                return b;
            } else {
                return d;
            }
        }) : env[s];
        if (ret === undefined) { 
            throw new Error(`Error: Unbound variable: [${s}]!`);
        }
        return ret;
    } else if (typeof s === "number") {
        return s;
    } else if (typeof s === "boolean") {
        return s;
    } else if (!Array.isArray(s) || s.length === 0) {
        return s;
    } else if (s[0] === "quote") {
        return s[1];
    } else if (s[0] === "if") {
        if (s.length < 3 || s.length > 4) {
            throw new Error("Error: 'if' requires 2 or 3 arguments: (if test then [else])");
        }
        const [_, test, thenExp, elseExp] = s;
        const testResult = _evaluate(test, env);
        const exp = testResult ? thenExp : (elseExp !== undefined ? elseExp : null);
        return _evaluate(exp, env);
    } else if (s[0] === "cond") {
        if (s.length < 2) {
            throw new Error("Error: 'cond' requires at least one clause");
        }
        for (let i = 1; i < s.length; i++) {
            const clause = s[i];
            if (!Array.isArray(clause) || clause.length < 2) {
                throw new Error("Error: 'cond' clause must be a list with at least 2 elements");
            }
            const [test, ...body] = clause;
            if (test === "else" || _evaluate(test, env)) {
                if (body.length === 0) {
                    return test === "else" ? null : _evaluate(test, env);
                }
                return body.map(exp => _evaluate(exp, env)).pop();
            }
        }
        return null;
    } else if (s[0] === "define") {
        if (s.length < 3) {
            throw new Error("Error: 'define' requires at least 2 arguments: (define name value) or (define (name args...) body)");
        }
        if (Array.isArray(s[1])) {
            // 함수 정의: (define (name args...) body)
            const [name, ...params] = s[1];
            const body = s[2];
            env[name] = (...args: any[]) => {
                const tmpEnv: any = {};
                params.forEach((param: any, idx: number) => {
                    tmpEnv[param] = args[idx];
                });
                return _evaluate(body, merge(env, tmpEnv));
            };
            return undefined;
        } else {
            // 변수 정의: (define name value)
            const [_, name, exp] = s;
            env[name] = _evaluate(exp, env);
            return undefined;
        }
    } else if (s[0] === "set!") {
        if (s.length !== 3) {
            throw new Error("Error: 'set!' requires 2 arguments: (set! name value)");
        }
        const [_, name, exp] = s;
        if (env[name] === undefined) {
            throw new Error(`Error: Cannot set! undefined variable: [${name}]!`);
        }
        env[name] = _evaluate(exp, env);
        return undefined;
    } else if (s[0] === "lambda") {
        if (s.length !== 3) {
            throw new Error("Error: 'lambda' requires 2 arguments: (lambda (params...) body)");
        }
        const [_, params, func] = s;
        if (!Array.isArray(params)) {
            throw new Error("Error: 'lambda' parameters must be a list");
        }
        return (...args: any[]) => {
            if (args.length !== params.length) {
                throw new Error(`Error: Lambda expects ${params.length} arguments, got ${args.length}`);
            }
            const tmpEnv: any = {};
            params.forEach((param: any, idx: number) => {
                tmpEnv[param] = args[idx];
            });
            return _evaluate(func, merge(env, tmpEnv));
        };
    } else if (s[0] === "let") {
        if (s.length < 3) {
            throw new Error("Error: 'let' requires at least 2 arguments: (let ((var val)...) body...)");
        }
        const bindings = s[1];
        const body = s.slice(2);
        if (!Array.isArray(bindings)) {
            throw new Error("Error: 'let' bindings must be a list");
        }
        const newEnv: any = {};
        bindings.forEach((binding: any) => {
            if (!Array.isArray(binding) || binding.length !== 2) {
                throw new Error("Error: 'let' binding must be (var val)");
            }
            const [varName, val] = binding;
            newEnv[varName] = _evaluate(val, env);
        });
        const mergedEnv = merge(env, newEnv);
        return body.map(exp => _evaluate(exp, mergedEnv)).pop();
    } else if (s[0] === "let*") {
        if (s.length < 3) {
            throw new Error("Error: 'let*' requires at least 2 arguments: (let* ((var val)...) body...)");
        }
        const bindings = s[1];
        const body = s.slice(2);
        if (!Array.isArray(bindings)) {
            throw new Error("Error: 'let*' bindings must be a list");
        }
        let currentEnv = env;
        bindings.forEach((binding: any) => {
            if (!Array.isArray(binding) || binding.length !== 2) {
                throw new Error("Error: 'let*' binding must be (var val)");
            }
            const [varName, val] = binding;
            const newEnv: any = {};
            newEnv[varName] = _evaluate(val, currentEnv);
            currentEnv = merge(currentEnv, newEnv);
        });
        return body.map(exp => _evaluate(exp, currentEnv)).pop();
    } else if (s[0] === "begin") {
        if (s.length < 2) {
            throw new Error("Error: 'begin' requires at least one expression");
        }
        const [_, ...exps] = s;
        return exps.map(exp => _evaluate(exp, env)).pop();
    } else {
        const evaluated = s.map(exp => _evaluate(exp, env));
        const [op, ...args] = evaluated;
        if (typeof op !== "function") { 
            throw new Error(`Error: ${s[0]} is not a function!`);
        }
        try {
            return op.apply(null, args);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error in function ${s[0]}: ${error.message}`);
            }
            throw error;
        }
    }
}

export const evaluate = (s: string): any => {
	try {
		return _evaluate(parse(tokenize(s)));
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error(String(error));
	}
};
