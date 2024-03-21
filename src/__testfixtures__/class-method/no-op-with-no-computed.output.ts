import { attr } from '@ember-data/model';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') declare bar: string;

  get aliasBar() {
    return this.bar;
  }
}
