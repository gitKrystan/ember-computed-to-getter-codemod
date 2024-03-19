import type {
  Collection,
  JSCodeshift,
  CallExpression,
  Decorator,
  Identifier,
  StringLiteral,
  FunctionExpression,
  ClassProperty,
} from 'jscodeshift';

type ComputedDecoratorForClassProperty = Decorator & {
  expression: CallExpression & {
    callee: Identifier;
    arguments: [...StringLiteral[], FunctionExpression & { params: [] }];
  };
};

function computedDecoratorForClassPropertyPredicate(
  computedName: string,
): (decorator: Decorator) => decorator is ComputedDecoratorForClassProperty {
  return function isComputedDecoratorForClassProperty(
    decorator,
  ): decorator is ComputedDecoratorForClassProperty {
    return (
      decorator.expression.type === 'CallExpression' &&
      decorator.expression.callee.type === 'Identifier' &&
      decorator.expression.callee.name === computedName &&
      // NOTE: This will be truthy for `@computed` decorators with no string arguments, which we want
      decorator.expression.arguments
        .slice(0, -1)
        .every((arg) => arg.type === 'StringLiteral') &&
      decorator.expression.arguments.at(-1)?.type === 'FunctionExpression'
    );
  };
}

type ComputedClassProperty = ClassProperty & {
  decorators: Array<Decorator | ComputedDecoratorForClassProperty>;
  value: null;
};

export function transformComputedClassProperties(
  j: JSCodeshift,
  root: Collection,
  computedName: string,
): void {
  const isComputedDecoratorForClassProperty =
    computedDecoratorForClassPropertyPredicate(computedName);

  root.find(j.ClassProperty).forEach((path) => {
    const value = path.value;

    // HACK jscodeshift ClassProperty types don't know about the decorators key, but it's there
    if (!('decorators' in value) || !value.decorators) {
      return;
    }
    const classProperty = value as ComputedClassProperty;

    const computedDecoratorIndex = classProperty.decorators.findIndex(
      isComputedDecoratorForClassProperty,
    );

    if (computedDecoratorIndex > -1) {
      // Replace the `@computed` decorator with `@dependentKeyCompat`
      const dependentKeyCompat = j.decorator(
        j.identifier('dependentKeyCompat'),
      );
      const [computedDecorator] = classProperty.decorators.splice(
        computedDecoratorIndex,
        1,
        dependentKeyCompat,
      ) as [ComputedDecoratorForClassProperty];

      // Replace the ClassProperty with a getter containing the body from the FunctionExpression pulled out of the ComputedDecoratorForClassProperty
      const getter = j.classMethod.from({
        kind: 'get',
        key: classProperty.key,
        params: [],
        body: (
          computedDecorator.expression.arguments.at(-1) as FunctionExpression
        ).body,
        decorators: classProperty.decorators,
      });
      path.replace(getter);
    }
  });
}
