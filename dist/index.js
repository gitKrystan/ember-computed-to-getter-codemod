// src/utils/imports.ts
function removeComputedSpecifier(j, root) {
  let computedName = null;
  root.find(j.ImportDeclaration, {
    source: {
      value: "@ember/object"
    }
  }).forEach((path) => {
    const importDeclaration = path.value;
    const specifiers = importDeclaration.specifiers;
    if (!specifiers) {
      return;
    }
    const computedSpecifiers = specifiers.filter((specifier) => specifier.type === "ImportSpecifier" && specifier.imported.name === "computed");
    if (computedSpecifiers.length > 1) {
      throw new Error("Found more than one `computed` specifier. @gitKrystan assumed this was not possible.");
    }
    const [computedSpecifier] = computedSpecifiers;
    if (computedSpecifier) {
      if (specifiers.length === 1) {
        j(path).remove();
      } else {
        importDeclaration.specifiers = specifiers.filter((specifier) => {
          return !computedSpecifiers.includes(specifier);
        });
      }
      computedName = computedSpecifier.local?.name ?? computedSpecifier.imported.name;
    }
  });
  return computedName;
}
function addDependentKeyCompatImport(j, root) {
  const existingImport = root.find(j.ImportDeclaration, {
    source: {
      value: "@ember/object/compat"
    }
  });
  if (existingImport.length === 0) {
    const lastImport = root.find(j.ImportDeclaration).at(-1);
    if (lastImport.length === 0) {
      root.find(j.Program).get("body", 0).insertBefore(j.importDeclaration([j.importSpecifier(j.identifier("dependentKeyCompat"))], j.literal("@ember/object/compat")));
    } else {
      lastImport.insertAfter(j.importDeclaration([j.importSpecifier(j.identifier("dependentKeyCompat"))], j.literal("@ember/object/compat")));
    }
  } else if (!existingImport.paths().some((path) => path.value.specifiers?.some((specifier) => ("imported" in specifier) && specifier.imported.name === "dependentKeyCompat"))) {
    const first = existingImport.paths()[0];
    first.value.specifiers = [
      ...first.value.specifiers ?? [],
      j.importSpecifier(j.identifier("dependentKeyCompat"))
    ];
  }
}

// src/utils/class-method.ts
var computedDecoratorForClassMethodPredicate = function(computedName) {
  return function isComputedDecoratorForClassMethod(decorator) {
    return decorator.expression.type === "CallExpression" && decorator.expression.callee.type === "Identifier" && decorator.expression.callee.name === computedName && decorator.expression.arguments.every((arg) => arg.type === "StringLiteral");
  };
};
function transformComputedClassMethods(j, root, computedName) {
  const isComputedDecoratorForClassMethod = computedDecoratorForClassMethodPredicate(computedName);
  console.log(root.find(j.ClassMethod).length);
  root.find(j.ClassMethod, { kind: "get" }).forEach((path) => {
    const classMethod = path.value;
    if (!classMethod.decorators) {
      return;
    }
    const computedDecorator = classMethod.decorators.find(isComputedDecoratorForClassMethod);
    if (computedDecorator) {
      const dependentKeyCompat = j.decorator.from({
        expression: j.identifier("dependentKeyCompat"),
        comments: computedDecorator.comments ?? null
      });
      classMethod.decorators.splice(classMethod.decorators.indexOf(computedDecorator), 1, dependentKeyCompat);
    }
  });
}

// src/utils/class-property.ts
var computedDecoratorForClassPropertyPredicate = function(computedName) {
  return function isComputedDecoratorForClassProperty(decorator) {
    return decorator.expression.type === "CallExpression" && decorator.expression.callee.type === "Identifier" && decorator.expression.callee.name === computedName && decorator.expression.arguments.slice(0, -1).every((arg) => arg.type === "StringLiteral") && decorator.expression.arguments.at(-1)?.type === "FunctionExpression";
  };
};
function transformComputedClassProperties(j, root, computedName) {
  const isComputedDecoratorForClassProperty = computedDecoratorForClassPropertyPredicate(computedName);
  root.find(j.ClassProperty).forEach((path) => {
    const value = path.value;
    if (!("decorators" in value) || !value.decorators) {
      return;
    }
    const classProperty = value;
    const computedDecoratorIndex = classProperty.decorators.findIndex(isComputedDecoratorForClassProperty);
    if (computedDecoratorIndex > -1) {
      const dependentKeyCompat = j.decorator(j.identifier("dependentKeyCompat"));
      const [computedDecorator] = classProperty.decorators.splice(computedDecoratorIndex, 1, dependentKeyCompat);
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
    }
  });
}

// src/index.ts
function transformer(fileOrCollection, api, options) {
  const j = api.jscodeshift;
  const root = "source" in fileOrCollection ? j(fileOrCollection.source) : fileOrCollection;
  const removedComputedName = removeComputedSpecifier(j, root);
  if (removedComputedName) {
    if (options.verbose === "2") {
      console.log("removedComputedName", removedComputedName);
      console.log("adding dependentKeyCompat import");
    }
    addDependentKeyCompatImport(j, root);
    if (options.verbose === "2") {
      console.log("transforming computed class methods");
    }
    transformComputedClassMethods(j, root, removedComputedName);
    if (options.verbose === "2") {
      console.log("transforming computed class properties");
    }
    transformComputedClassProperties(j, root, removedComputedName);
  }
  return root.toSource({ quote: "single" });
}
export {
  transformer as default
};
