import { cached } from '@glimmer/tracking';

class Foo {
  @cached
  get foo() {
    return this;
  }
}
