# ember-computed-to-getter-codemod

## Usage

```shell
bunx github:gitKrystan/ember-computed-to-getter-codemod app/**/*.js
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

## Behind the scenes

Use `@babel/parser` in [https://astexplorer.net](https://astexplorer.net) when working with the jscodeshift's [default parser](https://github.com/facebook/jscodeshift#usage-cli) (default: `babel`).

## TODOs

- [ ] Add validation to class-property version
- [ ] Ensure validation actually works
