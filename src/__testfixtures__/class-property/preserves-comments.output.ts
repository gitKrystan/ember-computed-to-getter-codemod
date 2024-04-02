import { attr } from '@ember-data/model';

import { cached } from '@glimmer/tracking';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') declare bar: string;

  // Decorator leading
  // FunctionExpression leading
  // FunctionExpression trailing
  // Decorator inline
  // Key leading / Decorator trailing
  @cached
  @dependentKeyCompat
  get aliasBar() {
    // FunctionExpression within
    return this.bar;
  } // Key inline
  // Key trailing
}
