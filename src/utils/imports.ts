import type { Collection, ImportSpecifier, JSCodeshift } from 'jscodeshift';

/**
 * Find and remove all `import { computed } from '@ember/object'` specifiers.
 *
 * @returns {string | null} The local name of the `computed` specifier if it was removed, or `null` if it was not found.
 */
export function removeComputedSpecifier(
  j: JSCodeshift,
  root: Collection,
): string | null {
  let computedName: string | null = null;
  root
    .find(j.ImportDeclaration, {
      source: {
        value: '@ember/object',
      },
    })
    .forEach((path) => {
      const importDeclaration = path.value;
      const specifiers = importDeclaration.specifiers;
      if (!specifiers) {
        return;
      }

      const computedSpecifiers = specifiers.filter(
        (specifier): specifier is ImportSpecifier =>
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.name === 'computed',
      );

      if (computedSpecifiers.length > 1) {
        throw new Error(
          'Found more than one `computed` specifier. @gitKrystan assumed this was not possible.',
        );
      }
      const [computedSpecifier] = computedSpecifiers;

      if (computedSpecifier) {
        if (specifiers.length === 1) {
          // remove the entire import declaration
          j(path).remove();
        } else {
          // remove just the computed specifier
          importDeclaration.specifiers = specifiers.filter((specifier) => {
            return !(computedSpecifiers as unknown[]).includes(specifier);
          });
        }
        computedName =
          computedSpecifier.local?.name ?? computedSpecifier.imported.name;
      }
    });

  return computedName;
}

export function addDependentKeyCompatImport(
  j: JSCodeshift,
  root: Collection,
): void {
  // Check if the import already exists
  const existingImport = root.find(j.ImportDeclaration, {
    source: {
      value: '@ember/object/compat',
    },
  });

  if (existingImport.length === 0) {
    // If it doesn't exist, add the import to the end of the existing imports
    const lastImport = root.find(j.ImportDeclaration).at(-1);
    if (lastImport.length === 0) {
      root
        .find(j.Program)
        .get('body', 0)
        .insertBefore(
          j.importDeclaration(
            [j.importSpecifier(j.identifier('dependentKeyCompat'))],
            j.literal('@ember/object/compat'),
          ),
        );
    } else {
      lastImport.insertAfter(
        j.importDeclaration(
          [j.importSpecifier(j.identifier('dependentKeyCompat'))],
          j.literal('@ember/object/compat'),
        ),
      );
    }
  } else if (
    !existingImport
      .paths()
      .some((path) =>
        path.value.specifiers?.some(
          (specifier) =>
            'imported' in specifier &&
            specifier.imported.name === 'dependentKeyCompat',
        ),
      )
  ) {
    // Add the specifier to the first existing import
    const first = existingImport.paths()[0];
    first.value.specifiers = [
      ...(first.value.specifiers ?? []),
      j.importSpecifier(j.identifier('dependentKeyCompat')),
    ];
  }
}
