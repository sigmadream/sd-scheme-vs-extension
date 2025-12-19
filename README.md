# sdScheme VSCode Extension

> A minimal Scheme interpreter VSCode extension designed to help students easily practice functional programming.

## Prerequisites

- Node.js (v22 or higher)
- npm or yarn
- Visual Studio Code

## Project Setup

1. Clone the repository:

```bash
git clone https://github.com/sigmadream/sd-scheme-vs-extension.git
cd sd-scheme-vs-extension
```

2. Install dependencies:

```bash
npm install
```

## Build

Compile TypeScript code to JavaScript:

```bash
npm run compile
```

For watch mode that automatically recompiles on file changes:

```bash
npm run watch
```

## Running and Debugging

### Method 1: VSCode Debugging (Recommended)

1. Create debugging configuration file (one-time setup)
   - If `.vscode/launch.json` doesn't exist, create it:
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

2. Set up build task (one-time setup)
   - Create `.vscode/tasks.json` file:
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

3. Start debugging
   - Press `F5` or
   - Open the Debug view (Ctrl+Shift+D), select the "Extension" configuration and run
   - A new "Extension Development Host" window will open

4. Test the extension
   - Open a file containing Scheme code in the new window (or use example files from the `examples/` folder)
   - Press `Ctrl+Enter` to run the code, or
   - Open the Command Palette (Ctrl+Shift+P) and run the "sdScheme: Run All Code" command
   - Check the "Scheme" channel in the Output panel to see the results

## Debugging Tips

- Setting breakpoints: Set breakpoints on desired lines in `src/extension.ts` or `src/scheme.ts` files
- Checking console logs: You can view `console.log()` output in the Debug Console
  - The Debug Console may also display internal VSCode/Cursor logs (ExtensionHostSampler, OTLP exporter, etc.). This is normal and can be ignored
  - `punycode` module deprecation warnings may appear, but they don't affect the extension's functionality
- Checking output channel: Select the "Scheme" channel in the Output panel at the bottom of VSCode to view the extension's output
- After code changes: If `npm run watch` is running, it will automatically recompile. Otherwise, run `npm run compile` and reload the Extension Development Host window

## Linting

Code style checking:

```bash
npm run lint
```

## Testing

Run all example files in the `examples/` folder:

```bash
npm test
```

Run a specific example file:

```bash
npm run test:file basics.scheme
```

Test results are displayed in the console, and detailed logs are saved in the `test-results/` folder.

## Packaging

Package the extension as a `.vsix` file:

```bash
npm install -g vsce
vsce package
```

The generated `.vsix` file can be installed in VSCode or published to the marketplace.

## Usage

### Basic Usage

1. Open a file containing Scheme code (`.scheme`, `.scm`, `.rkt` extensions)
2. Method 1: Use keyboard shortcuts
   - `Ctrl+Enter`: Run entire file
   - `Ctrl+Shift+Enter`: Run selected region only
3. Method 2: Use Command Palette
   - Press `Ctrl+Shift+P` to open the Command Palette
   - Select one of the following commands:
     - `sdScheme: Run All Code` - Execute all expressions in the file
     - `sdScheme: Run Selection` - Execute only the selected code
     - `sdScheme: Clear Output` - Clear the output channel
     - `sdScheme: Show Environment` - View currently defined variables and functions
4. Check the results in the "Scheme" channel of the Output panel

### Key Features

#### 1. Multi-line Expression Support

Expressions spanning multiple lines are correctly executed:

```scheme
(define (factorial n)
  (if (= n 0)
      1
      (* n (factorial (- n 1)))))
```

#### 2. Expression-by-Expression Execution

Each expression is executed independently and results are displayed:

```scheme
(define x 10)
(define y 20)
(+ x y)
```

Output:
```
> (define x 10)
> (define y 20)
> (+ x y)
=> 30
```

#### 3. Environment Variable Inspection

Use the `sdScheme: Show Environment` command to view all currently defined variables and functions.

### Supported Scheme Features

#### Basic Operations

- Arithmetic: `+`, `-`, `*`, `/`, `remainder`, `modulo`
- Comparison: `=`, `>`, `<`, `>=`, `<=`, `equal?`, `eq?`
- Logical: `not`, `and`, `or`

#### List Manipulation

- Creation: `list`, `cons`
- Access: `car`, `cdr`
- Inspection: `list?`, `null?`, `pair?`
- Manipulation: `append`, `reverse`, `length`
- Higher-order functions: `map`, `filter`, `fold`/`reduce`, `apply`

#### Control Structures

- Conditionals: `if`, `cond`
- Local variables: `let`, `let*`
- Sequential execution: `begin`

#### Function Definition

- `lambda`: Anonymous functions
- `define`: Variable and function definitions
- `set!`: Variable reassignment

#### Other

- `quote`: Literal expressions
- `display`: Output function
- Math functions (sin, cos, sqrt, etc.)
- Boolean literals: `#t` (true), `#f` (false)
- `null`: Empty list literal

## Educational Examples

The project includes various example files in the `examples/` folder:

- `basics.scheme`: Basic syntax and operations
- `functions.scheme`: Function definitions and calls
- `lists.scheme`: List manipulation
- `recursion.scheme`: Recursive functions
- `higher-order.scheme`: Higher-order functions

You can learn Scheme programming by opening and running each example file.

## Troubleshooting

- Extension not loading: Check if compiled files exist in the `out/` folder and run `npm run compile`
- Changes not reflected: Reload the Extension Development Host window or restart debugging
- Commands not visible: Check the `activationEvents` and `contributes.commands` settings in `package.json`
- `punycode` deprecation warning appears:
  - This warning comes from an indirect dependency (`uri-js` package) and does not affect the extension's functionality
  - Node.js's built-in `punycode` module has been deprecated, but this will be automatically resolved when the dependency package is updated
  - You can ignore the warning; the extension works normally
