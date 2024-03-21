import { computed, notifyPropertyChange } from '@ember/object';

class Foo {
  @attr('string') declare bar: string;

  @computed('bar')
  get aliasBar() {
    return this.bar;
  }

  dontDoThis() {
    notifyPropertyChange(this, 'bar');
  }
}
