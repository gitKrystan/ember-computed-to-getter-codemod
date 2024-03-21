import { computed } from '@ember/object';

class Foo {
  @computed(function () {
    return this;
  })
  foo;
}
