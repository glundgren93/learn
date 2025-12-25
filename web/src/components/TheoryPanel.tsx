import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TheoryPanelProps {
  content: string
}

export default function TheoryPanel({ content }: TheoryPanelProps) {
  return (
    <div className="h-full overflow-auto p-8 pb-16">
      <article className="prose prose-lg prose-invert max-w-none
        [&>*]:mb-6
        [&>*:first-child]:mt-0
        prose-headings:font-bold prose-headings:text-text prose-headings:tracking-tight
        prose-h1:text-2xl prose-h1:border-b prose-h1:border-surface1/50 prose-h1:pb-4 prose-h1:mb-8
        prose-h2:text-xl prose-h2:text-lavender prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-lavender/20 prose-h2:pb-3
        prose-h3:text-base prose-h3:text-teal prose-h3:mt-10 prose-h3:mb-4 prose-h3:font-bold prose-h3:border-l-2 prose-h3:border-teal prose-h3:pl-3
        prose-p:text-subtext1 prose-p:leading-[1.8] prose-p:mb-6
        prose-a:text-blue prose-a:no-underline hover:prose-a:underline prose-a:font-medium
        prose-strong:text-text prose-strong:font-semibold
        prose-em:text-subtext0 prose-em:italic
        prose-code:text-mauve prose-code:bg-surface0 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-code:font-normal
        prose-pre:bg-crust prose-pre:border prose-pre:border-surface0 prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-8
        prose-ul:text-subtext1 prose-ul:my-6 prose-ul:pl-0 prose-ul:list-none
        prose-ol:text-subtext1 prose-ol:my-6 prose-ol:pl-5
        prose-li:my-3 prose-li:leading-relaxed
        [&_ul>li]:relative [&_ul>li]:pl-6
        [&_ul>li]:before:content-['▸'] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:text-lavender/60 [&_ul>li]:before:text-sm
        prose-ol:marker:text-overlay1 prose-ol:marker:font-mono
        prose-blockquote:border-l-4 prose-blockquote:border-l-lavender prose-blockquote:bg-surface0/20 prose-blockquote:rounded-r-lg prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-8 prose-blockquote:italic
        prose-hr:border-surface1 prose-hr:my-10
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}

