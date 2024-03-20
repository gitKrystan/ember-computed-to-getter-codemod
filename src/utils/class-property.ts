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

      const functionExpressionCopy: Partial<FunctionExpression> &
        Pick<FunctionExpression, 'body'> = {
        ...(computedDecorator.expression.arguments.at(
          -1,
        ) as FunctionExpression),
      };
      delete functionExpressionCopy.type;

      const comments = Array.from(
        new Set([
          ...(computedDecorator.comments ?? []),
          // @ts-expect-error jscodeshift types are wrong
          ...(functionExpressionCopy.leadingComments ?? []),
          // @ts-expect-error jscodeshift types are wrong
          ...(functionExpressionCopy.trailingComments ?? []),
          ...(classProperty.comments ?? []),
          // @ts-expect-error jscodeshift types are wrong
          ...(classProperty.key.leadingComments ?? []),
        ]),
      ).sort((a, b) => {
        if (a.loc && b.loc) {
          return a.loc.start.line - b.loc.start.line;
        } else {
          return 0;
        }
      });

      // Replace the ClassProperty with a getter containing the body from the FunctionExpression pulled out of the ComputedDecoratorForClassProperty
      const getter = j.classMethod.from({
        ...functionExpressionCopy,
        kind: 'get',
        key: { ...classProperty.key, comments: null },
        params: [],
        decorators: classProperty.decorators,
        comments,
      });
      path.replace(getter);
    }
  });
}
