import { computed as emberComputed } from '@ember/object';
import { attr } from '@ember-data/model';

class Foo {
  @attr('string') declare bar: string;

  @emberComputed('bar')
  get aliasBar() {
    return this.bar;
  }
}
