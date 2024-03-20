import { computed as emberComputed } from '@ember/object';
import { attr } from '@ember-data/model';

class Foo {
  @attr('string') declare bar: string;

  @emberComputed('bar', function () {
    return this.bar;
  })
  aliasBar;
}
