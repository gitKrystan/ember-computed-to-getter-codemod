import { attr } from '@ember-data/model';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') bar;

  // Decorator leading
  // FunctionExpression leading
  // FunctionExpression trailing
  // Decorator inline
  // Key leading / Decorator trailing
  @dependentKeyCompat
  get aliasBar() {
    // FunctionExpression within
    return this.bar;
  } // Key inline
  // Key trailing
}
