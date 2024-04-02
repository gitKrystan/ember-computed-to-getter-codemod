import type {
  CallExpression,
  ClassMethod,
  Collection,
  Decorator,
  Identifier,
  JSCodeshift,
  StringLiteral,
} from 'jscodeshift';
import { IMPORTS, type ExistingImportsWithComputed } from './imports';
import { logger } from './log';
import { TransformResult } from './result';
import { validateDependentKeyCompat, type PropertyData } from './properties';

// @computed('foo', 'bar')
type ComputedCallExpressionDecorator = Decorator & {
  expression: CallExpression & {
    callee: Identifier;
    arguments: StringLiteral[];
  };
};

function isComputedCallExpressionDecorator(
  decorator: Decorator,
  computedName: string,
): decorator is ComputedCallExpressionDecorator {
  return (
    decorator.expression.type === 'CallExpression' &&
    decorator.expression.callee.type === 'Identifier' &&
    decorator.expression.callee.name === computedName &&
    // NOTE: This will be truthy for `@computed` decorators with no arguments, which we want
    decorator.expression.arguments.every((arg) => arg.type === 'StringLiteral')
  );
}

// @computed
type ComputedIdentifierDecorator = Decorator & {
  expression: Identifier;
};

function isComputedIdentifierDecoratorForClassMethod(
  decorator: Decorator,
  computedName: string,
): decorator is ComputedIdentifierDecorator {
  return (
    decorator.expression.type === 'Identifier' &&
    decorator.expression.name === computedName
  );
}

function computedDecoratorPredicate(
  computedName: string,
): (
  decorator: Decorator,
) => decorator is
  | ComputedCallExpressionDecorator
  | ComputedIdentifierDecorator {
  return function isComputedDecorator(
    decorator,
  ): decorator is
    | ComputedCallExpressionDecorator
    | ComputedIdentifierDecorator {
    return (
      isComputedCallExpressionDecorator(decorator, computedName) ||
      isComputedIdentifierDecoratorForClassMethod(decorator, computedName)
    );
  };
}

type ComputedClassMethod = ClassMethod & {
  decorators: Array<
    Decorator | ComputedCallExpressionDecorator | ComputedIdentifierDecorator
  >;
  kind: 'get';
  params: [];
};

export function transformComputedClassMethods(
  j: JSCodeshift,
  root: Collection,
  existingImportInfos: ExistingImportsWithComputed,
  properties: PropertyData,
): TransformResult {
  logger.debug('transforming computed class methods');

  const isComputedDecorator = computedDecoratorPredicate(
    existingImportInfos.computed.localName,
  );

  const result = new TransformResult();

  root.find(j.ClassMethod, { kind: 'get' }).forEach((path) => {
    const classMethod = path.value;

    if (!classMethod.decorators) {
      return;
    }

    const computedDecorator = classMethod.decorators.find(isComputedDecorator);

    if (!computedDecorator) {
      return;
    }

    const cachedName =
      existingImportInfos.cached?.localName ?? IMPORTS.cached.importedName;
    const dependentKeyCompatName =
      existingImportInfos.dependentKeyCompat?.localName ??
      IMPORTS.dependentKeyCompat.importedName;

    if (
      computedDecorator.expression.type === 'Identifier' ||
      computedDecorator.expression.arguments.length === 0 ||
      computedDecorator.expression.arguments.every((argument) => {
        return (
          argument.type === 'StringLiteral' &&
          existingImportInfos.service &&
          properties.get(argument.value)?.type ===
            existingImportInfos.service.localName
        );
      })
    ) {
      // Replace the `@computed()` decorator with `@cached`
      replaceComputedDecorator(j, computedDecorator, classMethod, [cachedName]);
      result.importsToAdd.add(IMPORTS.cached);
    } else {
      // Replace the `@computed(...string[])` decorator with `@cached` & `@dependentKeyCompat`
      validateDependentKeyCompat(
        (computedDecorator.expression.arguments as StringLiteral[]).map(
          (arg) => arg.value,
        ),
        (classMethod.key as Identifier).name ?? 'unknown',
        properties,
      );
      replaceComputedDecorator(j, computedDecorator, classMethod, [
        cachedName,
        dependentKeyCompatName,
      ]);
      result.importsToAdd.add(IMPORTS.cached);
      result.importsToAdd.add(IMPORTS.dependentKeyCompat);
    }
  });

  return result;
}

function replaceComputedDecorator(
  j: JSCodeshift,
  computedDecorator:
    | ComputedCallExpressionDecorator
    | ComputedIdentifierDecorator,
  classMethod: ClassMethod,
  newDecoratorNames: string[],
): void {
  if (!classMethod.decorators) {
    throw new Error(
      'trying to replace a decorator on a method without decorators',
    );
  }

  const newDecorators = newDecoratorNames.map((newDecoratorName) =>
    j.decorator.from({
      expression: j.identifier(newDecoratorName),
    }),
  );

  newDecorators[0].comments = computedDecorator.comments ?? null;

  classMethod.decorators.splice(
    classMethod.decorators.indexOf(computedDecorator),
    1,
    ...newDecorators,
  );
}
