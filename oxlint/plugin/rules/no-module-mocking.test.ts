import { noModuleMockingRule } from "./no-module-mocking.ts"
import { ruleTester } from "./rule-tester.ts"

ruleTester.run("no-module-mocking", noModuleMockingRule, {
  invalid: [
    {
      code: "import { vi } from 'vitest'; vi.mock('./thing')",
      errors: [{ messageId: "moduleMock" }],
    },
    {
      code: "import { vi } from 'vitest'; vi.doMock('./thing')",
      errors: [{ messageId: "moduleMock" }],
    },
    {
      code: "import { vi } from 'vitest'; vi['mock']('./thing')",
      errors: [{ messageId: "moduleMock" }],
    },
    {
      code: "import { jest } from '@jest/globals'; jest.mock('./thing')",
      errors: [{ messageId: "moduleMock" }],
    },
    {
      code: "import { jest } from '@jest/globals'; jest.unstable_mockModule('./thing')",
      errors: [{ messageId: "moduleMock" }],
    },
    // The globals, unimported.
    { code: "vi.mock('./thing')", errors: [{ messageId: "moduleMock" }] },
    { code: "jest.mock('./thing')", errors: [{ messageId: "moduleMock" }] },
    {
      code: "import { vi as v } from 'vitest'; v.mock('./thing')",
      errors: [{ messageId: "moduleMock" }],
    },
  ],
  valid: [
    "import { vi } from 'vitest'; vi.fn()",
    "import { vi } from 'vitest'; vi.spyOn(target, 'method')",
    "import { vi } from 'vitest'; vi.useFakeTimers()",
    "jest.fn()",
    // A local `vi` that is not the framework's.
    "const vi = { mock: (path: string) => path }; vi.mock('./thing')",
    "import { vi } from './fake-vitest'; vi.mock('./thing')",
  ],
})
