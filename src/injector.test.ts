import { Injector } from './injector';
import { MultiToken, Token } from './token';
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

  describe('token provider', () => {
    it('should resolve', () => {
      // given
      class Service {}
      const token = new Token<Service>('token');
      const injector = new Injector([
        provider(Service, { deps: [] }),
        provider(token, { token: Service }),
      ]);

      // when
      const instance = injector.get(token);

      // then
      expect(instance).toBeInstanceOf(Service);
    });

    describe('binding already exists', () => {
      it('should resolve', () => {
        // given
        class Service {}
        const token = new Token<Service>('token');
        const injector = new Injector([
          provider(Service, { deps: [] }),
          provider(token, { token: Service }),
        ]);
        const service = injector.get(Service);

        // when
        const instance = injector.get(token);

        // then
        expect(instance).toBe(service);
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
    describe('defined after injector was created', () => {
      it('should not resolve', () => {
        // given
        class Service {}
        const injector = new Injector();
        defaultProvider(Service, { deps: [] });

        // when
        const instance = injector.get(Service, { optional: true });

        // then
        expect(instance).toBeUndefined();
      });
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
      defaultProvider(token, { value: 'DEFAULT' });
      const parentInjector = new Injector([
        provider(token, { value: 'PARENT' }),
      ]);
      const injector = new Injector(
        [provider(token, { value: 'SELF' })],
        parentInjector
      );

      // when
      const instance = injector.get(token, { from: 'self' });

      // then
      expect(instance).toBe('SELF');
    });
    describe('root injector and default provider', () => {
      // given
      const token = new Token('test');
      defaultProvider(token, { value: 'DEFAULT' });
      const injector = new Injector();

      // when
      const instance = injector.get(token, { from: 'self' });

      // then
      expect(instance).toBe('DEFAULT');
    });
    describe('provider missing in self', () => {
      it('should throw', () => {
        // given
        const token = new Token('test');
        defaultProvider(token, { value: 'DEFAULT' });
        const parentInjector = new Injector([
          provider(token, { value: 'PARENT' }),
        ]);
        const injector = new Injector([], parentInjector);
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
          defaultProvider(token, { value: 'DEFAULT' });
          const parentInjector = new Injector([
            provider(token, { value: 'PARENT' }),
          ]);
          const injector = new Injector([], parentInjector);

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
        defaultProvider(Service, {
          factory: () => new Service('default', 'default'),
          deps: [],
        });
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
  });

  describe('cyclic deps', () => {
    describe('self reference', () => {
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
    describe('long cycle', () => {
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

  describe('multi', () => {
    it('should resolve all', () => {
      // given
      const token = new MultiToken<string>('multi');
      defaultProvider(token, { value: 'default1' });
      defaultProvider(token, { value: 'default2' });
      const parentInjector = new Injector([
        provider(token, { value: 'parent1' }),
        provider(token, { value: 'parent2' }),
      ]);
      const injector = new Injector(
        [
          provider(token, { value: 'self1' }),
          provider(token, { value: 'self2' }),
        ],
        parentInjector
      );

      // when
      const instances = injector.get(token);

      // then
      expect(instances).toEqual([
        'default1',
        'default2',
        'parent1',
        'parent2',
        'self1',
        'self2',
      ]);
    });
    describe('existing binding', () => {
      it('should resolve to existing instances', () => {
        // given
        class A {}
        class B {}
        const token = new MultiToken<A | B>('multi');
        const injector = new Injector([
          provider(token, { class: A, deps: [] }),
          provider(token, { class: B, deps: [] }),
        ]);
        const [firstA, firstB] = injector.get(token);

        // when
        const [secondA, secondB] = injector.get(token);

        // then
        expect(secondA).toBe(firstA);
        expect(secondB).toBe(firstB);
      });
    });
    describe('missing provider', () => {
      it('should throw', () => {
        // given
        const token = new MultiToken<string>('multi');
        const injector = new Injector([]);

        // when
        const e = (): void => {
          injector.get(token);
        };

        // then
        expect(e).toThrow('missing provider: multi');
      });

      describe('optional', () => {
        it('should return undefined', () => {
          // given
          const token = new MultiToken<string>('multi');
          const injector = new Injector([]);

          // when
          const instances = injector.get(token, { optional: true });

          // then
          expect(instances).toBeUndefined();
        });
      });
    });
    describe('from self', () => {
      it('should resolve from self', () => {
        // given
        const token = new MultiToken<string>('multi');
        defaultProvider(token, { value: 'default1' });
        defaultProvider(token, { value: 'default2' });
        const parentInjector = new Injector([
          provider(token, { value: 'parent1' }),
          provider(token, { value: 'parent2' }),
        ]);
        const injector = new Injector(
          [
            provider(token, { value: 'self1' }),
            provider(token, { value: 'self2' }),
          ],
          parentInjector
        );

        // when
        const instances = injector.get(token, { from: 'self' });

        // then
        expect(instances).toEqual(['self1', 'self2']);
      });
      describe('missing provider in self', () => {
        it('should throw', () => {
          // given
          const token = new MultiToken<string>('multi');
          defaultProvider(token, { value: 'default1' });
          defaultProvider(token, { value: 'default2' });
          const parentInjector = new Injector([
            provider(token, { value: 'parent1' }),
            provider(token, { value: 'parent2' }),
          ]);
          const injector = new Injector([], parentInjector);

          // when
          const e = (): void => {
            injector.get(token, { from: 'self' });
          };

          // then
          expect(e).toThrow('missing provider: multi');
        });

        describe('optional', () => {
          it('should return undefined', () => {
            // given
            const token = new MultiToken<string>('multi');
            defaultProvider(token, { value: 'default1' });
            defaultProvider(token, { value: 'default2' });
            const parentInjector = new Injector([
              provider(token, { value: 'parent1' }),
              provider(token, { value: 'parent2' }),
            ]);
            const injector = new Injector([], parentInjector);

            // when
            const instances = injector.get(token, {
              from: 'self',
              optional: true,
            });

            // then
            expect(instances).toBeUndefined();
          });
        });
      });
    });
    describe('from ancestors', () => {
      it('should resolve from ancestors', () => {
        // given
        const token = new MultiToken<string>('multi');
        defaultProvider(token, { value: 'default1' });
        defaultProvider(token, { value: 'default2' });
        const parentInjector = new Injector([
          provider(token, { value: 'parent1' }),
          provider(token, { value: 'parent2' }),
        ]);
        const injector = new Injector(
          [
            provider(token, { value: 'self1' }),
            provider(token, { value: 'self2' }),
          ],
          parentInjector
        );

        // when
        const instances = injector.get(token, { from: 'ancestors' });

        // then
        expect(instances).toEqual([
          'default1',
          'default2',
          'parent1',
          'parent2',
        ]);
      });
      describe('missing provider in ancestors', () => {
        it('should throw', () => {
          // given
          const token = new MultiToken<string>('multi');
          const parentInjector = new Injector([]);
          const injector = new Injector(
            [
              provider(token, { value: 'self1' }),
              provider(token, { value: 'self2' }),
            ],
            parentInjector
          );

          // when
          const e = (): void => {
            injector.get(token, { from: 'ancestors' });
          };

          // then
          expect(e).toThrow('missing provider: multi');
        });

        describe('optional', () => {
          it('should return undefined', () => {
            // given
            const token = new MultiToken<string>('multi');
            const parentInjector = new Injector([]);
            const injector = new Injector(
              [
                provider(token, { value: 'self1' }),
                provider(token, { value: 'self2' }),
              ],
              parentInjector
            );

            // when
            const instances = injector.get(token, {
              from: 'ancestors',
              optional: true,
            });

            // then
            expect(instances).toBeUndefined();
          });
        });
      });

      describe('missing parent', () => {
        it('should throw', () => {
          // given
          const token = new MultiToken<string>('multi');
          defaultProvider(token, { value: 'default1' });
          defaultProvider(token, { value: 'default2' });
          const injector = new Injector([
            provider(token, { value: 'self1' }),
            provider(token, { value: 'self2' }),
          ]);

          // when
          const e = (): void => {
            injector.get(token, { from: 'ancestors' });
          };

          // then
          expect(e).toThrow('missing provider: multi');
        });

        describe('optional', () => {
          it('should return undefined', () => {
            // given
            const token = new MultiToken<string>('multi');
            defaultProvider(token, { value: 'default1' });
            defaultProvider(token, { value: 'default2' });
            const injector = new Injector([
              provider(token, { value: 'self1' }),
              provider(token, { value: 'self2' }),
            ]);

            // when
            const instances = injector.get(token, {
              from: 'ancestors',
              optional: true,
            });

            // then
            expect(instances).toBeUndefined();
          });
        });
      });
    });
    describe('cyclic deps', () => {
      describe('self reference', () => {
        it('should throw', () => {
          // given
          const token = new MultiToken<Service>('multi');
          class Service {
            constructor(readonly dep: Service[]) {}
          }
          const injector = new Injector([
            provider(token, { class: Service, deps: [token] }),
          ]);

          const e = (): void => {
            // when
            injector.get(token);
          };

          // then
          expect(e).toThrow(`cyclic deps: multi@0 → multi@0`);
        });
      });
      describe('long cycle', () => {
        it('should throw', () => {
          // given
          const token = new MultiToken<A>('token');
          class A {
            constructor(readonly b: B) {}
          }
          class B {
            constructor(readonly c: C) {}
          }
          class C {
            constructor(readonly a: A[]) {}
          }
          const injector = new Injector([
            provider(token, { class: A, deps: [B] }),
            provider(B, { deps: [C] }),
            provider(C, { class: C, deps: [token] }),
          ]);

          const e = (): void => {
            // when
            injector.get(token);
          };

          // then
          expect(e).toThrow(`cyclic deps: token@0 → B@0 → C@0 → token@0`);
        });

        describe('with path', () => {
          it('should throw', () => {
            // given
            class X {
              constructor(readonly y: Y) {}
            }
            class Y {
              constructor(readonly a: A[]) {}
            }

            const token = new MultiToken<A>('token');
            class A {
              constructor(readonly b: B) {}
            }
            class B {
              constructor(readonly c: C) {}
            }
            class C {
              constructor(readonly a: A[]) {}
            }
            const injector = new Injector([
              provider(X, { deps: [Y] }),
              provider(Y, { deps: [token] }),
              provider(token, { class: A, deps: [B] }),
              provider(B, { deps: [C] }),
              provider(C, { class: C, deps: [token] }),
            ]);

            const e = (): void => {
              // when
              injector.get(X);
            };

            // then
            expect(e).toThrow(
              `cyclic deps: [X@0 → Y@0] token@0 → B@0 → C@0 → token@0`
            );
          });
        });
      });
    });
  });
});
