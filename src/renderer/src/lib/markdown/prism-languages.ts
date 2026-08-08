import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-swift'
import 'prismjs/components/prism-sql'

// Prism doesn't auto-register language grammars — each one has to be
// imported once for its side effect (registering onto the shared `Prism`
// object) before `Prism.highlightElement()` can highlight that language.
// These are exactly the 9 components test.html loads via <script> tags,
// plus prism-sql (bundled in the prismjs package, not a separate
// dependency — see docs/decisions.md#rendering) for the SQL course.
export { Prism }
