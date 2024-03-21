import { notifyPropertyChange } from '@ember/object';

import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') declare bar: string;

  @dependentKeyCompat
  get aliasBar() {
    return this.bar;
  }

  dontDoThis() {
    notifyPropertyChange(this, 'bar');
  }
}
