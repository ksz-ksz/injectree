import { Injector } from './injector';
import { Token } from './token';
import { defaultProvider, provider } from './provider';
import { dep } from './deps';

describe('Injector', () => {
  describe('value provider', () => {
    it('should resolve', () => {
      // given
      const token = new Token('test');
      const injector = new Injector([provider(token, { value: 'RESOLVED' })]);

      // when
      const instance = injector.get(token);

      // then
      expect(instance).toBe('RESOLVED');
    });
  });

  describe('factory provider', () => {
    it('should resolve', () => {
      // given
      const token = new Token('test');
      const injector = new Injector([
        provider(token, { factory: () => 'RESOLVED', deps: [] }),
      ]);

      // when
      const instance = injector.get(token);

      // then
      expect(instance).toBe('RESOLVED');
    });
    describe('with deps', () => {
      it('should resolve', () => {
        // given
        const dep1Token = new Token<string>('dep1');
        const dep2Token = new Token<string>('dep2');
        const token = new Token('test');
        const injector = new Injector([
          provider(dep1Token, { value: 'DEP1' }),
          provider(token, {
            factory: (dep1, dep2) => `RESOLVED:${dep1}:${dep2}`,
            deps: [dep1Token, dep2Token],
          }),
          provider(dep2Token, { value: 'DEP2' }),
        ]);

        // when
        const instance = injector.get(token);

        // then
        expect(instance).toBe('RESOLVED:DEP1:DEP2');
      });
    });
  });

  describe('class provider', () => {
    it('should resolve', () => {
      // given
      class Service {}
      const injector = new Injector([provider(Service, { deps: [] })]);

      // when
      const instance = injector.get(Service);

      // then
      expect(instance).toBeInstanceOf(Service);
    });
    describe('with deps', () => {
      it('should resolve', () => {
        // given
        class Service {
          constructor(readonly dep1: string, readonly dep2: string) {}
        }
        const dep1Token = new Token<string>('dep1');
        const dep2Token = new Token<string>('dep2');
        const injector = new Injector([
          provider(dep1Token, { value: 'DEP1' }),
          provider(Service, {
            deps: [dep1Token, dep2Token],
          }),
          provider(dep2Token, { value: 'DEP2' }),
        ]);

        // when
        const instance = injector.get(Service);

        // then
        expect(instance).toBeInstanceOf(Service);
        expect(instance.dep1).toBe('DEP1');
        expect(instance.dep2).toBe('DEP2');
      });
    });
  });

  describe('abstract class provider', () => {
    it('should resolve', () => {
      // given
      abstract class AbstractService {}
      class Service extends AbstractService {}
      const injector = new Injector([
        provider(AbstractService, { class: Service, deps: [] }),
      ]);

      // when
      const instance = injector.get(AbstractService);

      // then
      expect(instance).toBeInstanceOf(AbstractService);
      expect(instance).toBeInstanceOf(Service);
    });
    describe('with deps', () => {
      it('should resolve', () => {
        // given
        abstract class AbstractService {
          constructor(readonly dep1: string, readonly dep2: string) {}
        }
        class Service extends AbstractService {}
        const dep1Token = new Token<string>('dep1');
        const dep2Token = new Token<string>('dep2');
        const injector = new Injector([
          provider(dep1Token, { value: 'DEP1' }),
          provider(AbstractService, {
            class: Service,
            deps: [dep1Token, dep2Token],
          }),
          provider(dep2Token, { value: 'DEP2' }),
        ]);

        // when
        const instance = injector.get(AbstractService);

        // then
        expect(instance).toBeInstanceOf(AbstractService);
        expect(instance).toBeInstanceOf(Service);
        expect(instance.dep1).toBe('DEP1');
        expect(instance.dep2).toBe('DEP2');
      });
    });
  });

  describe('default provider', () => {
    it('should resolve', () => {
      // given
      class Service {}
      defaultProvider(Service, { deps: [] });
      const injector = new Injector();

      // when
      const instance = injector.get(Service);

      // then
      expect(instance).toBeInstanceOf(Service);
    });

    describe('with deps', () => {
      it('should resolve', () => {
        // given
        const dep1Token = new Token<string>('dep1');
        const dep2Token = new Token<string>('dep2');
        class Service {
          constructor(readonly dep1: string, readonly dep2: string) {}
        }
        defaultProvider(dep1Token, { value: 'DEP1' });
        defaultProvider(Service, { deps: [dep1Token, dep2Token] });
        const injector = new Injector([provider(dep2Token, { value: 'DEP2' })]);

        // when
        const instance = injector.get(Service);

        // then
        expect(instance).toBeInstanceOf(Service);
        expect(instance.dep1).toBe('DEP1');
        expect(instance.dep2).toBe('DEP2');
      });
    });
  });
  describe('missing provider', () => {
    it('should throw', () => {
      // given
      const token = new Token('test');
      const injector = new Injector();

      const e = (): void => {
        // when
        injector.get(token);
      };

      // then
      expect(e).toThrow('missing provider: test');
    });
    describe('optional', () => {
      it('should return undefined', () => {
        // given
        const token = new Token('test');
        const injector = new Injector();

        // when
        const instance = injector.get(token, { optional: true });

        // then
        expect(instance).toBeUndefined();
      });
    });
  });
  describe('existing binding', () => {
    it('should resolve to existing instance', () => {
      // given
      class Service {}
      const injector = new Injector([provider(Service, { deps: [] })]);

      // when
      const firstGet = injector.get(Service);
      const secondGet = injector.get(Service);

      // then
      expect(secondGet).toBe(firstGet);
    });
  });
  describe('existing binding in parent', () => {
    it('should resolve to existing instance from parent', () => {
      // given
      class Service {}
      const parentInjector = new Injector([provider(Service, { deps: [] })]);
      const injector = new Injector([], parentInjector);

      // when
      const firstGet = injector.get(Service);
      const secondGet = injector.get(Service);

      // then
      expect(secondGet).toBe(firstGet);
    });
  });
  describe('from self', () => {
    it('should resolve', () => {
      // given
      const token = new Token('test');
      const parentInjector = new Injector([
        provider(token, { value: 'PARENT' }),
      ]);
      const injector = new Injector(
        [provider(token, { value: 'SELF' })],
        parentInjector
      );
      defaultProvider(token, { value: 'DEFAULT' });

      // when
      const instance = injector.get(token, { from: 'self' });

      // then
      expect(instance).toBe('SELF');
    });
    describe('root injector and default provider', () => {
      // given
      const token = new Token('test');
      const injector = new Injector();
      defaultProvider(token, { value: 'DEFAULT' });

      // when
      const instance = injector.get(token, { from: 'self' });

      // then
      expect(instance).toBe('DEFAULT');
    });
    describe('provider missing in self', () => {
      it('should throw', () => {
        // given
        const token = new Token('test');
        const parentInjector = new Injector([
          provider(token, { value: 'PARENT' }),
        ]);
        const injector = new Injector([], parentInjector);
        defaultProvider(token, { value: 'DEFAULT' });
        const e = (): void => {
          // when
          injector.get(token, { from: 'self' });
        };

        // then
        expect(e).toThrow('missing provider: test');
      });
      describe('optional', () => {
        it('should return undefined', () => {
          // given
          const token = new Token('test');
          const parentInjector = new Injector([
            provider(token, { value: 'PARENT' }),
          ]);
          const injector = new Injector([], parentInjector);
          defaultProvider(token, { value: 'DEFAULT' });

          // when
          const instance = injector.get(token, {
            from: 'self',
            optional: true,
          });

          // then
          expect(instance).toBeUndefined();
        });
      });
    });
    describe('with deps from self and ancestors', () => {
      it('should resolve', () => {
        // given
        class Service {
          constructor(readonly dep1: string, readonly dep2: string) {}
        }
        const dep1Token = new Token<string>('dep1');
        const dep2Token = new Token<string>('dep2');
        const parentInjector = new Injector([
          provider(dep1Token, { value: 'DEP1' }),
        ]);
        const injector = new Injector(
          [
            provider(Service, {
              deps: [dep1Token, dep2Token],
            }),
            provider(dep2Token, { value: 'DEP2' }),
          ],
          parentInjector
        );
        defaultProvider(Service, {
          factory: () => new Service('default', 'default'),
          deps: [],
        });

        // when
        const instance = injector.get(Service, { from: 'self' });

        // then
        expect(instance).toBeInstanceOf(Service);
        expect(instance.dep1).toBe('DEP1');
        expect(instance.dep2).toBe('DEP2');
      });
    });
  });
  describe('from ancestors', () => {
    it('should resolve', () => {
      // given
      const token = new Token('test');
      const parentInjector = new Injector([
        provider(token, { value: 'PARENT' }),
      ]);
      const injector = new Injector(
        [provider(token, { value: 'SELF' })],
        parentInjector
      );

      // when
      const instance = injector.get(token, { from: 'ancestors' });

      // then
      expect(instance).toBe('PARENT');
    });
    it('should resolve from default', () => {
      // given
      const token = new Token('test');
      defaultProvider(token, { value: 'DEFAULT' });
      const parentInjector = new Injector([]);
      const injector = new Injector(
        [provider(token, { value: 'SELF' })],
        parentInjector
      );

      // when
      const instance = injector.get(token, { from: 'ancestors' });

      // then
      expect(instance).toBe('DEFAULT');
    });
    describe('with deps from parent', () => {
      it('should resolve', () => {
        // given
        class Service {
          constructor(readonly dep1: string, readonly dep2: string) {}
        }
        const dep1Token = new Token<string>('dep1');
        const dep2Token = new Token<string>('dep2');
        const parentInjector = new Injector([
          provider(dep1Token, { value: 'PARENT_DEP1' }),
          provider(Service, {
            deps: [dep1Token, dep2Token],
          }),
          provider(dep2Token, { value: 'PARENT_DEP2' }),
        ]);
        const injector = new Injector(
          [
            provider(dep1Token, { value: 'SELF_DEP1' }),
            provider(Service, {
              deps: [dep1Token, dep2Token],
            }),
            provider(dep2Token, { value: 'SELF_DEP2' }),
          ],
          parentInjector
        );

        // when
        const instance = injector.get(Service, { from: 'ancestors' });

        // then
        expect(instance.dep1).toBe('PARENT_DEP1');
        expect(instance.dep2).toBe('PARENT_DEP2');
      });
    });
    describe('with deps from self', () => {
      it('should throw', () => {
        // given
        class Service {
          constructor(readonly dep1: string, readonly dep2: string) {}
        }
        const dep1Token = new Token<string>('dep1');
        const dep2Token = new Token<string>('dep2');
        const parentInjector = new Injector([
          provider(Service, {
            deps: [dep1Token, dep2Token],
          }),
        ]);
        const injector = new Injector(
          [
            provider(dep1Token, { value: 'SELF_DEP1' }),
            provider(Service, {
              deps: [dep1Token, dep2Token],
            }),
            provider(dep2Token, { value: 'SELF_DEP2' }),
          ],
          parentInjector
        );

        const e = (): void => {
          // when
          injector.get(Service, { from: 'ancestors' });
        };

        // then
        expect(e).toThrow('missing provider: [Service@0] dep1');
      });
    });
    describe('existing binding in self', () => {
      it('should resolve to parent', () => {
        // given
        const token = new Token('test');
        const parentInjector = new Injector([
          provider(token, { value: 'PARENT' }),
        ]);
        const injector = new Injector(
          [provider(token, { value: 'SELF' })],
          parentInjector
        );
        expect(injector.get(token)).toBe('SELF');

        // when
        const instance = injector.get(token, { from: 'ancestors' });

        // then
        expect(instance).toBe('PARENT');
      });
    });
    describe('missing parent', () => {
      it('should throw', () => {
        // given
        const token = new Token('test');
        defaultProvider(token, { value: 'DEFAULT' });
        const injector = new Injector([provider(token, { value: 'SELF' })]);

        const e = (): void => {
          // when
          injector.get(token, { from: 'ancestors' });
        };

        // then
        expect(e).toThrow('missing provider: test');
      });
      describe('optional', () => {
        it('should throw', () => {
          // given
          const token = new Token('test');
          defaultProvider(token, { value: 'DEFAULT' });
          const injector = new Injector([provider(token, { value: 'SELF' })]);

          // when
          const instance = injector.get(token, {
            from: 'ancestors',
            optional: true,
          });

          // then
          expect(instance).toBeUndefined();
        });
      });
    });
  });

  describe('deps', () => {
    it('should resolve', () => {
      // given
      class Service {
        constructor(readonly dep: string) {}
      }
      const depToken = new Token<string>('dep');
      const injector = new Injector([
        provider(Service, { deps: [depToken] }),
        provider(depToken, { value: 'DEP' }),
      ]);

      // when
      const instance = injector.get(Service);

      // then
      expect(instance.dep).toBe('DEP');
    });
    describe('missing dep provider', () => {
      it('should throw', () => {
        // given
        class Service {
          constructor(readonly dep: string) {}
        }
        const depToken = new Token<string>('dep');
        const injector = new Injector([
          provider(Service, { deps: [depToken] }),
        ]);

        const e = (): void => {
          // when
          injector.get(Service);
        };

        // then
        expect(e).toThrow('missing provider: [Service@0] dep');
      });
      describe('optional', () => {
        it('should return undefined', () => {
          // given
          class Service {
            constructor(readonly dep: string) {}
          }
          const depToken = new Token<string>('dep');
          const injector = new Injector([
            provider(Service, { deps: [dep(depToken, { optional: true })] }),
          ]);

          // when
          const instance = injector.get(Service);

          // then
          expect(instance.dep).toBeUndefined();
        });
      });
    });
    describe('from self', () => {
      it('should resolve', () => {
        // given
        class Service {
          constructor(readonly dep: string) {}
        }
        const depToken = new Token<string>('dep');
        defaultProvider(depToken, { value: 'DEFAULT_DEP' });
        const parentInjector = new Injector([
          provider(depToken, { value: 'PARENT_DEP' }),
        ]);
        const injector = new Injector(
          [
            provider(Service, { deps: [dep(depToken, { from: 'self' })] }),
            provider(depToken, { value: 'SELF_DEP' }),
          ],
          parentInjector
        );

        // when
        const instance = injector.get(Service);

        // then
        expect(instance.dep).toBe('SELF_DEP');
      });
      describe('root injector with default provider', () => {
        it('should resolve', () => {
          // given
          class Service {
            constructor(readonly dep: string) {}
          }

          const depToken = new Token<string>('dep');
          defaultProvider(depToken, { value: 'DEFAULT_DEP' });
          const injector = new Injector([
            provider(Service, { deps: [dep(depToken, { from: 'self' })] }),
          ]);

          // when
          const instance = injector.get(Service);

          // then
          expect(instance.dep).toBe('DEFAULT_DEP');
        });
      });
      describe('missing dep provider', () => {
        it('should throw', () => {
          // given
          class Service {
            constructor(readonly dep: string) {}
          }
          const depToken = new Token<string>('dep');
          defaultProvider(depToken, { value: 'DEFAULT_DEP' });
          const parentInjector = new Injector([
            provider(depToken, { value: 'PARENT_DEP' }),
          ]);
          const injector = new Injector(
            [provider(Service, { deps: [dep(depToken, { from: 'self' })] })],
            parentInjector
          );

          const e = (): void => {
            // when
            injector.get(Service);
          };

          // then
          expect(e).toThrow('missing provider: [Service@1] dep');
        });
        describe('optional', () => {
          it('should return undefined', () => {
            // given
            class Service {
              constructor(readonly dep: string) {}
            }
            const depToken = new Token<string>('dep');
            defaultProvider(depToken, { value: 'DEFAULT_DEP' });
            const parentInjector = new Injector([
              provider(depToken, { value: 'PARENT_DEP' }),
            ]);
            const injector = new Injector(
              [
                provider(Service, {
                  deps: [dep(depToken, { from: 'self', optional: true })],
                }),
              ],
              parentInjector
            );

            // when
            const instance = injector.get(Service);

            // then
            expect(instance.dep).toBeUndefined();
          });
        });
      });
    });
    describe('from ancestors', () => {
      it('should resolve', () => {
        // given
        class Service {
          constructor(readonly dep: string) {}
        }
        const depToken = new Token<string>('dep');
        defaultProvider(depToken, { value: 'DEFAULT_DEP' });
        const parentInjector = new Injector([
          provider(depToken, { value: 'PARENT_DEP' }),
        ]);
        const injector = new Injector(
          [
            provider(Service, { deps: [dep(depToken, { from: 'ancestors' })] }),
            provider(depToken, { value: 'SELF_DEP' }),
          ],
          parentInjector
        );

        // when
        const instance = injector.get(Service);

        // then
        expect(instance.dep).toBe('PARENT_DEP');
      });
      it('should resolve from default', () => {
        // given
        class Service {
          constructor(readonly dep: string) {}
        }
        const depToken = new Token<string>('dep');
        defaultProvider(depToken, { value: 'DEFAULT_DEP' });
        const parentInjector = new Injector([]);
        const injector = new Injector(
          [
            provider(Service, { deps: [dep(depToken, { from: 'ancestors' })] }),
            provider(depToken, { value: 'SELF_DEP' }),
          ],
          parentInjector
        );

        // when
        const instance = injector.get(Service);

        // then
        expect(instance.dep).toBe('DEFAULT_DEP');
      });
      describe('missing parent', () => {
        it('should throw', () => {
          // given
          class Service {
            constructor(readonly dep: string) {}
          }
          const depToken = new Token<string>('dep');
          defaultProvider(depToken, { value: 'DEFAULT_DEP' });
          const injector = new Injector([
            provider(Service, { deps: [dep(depToken, { from: 'ancestors' })] }),
          ]);

          const e = (): void => {
            // when
            injector.get(Service);
          };

          // then
          expect(e).toThrow('missing provider: [Service@0] dep');
        });
        describe('optional', () => {
          it('should return undefined', () => {
            // given
            class Service {
              constructor(readonly dep: string) {}
            }
            const depToken = new Token<string>('dep');
            defaultProvider(depToken, { value: 'DEFAULT_DEP' });
            const injector = new Injector([
              provider(Service, {
                deps: [dep(depToken, { from: 'ancestors', optional: true })],
              }),
            ]);

            // when
            const instance = injector.get(Service);

            // then
            expect(instance.dep).toBeUndefined();
          });
        });
      });
      describe('missing dep provider', () => {
        it('should throw', () => {
          // given
          class Service {
            constructor(readonly dep: string) {}
          }
          const depToken = new Token<string>('dep');
          const parentInjector = new Injector([]);
          const injector = new Injector(
            [
              provider(Service, {
                deps: [dep(depToken, { from: 'ancestors' })],
              }),
              provider(depToken, { value: 'SELF_DEP' }),
            ],
            parentInjector
          );

          const e = (): void => {
            // when
            injector.get(Service);
          };

          // then
          expect(e).toThrow('missing provider: [Service@1] dep');
        });
        describe('optional', () => {
          it('should return undefined', () => {
            // given
            class Service {
              constructor(readonly dep: string) {}
            }
            const depToken = new Token<string>('dep');
            const parentInjector = new Injector([]);
            const injector = new Injector(
              [
                provider(Service, {
                  deps: [dep(depToken, { from: 'ancestors', optional: true })],
                }),
                provider(depToken, { value: 'SELF_DEP' }),
              ],
              parentInjector
            );

            // when
            const instance = injector.get(Service);

            // then
            expect(instance.dep).toBeUndefined();
          });
        });
      });
    });
    describe('short cyclic dependency', () => {
      it('should throw', () => {
        // given
        class Service {
          constructor(readonly dep: Service) {}
        }
        const injector = new Injector([provider(Service, { deps: [Service] })]);

        const e = (): void => {
          // when
          injector.get(Service);
        };

        // then
        expect(e).toThrow(`cyclic deps: Service@0 → Service@0`);
      });
    });
    describe('long cyclic dependency', () => {
      it('should throw', () => {
        // given
        class A {
          constructor(readonly b: B) {}
        }
        class B {
          constructor(readonly c: C) {}
        }
        class C {
          constructor(readonly a: A) {}
        }
        const injector = new Injector([
          provider(A, { deps: [B] }),
          provider(B, { deps: [C] }),
          provider(C, { deps: [A] }),
        ]);

        const e = (): void => {
          // when
          injector.get(A);
        };

        // then
        expect(e).toThrow(`cyclic deps: A@0 → B@0 → C@0 → A@0`);
      });

      describe('with path', () => {
        it('should throw', () => {
          // given
          class X {
            constructor(readonly y: Y) {}
          }
          class Y {
            constructor(readonly a: A) {}
          }

          class A {
            constructor(readonly b: B) {}
          }
          class B {
            constructor(readonly c: C) {}
          }
          class C {
            constructor(readonly a: A) {}
          }
          const injector = new Injector([
            provider(X, { deps: [Y] }),
            provider(Y, { deps: [A] }),
            provider(A, { deps: [B] }),
            provider(B, { deps: [C] }),
            provider(C, { deps: [A] }),
          ]);

          const e = (): void => {
            // when
            injector.get(X);
          };

          // then
          expect(e).toThrow(`cyclic deps: [X@0 → Y@0] A@0 → B@0 → C@0 → A@0`);
        });
      });
    });
  });
});
