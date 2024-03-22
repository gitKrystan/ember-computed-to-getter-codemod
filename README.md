# ember-computed-to-getter-codemod

## Usage

```shell
bunx github:gitKrystan/ember-computed-to-getter-codemod app/**/*.js
```

### Options

This codemod will assume all decorated properties and getters in the same file are autotracked and will warn when a newly `dependentKeyCompat` property relies on an untracked property. To add overrides:

```js
// .codemodrc.json
{
  "propertyTracking": [
    [
      /* property key */
      string,
      {
        /* optional type for debugging */
        type?: 'property' | 'getter' | 'setter' | 'method';
        /* whether or not the property is tracked */
        tracked: boolean;
      }
    ]
  ]
}
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
