import { computed } from '@ember/object';
import { attr } from '@ember-data/model';

class Foo {
  @attr('string') declare bar: string;

  get aliasBar() {
    return this.bar;
  }
}
