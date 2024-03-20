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

- [ ] `@computed` with no dependent keys --> `@cached` instead of `@dependentKeyCompat`
- [ ] Check dependent keys to see if they're auto-tracked?
      i think what we could do is just do a scan for props on models that aren't something that'll be tracked
      if its a getter then ensure dependentKeyCompat, if its a field that has a decorator ignore it, else alert to field being present without tracked
