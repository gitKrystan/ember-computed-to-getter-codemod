import type {
  CallExpression,
  ClassProperty,
  Collection,
  Decorator,
  FunctionExpression,
  Identifier,
  JSCodeshift,
  StringLiteral,
} from 'jscodeshift';
import { IMPORTS, type ExistingImportsWithComputed } from './imports';
import { logger } from './log';
import { TransformResult } from './result';

// @computed('foo', 'bar', function(), {})
type ComputedDecorator = Decorator & {
  expression: CallExpression & {
    callee: Identifier;
    arguments: [...StringLiteral[], FunctionExpression & { params: [] }];
  };
};

function computedDecoratorPredicate(
  computedName: string,
): (decorator: Decorator) => decorator is ComputedDecorator {
  return function isComputedDecorator(
    decorator,
  ): decorator is ComputedDecorator {
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
  decorators: Array<Decorator | ComputedDecorator>;
  value: null;
};

export function transformComputedClassProperties(
  j: JSCodeshift,
  root: Collection,
  existingImportInfos: ExistingImportsWithComputed,
): TransformResult {
  logger.debug('transforming computed class properties');

  const isComputedDecoratorForClassProperty = computedDecoratorPredicate(
    existingImportInfos.computed.localName,
  );

  const result = new TransformResult();

  root.find(j.ClassProperty).forEach((path) => {
    const value = path.value;

    // HACK jscodeshift ClassProperty types don't know about the decorators key, but it's there
    if (!('decorators' in value) || !value.decorators) {
      return;
    }
    const classProperty = value as ComputedClassProperty;

    const computedDecorator = classProperty.decorators.find(
      isComputedDecoratorForClassProperty,
    );

    if (computedDecorator) {
      if (computedDecorator.expression.arguments.length === 1) {
        // Replace the `@computed` decorator with `@cached`
        replaceComputedDecorator(
          j,
          computedDecorator,
          classProperty,
          existingImportInfos.cached?.localName ?? IMPORTS.cached.importedName,
        );
        result.importsToAdd.add(IMPORTS.cached);
      } else {
        // Replace the `@computed` decorator with `@dependentKeyCompat`
        replaceComputedDecorator(
          j,
          computedDecorator,
          classProperty,
          existingImportInfos.dependentKeyCompat?.localName ??
            IMPORTS.dependentKeyCompat.importedName,
        );
        result.importsToAdd.add(IMPORTS.dependentKeyCompat);
      }

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

  return result;
}

function replaceComputedDecorator(
  j: JSCodeshift,
  computedDecorator: ComputedDecorator,
  classProperty: ClassProperty,
  newDecoratorName: string,
): void {
  // HACK jscodeshift ClassProperty types don't know about the decorators key, but it's there
  if (!('decorators' in classProperty) || !classProperty.decorators) {
    throw new Error(
      'trying to replace a decorator on a property without decorators',
    );
  }

  const dependentKeyCompat = j.decorator(j.identifier(newDecoratorName));

  (classProperty.decorators as Decorator[]).splice(
    (classProperty.decorators as Decorator[]).indexOf(computedDecorator),
    1,
    dependentKeyCompat,
  );
}
