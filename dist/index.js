// src/utils/log.ts
class Logger {
  options = {};
  config(options) {
    this.options = options;
  }
  warn(...args) {
    console.log("[WARN]", ...args);
  }
  debug(...args) {
    if (this.options.verbose === "2") {
      console.log("[DEBUG]", ...args);
    }
  }
}
var logger = new Logger;

// src/utils/imports.ts
function parseImports(j, root) {
  const infos = {
    computed: null,
    cached: null,
    dependentKeyCompat: null,
    service: null
  };
  root.find(j.ImportDeclaration).forEach((path) => {
    if (infos.computed === null) {
      infos.computed = parseImport(path, IMPORTS.computed.importedName, IMPORTS.computed.sourceValue);
    }
    if (infos.cached === null) {
      infos.cached = parseImport(path, IMPORTS.cached.importedName, IMPORTS.cached.sourceValue);
    }
    if (infos.dependentKeyCompat === null) {
      infos.dependentKeyCompat = parseImport(path, IMPORTS.dependentKeyCompat.importedName, IMPORTS.dependentKeyCompat.sourceValue);
    }
    if (infos.service === null) {
      infos.service = parseImport(path, IMPORTS.service.importedName, IMPORTS.service.sourceValue);
    }
  });
  return infos;
}
var parseImport = function(path, importedName, sourceValue) {
  const importDeclaration = path.value;
  if (!importDeclaration.specifiers || importDeclaration.source.value !== sourceValue) {
    return null;
  }
  const match = importDeclaration.specifiers.find((specifier) => specifier.type === "ImportSpecifier" && specifier.imported.name === importedName);
  return match ? {
    localName: match.local?.name ?? match.imported.name,
    specifier: match,
    path
  } : null;
};
function removeImport(j, { specifier: specifierToRemove, path }) {
  logger.debug(`removing ${specifierToRemove.imported.name} import`);
  const importDeclaration = path.value;
  const { specifiers } = importDeclaration;
  if (!specifiers) {
    throw new Error("trying to remove a specifier from an import without specifiers");
  }
  if (specifiers.length === 1) {
    j(path).remove();
  } else {
    importDeclaration.specifiers = specifiers.filter((specifier) => {
      return specifier !== specifierToRemove;
    });
  }
}
function addImport(j, root, { importedName, sourceValue }) {
  logger.debug(`adding ${importedName} import`);
  const existingDeclarations = root.find(j.ImportDeclaration, {
    source: {
      value: sourceValue
    }
  });
  if (existingDeclarations.length === 0) {
    const lastImportCollection = root.find(j.ImportDeclaration).at(-1);
    if (lastImportCollection.length === 0) {
      root.find(j.Program).get("body", 0).insertBefore(j.importDeclaration([j.importSpecifier(j.identifier(importedName))], j.literal(sourceValue)));
    } else {
      lastImportCollection.insertAfter(j.importDeclaration([j.importSpecifier(j.identifier(importedName))], j.literal(sourceValue)));
    }
  } else {
    const first = existingDeclarations.paths().find((path) => path.value.specifiers);
    if (!first) {
      throw new Error(`somehow we found multiple import declarations for ${sourceValue} with no specifiers`);
    }
    first.value.specifiers = [
      ...first.value.specifiers ?? [],
      j.importSpecifier(j.identifier(importedName))
    ];
  }
}
var IMPORTS = {
  computed: {
    importedName: "computed",
    sourceValue: "@ember/object"
  },
  cached: {
    importedName: "cached",
    sourceValue: "@glimmer/tracking"
  },
  dependentKeyCompat: {
    importedName: "dependentKeyCompat",
    sourceValue: "@ember/object/compat"
  },
  service: {
    importedName: "service",
    sourceValue: "@ember/service"
  }
};

// src/utils/result.ts
class TransformResult {
  importsToAdd = new Set;
  merge(other) {
    other.importsToAdd.forEach((importToAdd) => this.importsToAdd.add(importToAdd));
  }
}

