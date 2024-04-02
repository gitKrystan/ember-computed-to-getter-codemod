import { attr } from '@ember-data/model';

import { cached } from '@glimmer/tracking';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') declare bar: string;

  @cached
  @dependentKeyCompat
  get aliasBar() {
    return this.bar;
  }
}
