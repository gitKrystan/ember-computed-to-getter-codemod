import { notifyPropertyChange } from '@ember/object';

import { cached } from '@glimmer/tracking';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') declare bar: string;

  @cached
  @dependentKeyCompat
  get aliasBar() {
    return this.bar;
  }

  dontDoThis() {
    notifyPropertyChange(this, 'bar');
  }
}
