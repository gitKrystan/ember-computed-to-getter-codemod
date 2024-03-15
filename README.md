# ember-computed-to-getter-codemod

## Usage

```shell
npx github:gitKrystan/ember-computed-to-getter-codemod app/**/*.js
```

## Development

### Installation

```shell
pnpm install
```

## Test

```shell
pnpm test
```

## Debug

Use the [pre-configured VSCode launcher](https://github.com/chimurai/jscodeshift-typescript-example/blob/main/.vscode/launch.json) to run tests and debug your transformer.

![debugger](https://raw.githubusercontent.com/chimurai/jscodeshift-typescript-example/main/docs/debugger.gif)

## Behind the scenes

Use `@babel/parser` in [https://astexplorer.net](https://astexplorer.net) when working with the jscodeshift's [default parser](https://github.com/facebook/jscodeshift#usage-cli) (default: `babel`).
