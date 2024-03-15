import { defineTest } from 'jscodeshift/src/testUtils';

describe('hello', () => {
  defineTest(__dirname, './index', null, 'basic', { parser: 'ts' });
});
