import type { API, Collection, FileInfo, Options } from 'jscodeshift';
import { transformComputedClassMethods } from './utils/class-method';
import { transformComputedClassProperties } from './utils/class-property';
import {
  addImport,
  parseImports,
  removeImport,
  type ExistingImportsWithComputed,
  type Import,
} from './utils/imports';
import { logger } from './utils/log';
import { TransformResult } from './utils/result';

export default function transformer(
  fileOrCollection: FileInfo | Collection,
  api: API,
  options: Options,
) {
  logger.config(options);

  const j = api.jscodeshift;
  // HACKS so I don't have to rewrite the tests
  const root =
    'source' in fileOrCollection
      ? j(fileOrCollection.source)
      : fileOrCollection;

  const existingImports = parseImports(j, root);

  if (existingImports.computed) {
    logger.debug('computed localName', existingImports.computed.localName);

    const result = new TransformResult();

    result.merge(
      transformComputedClassMethods(
        j,
        root,
        existingImports as ExistingImportsWithComputed,
      ),
    );

    result.merge(
      transformComputedClassProperties(
        j,
        root,
        existingImports as ExistingImportsWithComputed,
      ),
    );

    for (const importToAdd of result.importsToAdd) {
      if (existingImports[importToAdd.importedName] === null) {
        addImport(j, root, importToAdd);
      }
    }

    removeImport(j, existingImports.computed);
  }

  logger.debug('no computed import found');

  // TODO: Make quote configurable or pull from prettierrc
  return root.toSource({ quote: 'single' });
}
