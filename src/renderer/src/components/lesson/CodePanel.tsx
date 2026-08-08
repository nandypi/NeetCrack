import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import CodeTabs from './CodeTabs'
import type { CodeSample } from '@shared/domain'

// code.json's full per-language source, separate from the article's own
// inline ::tabs-start code blocks (see docs/data-model.md §3: code.json is
// the sole source of truth for lesson source code).
function CodePanel({ code }: { code: CodeSample[] }): React.JSX.Element | null {
  if (code.length === 0) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Code</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Code</DialogTitle>
        </DialogHeader>
        <CodeTabs code={code} />
      </DialogContent>
    </Dialog>
  )
}

export default CodePanel
