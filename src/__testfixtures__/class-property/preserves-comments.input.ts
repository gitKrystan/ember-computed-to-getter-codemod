import { computed } from '@ember/object';
import { attr } from '@ember-data/model';

class Foo {
  @attr('string') declare bar: string;

  // Decorator leading
  @computed(
    'bar',
    // FunctionExpression leading
    function () {
      // FunctionExpression within
      return this.bar;
    },
    // FunctionExpression trailing
  ) // Decorator inline
  // Key leading / Decorator trailing
  aliasBar; // Key inline
  // Key trailing
}
