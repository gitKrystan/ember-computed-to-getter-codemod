import { computed } from '@ember/object';
import { attr } from '@ember-data/model';

class Foo {
  @attr('string') declare bar: string;

  // Decorator leading
  @computed('bar') // Decorator inline
  // Decorator trailing / ClassMethod leading
  get aliasBar() {
    // Within ClassMethod
    return this.bar;
  }
  // ClassMethod trailing
}
