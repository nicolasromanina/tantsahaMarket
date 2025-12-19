import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

type Props = {
  content: string;
  className?: string;
};

export const MarkdownMessage = ({
          content,
          isUser,
        }: {
          content: string;
          isUser?: boolean;
        }) => {
          return (
            <div
              className={cn(
                'prose prose-sm max-w-none',
                'prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
                'prose-li:my-0',
                'prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded',
                'prose-pre:bg-gray-900 prose-pre:text-gray-100',
                isUser && 'prose-invert'
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {content}
              </ReactMarkdown>
            </div>
          );
        };

