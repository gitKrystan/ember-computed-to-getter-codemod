import { cached } from '@glimmer/tracking';

class Foo {
  @cached
  get foo() {
    return this;
  }

  @cached
  get foo2() {
    return this;
  }
}