// src/utils/properties.ts
function parseProperties(j, root, existingImportInfos, options) {
  const properties = new Map(options.properties);
  root.find(j.ClassProperty).forEach((path) => {
    const property = path.value;
    if ("name" in property.key && typeof property.key.name === "string" && !properties.has(property.key.name)) {
      const decorators = "decorators" in property && Array.isArray(property.decorators) ? property.decorators : [];
      const type = decorators.some((decorator) => decorator.expression.type === "Identifier" && existingImportInfos.service && decorator.expression.name === existingImportInfos.service.localName) ? "service" : "property";
      properties.set(property.key.name, {
        type,
        tracked: decorators.length > 0
      });
    }
  });
  root.find(j.ClassMethod).forEach((path) => {
    const method = path.value;
    if ("name" in method.key && typeof method.key.name === "string" && !properties.has(method.key.name)) {
      properties.set(method.key.name, {
        type: typeFor(method.kind),
        tracked: "decorators" in method && Array.isArray(method.decorators) && method.decorators.length > 0
      });
    }
  });
  return properties;
}
var typeFor = function(kind) {
  switch (kind) {
    case "get":
      return "getter";
    case "set":
      return "setter";
    default:
      return "method";
  }
};
function validateDependentKeyCompat(dependentKeys, getterName, properties) {
  for (const key of dependentKeys) {
    const normalized = key.replace(/(\.id|\.length|\.\[\])$/, "");
    const value = properties.get(normalized);
    if (!value) {
      logger.warn(`\`${getterName}\` getter relies on unknown property that may not be tracked: \`${key}\``);
    } else if (!value.tracked) {
      logger.warn(`\`${getterName}\` getter relies on untracked ${value.type ?? "property"}: \`${key}\``);
    }
  }
}

// src/utils/class-method.ts
var isComputedCallExpressionDecorator = function(decorator, computedName) {
  return decorator.expression.type === "CallExpression" && decorator.expression.callee.type === "Identifier" && decorator.expression.callee.name === computedName && decorator.expression.arguments.every((arg) => arg.type === "StringLiteral");
};
var isComputedIdentifierDecoratorForClassMethod = function(decorator, computedName) {
  return decorator.expression.type === "Identifier" && decorator.expression.name === computedName;
};
var computedDecoratorPredicate = function(computedName) {
  return function isComputedDecorator(decorator) {
    return isComputedCallExpressionDecorator(decorator, computedName) || isComputedIdentifierDecoratorForClassMethod(decorator, computedName);
  };
};
function transformComputedClassMethods(j, root, existingImportInfos, properties2) {
  logger.debug("transforming computed class methods");
  const isComputedDecorator = computedDecoratorPredicate(existingImportInfos.computed.localName);
  const result2 = new TransformResult;
  root.find(j.ClassMethod, { kind: "get" }).forEach((path) => {
    const classMethod = path.value;
    if (!classMethod.decorators) {
      return;
    }
    const computedDecorator = classMethod.decorators.find(isComputedDecorator);
    if (!computedDecorator) {
      return;
    }
    const cachedName = existingImportInfos.cached?.localName ?? IMPORTS.cached.importedName;
    const dependentKeyCompatName = existingImportInfos.dependentKeyCompat?.localName ?? IMPORTS.dependentKeyCompat.importedName;
    if (computedDecorator.expression.type === "Identifier" || computedDecorator.expression.arguments.length === 0 || computedDecorator.expression.arguments.every((argument) => {
      return argument.type === "StringLiteral" && existingImportInfos.service && properties2.get(argument.value)?.type === existingImportInfos.service.localName;
    })) {
      replaceComputedDecorator(j, computedDecorator, classMethod, [cachedName]);
      result2.importsToAdd.add(IMPORTS.cached);
    } else {
      validateDependentKeyCompat(computedDecorator.expression.arguments.map((arg) => arg.value), classMethod.key.name ?? "unknown", properties2);
      replaceComputedDecorator(j, computedDecorator, classMethod, [
        cachedName,
        dependentKeyCompatName
      ]);
      result2.importsToAdd.add(IMPORTS.cached);
      result2.importsToAdd.add(IMPORTS.dependentKeyCompat);
    }
  });
  return result2;
}
var replaceComputedDecorator = function(j, computedDecorator, classMethod, newDecoratorNames) {
  if (!classMethod.decorators) {
    throw new Error("trying to replace a decorator on a method without decorators");
  }
  const newDecorators = newDecoratorNames.map((newDecoratorName) => j.decorator.from({
    expression: j.identifier(newDecoratorName)
  }));
  newDecorators[0].comments = computedDecorator.comments ?? null;
  classMethod.decorators.splice(classMethod.decorators.indexOf(computedDecorator), 1, ...newDecorators);
};

