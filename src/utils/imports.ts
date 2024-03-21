import type {
  ASTPath,
  Collection,
  ImportDeclaration,
  ImportSpecifier,
  JSCodeshift,
} from 'jscodeshift';
import { logger } from './log';

export const IMPORTS = {
  computed: {
    importedName: 'computed' as const,
    sourceValue: '@ember/object' as const,
  },
  cached: {
    importedName: 'cached' as const,
    sourceValue: '@glimmer/tracking' as const,
  },
  dependentKeyCompat: {
    importedName: 'dependentKeyCompat' as const,
    sourceValue: '@ember/object/compat' as const,
  },
};
export type IMPORT_INFO = typeof IMPORTS;
export type Import = IMPORT_INFO[keyof IMPORT_INFO];
type ImportedName = Import['importedName'];
type ImportSourceValue = Import['sourceValue'];

interface ExistingImport {
  localName: string; // e.g. 'computed' or 'renamedComputed'
  specifier: ImportSpecifier;
  path: ASTPath<ImportDeclaration>;
}

interface ExistingImports {
  computed: ExistingImport | null;
  cached: ExistingImport | null;
  dependentKeyCompat: ExistingImport | null;
}

export interface ExistingImportsWithComputed extends ExistingImports {
  computed: ExistingImport;
}

/**
 * Parses info about the imports for `computed`, `cached`, and `dependentKeyCompat` from the given root.
 */
export function parseImports(
  j: JSCodeshift,
  root: Collection,
): ExistingImports {
  const infos: ExistingImports = {
    computed: null,
    cached: null,
    dependentKeyCompat: null,
  };

  root.find(j.ImportDeclaration).forEach((path) => {
    if (infos.computed === null) {
      infos.computed = parseImport(
        path,
        IMPORTS.computed.importedName,
        IMPORTS.computed.sourceValue,
      );
    }

    if (infos.cached === null) {
      infos.cached = parseImport(
        path,
        IMPORTS.cached.importedName,
        IMPORTS.cached.sourceValue,
      );
    }

    if (infos.dependentKeyCompat === null) {
      infos.dependentKeyCompat = parseImport(
        path,
        IMPORTS.dependentKeyCompat.importedName,
        IMPORTS.dependentKeyCompat.sourceValue,
      );
    }
  });

  return infos;
}

function parseImport(
  path: ASTPath<ImportDeclaration>,
  importedName: ImportedName,
  sourceValue: ImportSourceValue,
): ExistingImport | null {
  const importDeclaration = path.value;
  if (
    !importDeclaration.specifiers ||
    importDeclaration.source.value !== sourceValue
  ) {
    return null;
  }

  const match = importDeclaration.specifiers.find(
    (specifier): specifier is ImportSpecifier =>
      specifier.type === 'ImportSpecifier' &&
      specifier.imported.name === importedName,
  );

  return match
    ? {
        localName: match.local?.name ?? match.imported.name,
        specifier: match,
        path,
      }
    : null;
}

/**
 * Find and remove the given specifier, or remove the entire import declaration
 * if removing the last specifier.
 */
export function removeImport(
  j: JSCodeshift,
  { specifier: specifierToRemove, path }: ExistingImport,
): void {
  logger.debug(`removing ${specifierToRemove.imported.name} import`);

  const importDeclaration = path.value;
  const { specifiers } = importDeclaration;

  if (!specifiers) {
    throw new Error(
      'trying to remove a specifier from an import without specifiers',
    );
  }

  if (specifiers.length === 1) {
    // remove the entire import declaration
    j(path).remove();
  } else {
    // remove just the computed specifier
    importDeclaration.specifiers = specifiers.filter((specifier) => {
      return specifier !== specifierToRemove;
    });
  }
}

export function addImport(
  j: JSCodeshift,
  root: Collection,
  { importedName, sourceValue }: Import,
): void {
  logger.debug(`adding ${importedName} import`);

  // Check if the import already exists
  const existingDeclarations = root.find(j.ImportDeclaration, {
    source: {
      value: sourceValue,
    },
  });

  if (existingDeclarations.length === 0) {
    // If it doesn't exist, add the import to the end of the existing imports
    const lastImportCollection = root.find(j.ImportDeclaration).at(-1);
    if (lastImportCollection.length === 0) {
      root
        .find(j.Program)
        .get('body', 0)
        .insertBefore(
          j.importDeclaration(
            [j.importSpecifier(j.identifier(importedName))],
            j.literal(sourceValue),
          ),
        );
    } else {
      lastImportCollection.insertAfter(
        j.importDeclaration(
          [j.importSpecifier(j.identifier(importedName))],
          j.literal(sourceValue),
        ),
      );
    }
  } else {
    // Add the specifier to the first existing import with specifiers
    const first = existingDeclarations
      .paths()
      .find((path) => path.value.specifiers);
    if (!first) {
      throw new Error(
        `somehow we found multiple import declarations for ${sourceValue} with no specifiers`,
      );
    }
    first.value.specifiers = [
      ...(first.value.specifiers ?? []),
      j.importSpecifier(j.identifier(importedName)),
    ];
  }
}
