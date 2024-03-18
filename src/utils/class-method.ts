import type {
  Collection,
  JSCodeshift,
  CallExpression,
  Decorator,
  Identifier,
  StringLiteral,
  ClassMethod,
} from 'jscodeshift';

type ComputedDecoratorForClassMethod = Decorator & {
  expression: CallExpression & {
    callee: Identifier;
    arguments: StringLiteral[];
  };
};

function computedDecoratorForClassMethodPredicate(
  computedName: string,
): (decorator: Decorator) => decorator is ComputedDecoratorForClassMethod {
  return function isComputedDecoratorForClassMethod(
    decorator,
  ): decorator is ComputedDecoratorForClassMethod {
    return (
      decorator.expression.type === 'CallExpression' &&
      decorator.expression.callee.type === 'Identifier' &&
      decorator.expression.callee.name === computedName &&
      // NOTE: This will be truthy for `@computed` decorators with no arguments, which we want
      decorator.expression.arguments.every(
        (arg) => arg.type === 'StringLiteral',
      )
    );
  };
}

type ComputedClassMethod = ClassMethod & {
  decorators: Array<Decorator | ComputedDecoratorForClassMethod>;
  kind: 'get';
  params: [];
};

export function transformComputedClassMethods(
  j: JSCodeshift,
  root: Collection,
  computedName: string,
): void {
  const isComputedDecoratorForClassMethod =
    computedDecoratorForClassMethodPredicate(computedName);

  root.find(j.ClassMethod, { kind: 'get' }).forEach((path) => {
    const classMethod = path.value;

    if (!classMethod.decorators) {
      return;
    }

    const computedDecoratorIndex = classMethod.decorators.findIndex(
      isComputedDecoratorForClassMethod,
    );

    if (computedDecoratorIndex > -1) {
      // Replace the `@computed` decorator with `@dependentKeyCompat`
      const dependentKeyCompat = j.decorator(
        j.identifier('dependentKeyCompat'),
      );
      classMethod.decorators.splice(
        computedDecoratorIndex,
        1,
        dependentKeyCompat,
      );
    }
  });
}
