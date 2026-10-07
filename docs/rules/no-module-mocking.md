# standards/no-module-mocking

Reports module mocking with Vitest or Jest. A module mock replaces an import behind the code's back. Pass the dependency in through a parameter or interface and give the test a working implementation.

Enabled in the preset: `"error"`.

The rule reports `vi.mock`, `vi.doMock`, `vi.unstable_mockModule`, `jest.mock`, `jest.doMock` and `jest.unstable_mockModule`, including computed access such as `vi["mock"]`. `vi` counts when it is imported from `vitest` or used as an undeclared global. `jest` counts when it is imported from `@jest/globals` or used as an undeclared global. Renamed imports are followed.

## Examples

### Incorrect

```ts
import { vi } from "vitest"

vi.mock("./clock.ts")
```

### Correct

```ts
import { createScheduler } from "./scheduler.ts"

const scheduler = createScheduler({ now: () => 0 })
```

## Exceptions

- `vi.fn`, `vi.spyOn`, `vi.useFakeTimers` and the other non-module helpers.
- A local variable named `vi` or `jest`, or one imported from another module.
