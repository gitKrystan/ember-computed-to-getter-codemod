import type {
  ClassMethod,
  Collection,
  JSCodeshift,
  Options,
} from 'jscodeshift';
import { logger } from './log';

export type PropertyTrackingData = Map<
  string,
  { type?: 'property' | 'getter' | 'setter' | 'method'; tracked: boolean }
>;

export function parsePropertyTracking(
  j: JSCodeshift,
  root: Collection,
  options: Options,
): PropertyTrackingData {
  const properties: PropertyTrackingData = new Map(options.propertyTracking);

  // Find all getters and properties and fill out the result
  root.find(j.ClassProperty).forEach((path) => {
    const property = path.value;

    if (
      'name' in property.key &&
      typeof property.key.name === 'string' &&
      !properties.has(property.key.name)
    ) {
      properties.set(property.key.name, {
        type: 'property',
        tracked:
          'decorators' in property &&
          Array.isArray(property.decorators) &&
          property.decorators.length > 0,
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
  propertyTracking: PropertyTrackingData,
): void {
  for (const key of dependentKeys) {
    const value = propertyTracking.get(key);

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
