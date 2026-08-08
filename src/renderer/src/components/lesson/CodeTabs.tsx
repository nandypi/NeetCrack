import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import CodeBlock from './CodeBlock'
import type { CodeSample } from '@shared/domain'

// Language-tabbed viewer over a CodeSample[] — shared by CodePanel's "View
// Code" dialog (code.json) and the problem lesson's Solution tab
// (problem.json's solutions), so both stay in sync without duplicating the
// tab-switching logic.
function CodeTabs({ code }: { code: CodeSample[] }): React.JSX.Element | null {
  if (code.length === 0) return null

  return (
    <Tabs defaultValue={code[0].language}>
      <TabsList>
        {code.map((sample) => (
          <TabsTrigger key={sample.language} value={sample.language}>
            {sample.language}
          </TabsTrigger>
        ))}
      </TabsList>
      {code.map((sample) => (
        <TabsContent key={sample.language} value={sample.language}>
          <CodeBlock sample={sample} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default CodeTabs
