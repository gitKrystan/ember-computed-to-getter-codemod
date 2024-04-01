import type {
  ClassMethod,
  Collection,
  Decorator,
  JSCodeshift,
  Options,
} from 'jscodeshift';
import { logger } from './log';
import type { ExistingImportsWithComputed } from './imports';

export type PropertyData = Map<
  string,
  {
    type?: 'property' | 'getter' | 'setter' | 'method' | 'service';
    tracked: boolean;
  }
>;

export function parseProperties(
  j: JSCodeshift,
  root: Collection,
  existingImportInfos: ExistingImportsWithComputed,
  options: Options,
): PropertyData {
  const properties: PropertyData = new Map(options.properties);

  // Find all getters and properties and fill out the result
  root.find(j.ClassProperty).forEach((path) => {
    const property = path.value;

    if (
      'name' in property.key &&
      typeof property.key.name === 'string' &&
      !properties.has(property.key.name)
    ) {
      const decorators =
        'decorators' in property && Array.isArray(property.decorators)
          ? (property.decorators as Decorator[])
          : [];
      const type = decorators.some(
        (decorator) =>
          decorator.expression.type === 'Identifier' &&
          existingImportInfos.service &&
          decorator.expression.name === existingImportInfos.service.localName,
      )
        ? 'service'
        : 'property';
      properties.set(property.key.name, {
        type,
        tracked: decorators.length > 0,
      });
    }
  });

  root.find(j.ClassMethod).forEach((path) => {
    const method = path.value;

    if (
      'name' in method.key &&
      typeof method.key.name === 'string' &&
      !properties.has(method.key.name)
    ) {
      properties.set(method.key.name, {
        type: typeFor(method.kind),
        tracked:
          'decorators' in method &&
          Array.isArray(method.decorators) &&
          method.decorators.length > 0,
      });
    }
  });

  return properties;
}

function typeFor(kind: ClassMethod['kind']): 'getter' | 'setter' | 'method' {
  switch (kind) {
    case 'get':
      return 'getter';
    case 'set':
      return 'setter';
    default:
      return 'method';
  }
}

export function validateDependentKeyCompat(
  dependentKeys: string[],
  getterName: string,
  properties: PropertyData,
): void {
  for (const key of dependentKeys) {
    // Remove '.[]', '.id', '.length' from end of key
    const normalized = key.replace(/(\.id|\.length|\.\[\])$/, '');
    const value = properties.get(normalized);

    if (!value) {
      logger.warn(
        `\`${getterName}\` getter relies on unknown property that may not be tracked: \`${key}\``,
      );
    } else if (!value.tracked) {
      logger.warn(
        `\`${getterName}\` getter relies on untracked ${value.type ?? 'property'}: \`${key}\``,
      );
    }
  }
}
