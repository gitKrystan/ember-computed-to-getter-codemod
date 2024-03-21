import { computed } from '@ember/object';

class Foo {
  @computed
  get foo() {
    return this;
  }

  @computed()
  get foo2() {
    return this;
  }
}
