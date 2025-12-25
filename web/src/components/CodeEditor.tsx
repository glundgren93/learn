import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  readOnly?: boolean
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'typescript',
  readOnly = false 
}: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={(v) => onChange(v || '')}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
      }}
      beforeMount={(monaco) => {
        // Catppuccin Mocha theme
        monaco.editor.defineTheme('catppuccin-mocha', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'cba6f7' },
            { token: 'string', foreground: 'a6e3a1' },
            { token: 'number', foreground: 'fab387' },
            { token: 'type', foreground: 'f9e2af' },
            { token: 'function', foreground: '89b4fa' },
            { token: 'variable', foreground: 'cdd6f4' },
            { token: 'operator', foreground: '89dceb' },
          ],
          colors: {
            'editor.background': '#1e1e2e',
            'editor.foreground': '#cdd6f4',
            'editor.lineHighlightBackground': '#313244',
            'editor.selectionBackground': '#585b7066',
            'editorCursor.foreground': '#f5e0dc',
            'editorLineNumber.foreground': '#6c7086',
            'editorLineNumber.activeForeground': '#cdd6f4',
            'editor.inactiveSelectionBackground': '#45475a55',
          },
        })
      }}
      onMount={(editor, monaco) => {
        monaco.editor.setTheme('catppuccin-mocha')
      }}
    />
  )
}

