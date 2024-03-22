// node_modules/.pnpm/chalk@5.3.0/node_modules/chalk/source/vendor/ansi-styles/index.js
var assembleStyles = function() {
  const codes = new Map;
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
};
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    blackBright: [90, 39],
    gray: [90, 39],
    grey: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/.pnpm/chalk@5.3.0/node_modules/chalk/source/vendor/supports-color/browser.js
var level = (() => {
  if (navigator.userAgentData) {
    const brand = navigator.userAgentData.brands.find(({ brand: brand2 }) => brand2 === "Chromium");
    if (brand && brand.version > 93) {
      return 3;
    }
  }
  if (/\b(Chrome|Chromium)\//.test(navigator.userAgent)) {
    return 1;
  }
  return 0;
})();
var colorSupport = level !== 0 && {
  level,
  hasBasic: true,
  has256: level >= 2,
  has16m: level >= 3
};
var supportsColor = {
  stdout: colorSupport,
  stderr: colorSupport
};
var browser_default = supportsColor;

// node_modules/.pnpm/chalk@5.3.0/node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = string.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// /Users/khuffmenne/Documents/Code/OSS/gitKrystan/ember-computed-to-getter-codemod/node_modules/chalk/source/index.js
var createChalk = function(options) {
  return chalkFactory(options);
};
var { stdout: stdoutColor, stderr: stderrColor } = browser_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === undefined ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk = (...strings) => strings.join(" ");
  applyOptions(chalk, options);
  Object.setPrototypeOf(chalk, createChalk.prototype);
  return chalk;
};
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level2, type, ...arguments_) => {
  if (model === "rgb") {
    if (level2 === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level2 === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level2, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level: level2 } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level2], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level: level2 } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level2], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {
}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level2) {
      this[GENERATOR].level = level2;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === undefined) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === undefined) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf("\n");
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// src/utils/log.ts
class Logger {
  options = {};
  config(options) {
    this.options = options;
  }
  warn(...args) {
    console.log(source_default.yellow("[WARN]"), ...args);
  }
  debug(...args) {
    if (this.options.verbose === "2") {
      console.log(...args);
    }
  }
}
var logger = new Logger;

// src/utils/imports.ts
function parseImports(j, root) {
  const infos = {
    computed: null,
    cached: null,
    dependentKeyCompat: null
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
  }
};

// src/utils/result.ts
class TransformResult {
  importsToAdd = new Set;
  merge(other) {
    other.importsToAdd.forEach((importToAdd) => this.importsToAdd.add(importToAdd));
  }
}

// src/utils/tracking.ts
function parsePropertyTracking(j, root) {
  const properties = new Map;
  root.find(j.ClassProperty).forEach((path) => {
    const property = path.value;
    if ("name" in property.key && typeof property.key.name === "string") {
      properties.set(property.key.name, {
        type: "property",
        tracked: "decorators" in property && Array.isArray(property.decorators) && property.decorators.length > 0
      });
    }
  });
  root.find(j.ClassMethod).forEach((path) => {
    const method = path.value;
    if ("name" in method.key && typeof method.key.name === "string") {
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
function validateDependentKeyCompat(dependentKeys, getterName, propertyTracking) {
  for (const key of dependentKeys) {
    const value = propertyTracking.get(key);
    if (!value) {
      logger.warn(`\`${getterName}\` getter relies on unknown property that may not be tracked: \`${key}\``);
    } else if (!value.tracked) {
      logger.warn(`\`${getterName}\` getter relies on untracked ${value.type}: \`${key}\``);
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
function transformComputedClassMethods(j, root, existingImportInfos, propertyTracking) {
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
    if (computedDecorator.expression.type === "Identifier" || computedDecorator.expression.arguments.length === 0) {
      replaceComputedDecorator(j, computedDecorator, classMethod, existingImportInfos.cached?.localName ?? IMPORTS.cached.importedName);
      result2.importsToAdd.add(IMPORTS.cached);
    } else {
      validateDependentKeyCompat(computedDecorator.expression.arguments.map((arg) => arg.value), classMethod.key.name ?? "unknown", propertyTracking);
      replaceComputedDecorator(j, computedDecorator, classMethod, existingImportInfos.dependentKeyCompat?.localName ?? IMPORTS.dependentKeyCompat.importedName);
      result2.importsToAdd.add(IMPORTS.dependentKeyCompat);
    }
  });
  return result2;
}
var replaceComputedDecorator = function(j, computedDecorator, classMethod, newDecoratorName) {
  if (!classMethod.decorators) {
    throw new Error("trying to replace a decorator on a method without decorators");
  }
  const dependentKeyCompat = j.decorator.from({
    expression: j.identifier(newDecoratorName),
    comments: computedDecorator.comments ?? null
  });
  classMethod.decorators.splice(classMethod.decorators.indexOf(computedDecorator), 1, dependentKeyCompat);
};

// src/utils/class-property.ts
var computedDecoratorPredicate2 = function(computedName) {
  return function isComputedDecorator(decorator) {
    return decorator.expression.type === "CallExpression" && decorator.expression.callee.type === "Identifier" && decorator.expression.callee.name === computedName && decorator.expression.arguments.slice(0, -1).every((arg) => arg.type === "StringLiteral") && decorator.expression.arguments.at(-1)?.type === "FunctionExpression";
  };
};
function transformComputedClassProperties(j, root, existingImportInfos) {
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
    if (computedDecorator) {
      if (computedDecorator.expression.arguments.length === 1) {
        replaceComputedDecorator2(j, computedDecorator, classProperty, existingImportInfos.cached?.localName ?? IMPORTS.cached.importedName);
        result3.importsToAdd.add(IMPORTS.cached);
      } else {
        replaceComputedDecorator2(j, computedDecorator, classProperty, existingImportInfos.dependentKeyCompat?.localName ?? IMPORTS.dependentKeyCompat.importedName);
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
    }
  });
  return result3;
}
var replaceComputedDecorator2 = function(j, computedDecorator, classProperty, newDecoratorName) {
  if (!("decorators" in classProperty) || !classProperty.decorators) {
    throw new Error("trying to replace a decorator on a property without decorators");
  }
  const dependentKeyCompat = j.decorator(j.identifier(newDecoratorName));
  classProperty.decorators.splice(classProperty.decorators.indexOf(computedDecorator), 1, dependentKeyCompat);
};

// src/index.ts
function transformer(fileOrCollection, api, options) {
  logger.config(options);
  const j = api.jscodeshift;
  const root = "source" in fileOrCollection ? j(fileOrCollection.source) : fileOrCollection;
  const existingImports = parseImports(j, root);
  if (existingImports.computed) {
    logger.debug("computed localName", existingImports.computed.localName);
    const propertyTracking = parsePropertyTracking(j, root);
    const result4 = new TransformResult;
    result4.merge(transformComputedClassMethods(j, root, existingImports, propertyTracking));
    result4.merge(transformComputedClassProperties(j, root, existingImports));
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
