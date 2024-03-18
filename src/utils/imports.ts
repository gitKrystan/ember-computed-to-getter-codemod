import type { Collection, JSCodeshift } from 'jscodeshift';

/**
 * Find and remove all `import { computed } from '@ember/object'` specifiers.
 *
 * @returns {boolean} whether any computed specifiers were removed
 */
export function removeComputedSpecifier(
  j: JSCodeshift,
  collection: Collection,
): boolean {
  let hadComputedSpecifier = false;
  collection
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

      const computedSpecifiers = specifiers.filter((specifier) => {
        return (
          'imported' in specifier && specifier.imported.name === 'computed'
        );
      });

      if (computedSpecifiers.length > 0) {
        if (specifiers.length === 1) {
          // remove the entire import declaration
          j(path).remove();
        } else {
          // remove just the computed specifier
          importDeclaration.specifiers = specifiers.filter((specifier) => {
            return !computedSpecifiers.includes(specifier);
          });
        }
        hadComputedSpecifier = true;
      }
    });

  return hadComputedSpecifier;
}

export function addDependentKeyCompatImport(
  j: JSCodeshift,
  root: Collection<any>,
) {
  // Check if the import already exists
  const existingImport = root.find(j.ImportDeclaration, {
    source: {
      value: '@ember/object/compat',
    },
  });
  debugger;
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
