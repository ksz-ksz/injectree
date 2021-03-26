import {
  isClassProvider,
  isFactoryProvider,
  isValueProvider,
  provider,
  Provider,
} from './provider';

interface Test {
  description: string;
  provider: Provider<unknown>;
  is: (x: Provider<unknown>) => boolean;
}

class Test {}

const tests: Test[] = [
  {
    description: 'value provider',
    provider: { value: 42 },
    is: isValueProvider,
  },
  {
    description: 'factory provider',
    provider: { factory: (): number => 42, deps: [] },
    is: isFactoryProvider,
  },
  {
    description: 'class provider',
    provider: { class: Test, deps: [] },
    is: isClassProvider,
  },
];

const guards = [isValueProvider, isFactoryProvider, isClassProvider];

describe('provider', () => {
  guards.forEach((guard) => {
    describe(guard.name, () => {
      tests.forEach((test) => {
        describe(`for ${test.description}`, () => {
          if (test.is === guard) {
            it('should return true', () => {
              // when
              const result = guard(test.provider);

              // then
              expect(result).toBe(true);
            });
          } else {
            it('should return false', () => {
              // when
              const result = guard(test.provider);

              // then
              expect(result).toBe(false);
            });
          }
        });
      });
    });
  });
});
