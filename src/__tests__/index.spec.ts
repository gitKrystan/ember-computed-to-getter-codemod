import { defineTest } from 'jscodeshift/src/testUtils';

function makeTest(fixtureName: string) {
  defineTest(__dirname, './index', null, fixtureName, { parser: 'ts' });
}

describe('imports', () => {
  makeTest('imports/single-specifier');
  makeTest('imports/multiple-specifiers');
  makeTest('imports/already-has-dependent-key-compat');
  makeTest('imports/already-has-dependent-key-compat-2');
});

describe('class-method', () => {
  makeTest('class-method/simple-class-method');
});
