import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function MarkdownRenderer({ content }) {
  if (!content) {
    return <div className="empty-state">No content available.</div>;
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          },
          ul: ({ node, ...props }) => <ul className="bullet-list" {...props} />,
          ol: ({ node, ...props }) => <ol className="numbered-list" {...props} />,
          h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
          h4: ({ node, ...props }) => <h4 className="markdown-h4" {...props} />,
          h5: ({ node, ...props }) => <h5 className="markdown-h5" {...props} />,
          h6: ({ node, ...props }) => <h6 className="markdown-h6" {...props} />,
          p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
          a: ({ node, ...props }) => (
            <a className="markdown-link" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="markdown-blockquote" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img className="markdown-img" alt="" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}