// src/utils/class-property.ts
var computedDecoratorPredicate2 = function(computedName) {
  return function isComputedDecorator(decorator) {
    return decorator.expression.type === "CallExpression" && decorator.expression.callee.type === "Identifier" && decorator.expression.callee.name === computedName && decorator.expression.arguments.slice(0, -1).every((arg) => arg.type === "StringLiteral") && decorator.expression.arguments.at(-1)?.type === "FunctionExpression";
  };
};
function transformComputedClassProperties(j, root, existingImportInfos, properties3) {
  logger.debug("transforming computed class properties");
  const isComputedDecoratorForClassProperty = computedDecoratorPredicate2(existingImportInfos.computed.localName);
  const result3 = new TransformResult;
  root.find(j.ClassProperty).forEach((path) => {
    const value = path.value;
    if (!("decorators" in value) || !value.decorators) {
      return;
    }
    const classProperty = value;
    const computedDecorator = classProperty.decorators.find(isComputedDecoratorForClassProperty);
    if (!computedDecorator) {
      return;
    }
    const cachedName = existingImportInfos.cached?.localName ?? IMPORTS.cached.importedName;
    const dependentKeyCompatName = existingImportInfos.dependentKeyCompat?.localName ?? IMPORTS.dependentKeyCompat.importedName;
    if (computedDecorator.expression.arguments.length === 1 || computedDecorator.expression.arguments.slice(0, -1).every((argument) => {
      return argument.type === "StringLiteral" && existingImportInfos.service && properties3.get(argument.value)?.type === existingImportInfos.service.localName;
    })) {
      replaceComputedDecorator2(j, computedDecorator, classProperty, [
        cachedName
      ]);
      result3.importsToAdd.add(IMPORTS.cached);
    } else {
      const dependentKeys = computedDecorator.expression.arguments.reduce((acc, arg) => {
        if (arg.type === "StringLiteral") {
          acc.push(arg.value);
        }
        return acc;
      }, []);
      validateDependentKeyCompat(dependentKeys, classProperty.key.name ?? "unknown", properties3);
      replaceComputedDecorator2(j, computedDecorator, classProperty, [
        cachedName,
        dependentKeyCompatName
      ]);
      result3.importsToAdd.add(IMPORTS.cached);
      result3.importsToAdd.add(IMPORTS.dependentKeyCompat);
    }
    const functionExpressionCopy = {
      ...computedDecorator.expression.arguments.at(-1)
    };
    delete functionExpressionCopy.type;
    const comments = Array.from(new Set([
      ...computedDecorator.comments ?? [],
      ...functionExpressionCopy.leadingComments ?? [],
      ...functionExpressionCopy.trailingComments ?? [],
      ...classProperty.comments ?? [],
      ...classProperty.key.leadingComments ?? []
    ])).sort((a, b) => {
      if (a.loc && b.loc) {
        return a.loc.start.line - b.loc.start.line;
      } else {
        return 0;
      }
    });
    const getter = j.classMethod.from({
      ...functionExpressionCopy,
      kind: "get",
      key: { ...classProperty.key, comments: null },
      params: [],
      decorators: classProperty.decorators,
      comments
    });
    path.replace(getter);
  });
  return result3;
}
var replaceComputedDecorator2 = function(j, computedDecorator, classProperty, newDecoratorNames) {
  if (!("decorators" in classProperty) || !classProperty.decorators) {
    throw new Error("trying to replace a decorator on a property without decorators");
  }
  const newDecorators = newDecoratorNames.map((newDecoratorName) => j.decorator(j.identifier(newDecoratorName)));
  classProperty.decorators.splice(classProperty.decorators.indexOf(computedDecorator), 1, ...newDecorators);
};

// src/index.ts
function transformer(fileOrCollection, api, options) {
  logger.config(options);
  const j = api.jscodeshift;
  const root = "source" in fileOrCollection ? j(fileOrCollection.source) : fileOrCollection;
  const existingImports = parseImports(j, root);
  if (existingImports.computed) {
    logger.debug("computed localName", existingImports.computed.localName);
    const properties4 = parseProperties(j, root, existingImports, options);
    const result4 = new TransformResult;
    result4.merge(transformComputedClassMethods(j, root, existingImports, properties4));
    result4.merge(transformComputedClassProperties(j, root, existingImports, properties4));
    for (const importToAdd of result4.importsToAdd) {
      if (existingImports[importToAdd.importedName] === null) {
        addImport(j, root, importToAdd);
      }
    }
    removeImport(j, existingImports.computed);
  }
  logger.debug("no computed import found");
  return root.toSource({ quote: "single" });
}
export {
  transformer as default
};
