# sdScheme VSCode Extension

> 학생들이 함수형 프로그래밍을 쉽게 실습할 수 있도록 설계된 작은 Scheme 인터프리터 VSCode 확장 프로그램입니다.

## 사전 요구사항

- Node.js (v22 이상)
- npm 또는 yarn
- Visual Studio Code

## 프로젝트 설정

1. 저장소 클론:

```bash
git clone https://github.com/sigmadream/sd-scheme-vs-extension.git
cd sd-scheme-vs-extension
```

2. 의존성 설치:

```bash
npm install
```

## 빌드

TypeScript 코드를 JavaScript로 컴파일합니다.

```bash
npm run compile
```

파일 변경을 감지하여 자동으로 컴파일하는 watch 모드는 아래와 같습니다.

```bash
npm run watch
```

## 실행 및 디버깅

### 방법 1: VSCode 디버깅 (권장)

1. 디버깅 설정 파일 생성 (처음 한 번만)
   - `.vscode/launch.json` 파일이 없다면 생성합니다:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Extension",
         "type": "extensionHost",
         "request": "launch",
         "args": [
           "--extensionDevelopmentPath=${workspaceFolder}"
         ],
         "outFiles": [
           "${workspaceFolder}/out//*.js"
         ],
         "preLaunchTask": "${defaultBuildTask}"
       }
     ]
   }
   ```

2. 빌드 태스크 설정 (처음 한 번만)
   - `.vscode/tasks.json` 파일을 생성합니다:
   ```json
   {
     "version": "2.0.0",
     "tasks": [
       {
         "type": "npm",
         "script": "watch",
         "problemMatcher": "$tsc-watch",
         "isBackground": true,
         "presentation": {
           "reveal": "never"
         },
         "group": {
           "kind": "build",
           "isDefault": true
         }
       }
     ]
   }
   ```

3. 디버깅 시작
   - `F5` 키를 누르거나
   - 디버그 뷰 (Ctrl+Shift+D)에서 "Extension" 구성을 선택하고 실행
   - 새로운 "Extension Development Host" 창이 열립니다

4. 확장 프로그램 테스트
   - 새 창에서 Scheme 코드가 포함된 파일을 엽니다 (또는 `examples/` 폴더의 예제 파일 사용)
   - `Ctrl+Enter`를 눌러 코드를 실행하거나
   - 명령 팔레트 (Ctrl+Shift+P)를 열고 "sdScheme: 전체 코드 실행" 명령을 실행합니다
   - 출력 패널에서 "Scheme" 채널을 확인하여 결과를 볼 수 있습니다


## 디버깅 팁

- 브레이크포인트 설정: `src/extension.ts` 또는 `src/scheme.ts` 파일에서 원하는 라인에 브레이크포인트를 설정합니다
- 콘솔 로그 확인: 디버그 콘솔에서 `console.log()` 출력을 확인할 수 있습니다
  - 디버그 콘솔에는 VSCode/Cursor의 내부 로그(ExtensionHostSampler, OTLP exporter 등)도 표시될 수 있습니다. 이는 정상적인 현상이며 무시해도 됩니다
  - `punycode` 모듈의 deprecation 경고도 나타날 수 있지만, 확장 프로그램 동작에는 영향을 주지 않습니다
- 출력 채널 확인: VSCode 하단의 출력 패널에서 "Scheme" 채널을 선택하여 확장 프로그램의 출력을 확인합니다
- 코드 수정 후: `npm run watch`를 실행 중이면 자동으로 재컴파일됩니다. 그렇지 않다면 `npm run compile`을 실행한 후 Extension Development Host 창을 다시 로드하세요

## 린팅

코드 스타일 검사

```bash
npm run lint
```

## 패키징

확장 프로그램을 `.vsix` 파일로 패키징

```bash
npm install -g vsce
vsce package
```

생성된 `.vsix` 파일을 VSCode에서 설치하거나 마켓플레이스에 게시할 수 있습니다.

## 사용 방법

### 기본 사용법

1. Scheme 코드가 포함된 파일을 엽니다 (`.scheme`, `.scm`, `.rkt` 확장자)
2. 방법 1: 키보드 단축키 사용
   - `Ctrl+Enter`: 전체 파일 실행
   - `Ctrl+Shift+Enter`: 선택한 영역만 실행
3. 방법 2: 명령 팔레트 사용
   - `Ctrl+Shift+P`를 눌러 명령 팔레트를 엽니다
   - 다음 명령 중 하나를 선택:
     - `sdScheme: 전체 코드 실행` - 파일의 모든 표현식 실행
     - `sdScheme: 선택 영역 실행` - 선택한 코드만 실행
     - `sdScheme: 출력 초기화` - 출력 채널 초기화
     - `sdScheme: 환경 변수 보기` - 현재 정의된 변수와 함수 목록 확인
4. 출력 패널의 "Scheme" 채널에서 결과를 확인합니다

### 주요 기능

#### 1. 다중 줄 표현식 지원

여러 줄에 걸친 표현식도 올바르게 실행됩니다:

```scheme
(define (factorial n)
  (if (= n 0)
      1
      (* n (factorial (- n 1)))))
