import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vitest"

RuleTester.describe = describe
RuleTester.it = it

export const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } })

// For cases holding JSX. `tsx` cannot parse `<Type>value` assertions, so it is not the default.
export const tsxRuleTester = new RuleTester({ languageOptions: { parserOptions: { lang: "tsx" } } })