```

#### 2. 표현식 단위 실행

각 표현식이 독립적으로 실행되고 결과가 표시됩니다:
```scheme
(define x 10)
(define y 20)
(+ x y)
```
출력:
```
> (define x 10)
> (define y 20)
> (+ x y)
=> 30
```

#### 3. 환경 변수 확인

`sdScheme: 환경 변수 보기` 명령으로 현재 정의된 모든 변수와 함수를 확인할 수 있습니다.

### 지원하는 Scheme 기능

#### 기본 연산

- 산술: `+`, `-`, `*`, `/`, `remainder`, `modulo`
- 비교: `=`, `>`, `<`, `>=`, `<=`, `equal?`, `eq?`
- 논리: `not`

#### 리스트 조작

- 생성: `list`, `cons`
- 접근: `car`, `cdr`
- 검사: `list?`, `null?`, `pair?`
- 조작: `append`, `reverse`, `length`
- 고차 함수: `map`, `filter`, `fold`/`reduce`, `apply`

#### 제어 구조

- 조건문: `if`, `cond`
- 지역 변수: `let`, `let*`
- 순차 실행: `begin`

#### 함수 정의

- `lambda`: 익명 함수
- `define`: 변수 및 함수 정의
- `set!`: 변수 재할당

#### 기타

- `quote`: 리터럴 표현
- `display`: 출력 함수
- Math 함수들 (sin, cos, sqrt 등)

## 교육용 예제

프로젝트의 `examples/` 폴더에 다양한 예제 파일이 포함되어 있습니다:

- basics.scheme: 기본 문법과 연산
- functions.scheme: 함수 정의와 호출
- lists.scheme: 리스트 조작
- recursion.scheme: 재귀 함수
- higher-order.scheme: 고차 함수

각 예제 파일을 열고 실행해보면서 Scheme 프로그래밍을 학습할 수 있습니다.

## 문제 해결

- 확장 프로그램이 로드되지 않는 경우: `out/` 폴더에 컴파일된 파일이 있는지 확인하고 `npm run compile`을 실행하세요
- 변경사항이 반영되지 않는 경우: Extension Development Host 창을 다시 로드하거나 디버깅을 재시작하세요
- 명령이 보이지 않는 경우: `package.json`의 `activationEvents`와 `contributes.commands` 설정을 확인하세요
- `punycode` deprecation 경고가 나타나는 경우: 
  - 이 경고는 간접 의존성(`uri-js` 패키지)에서 발생하는 것으로, 확장 프로그램의 기능에는 영향을 주지 않습니다
  - Node.js의 내장 `punycode` 모듈이 deprecated 되었지만, 의존성 패키지가 업데이트되면 자동으로 해결됩니다
  - 경고를 무시해도 되며, 확장 프로그램은 정상적으로 작동합니다