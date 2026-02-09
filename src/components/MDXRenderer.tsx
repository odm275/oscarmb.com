"use client";

import * as runtime from "react/jsx-runtime";
import { JSX, useMemo } from "react";
import { highlight } from "sugar-high";
import Counter from "./Counter";
import Mermaid from "./Mermaid";
import {
  Table as UITable,
  TableBody as UITableBody,
  TableCaption as UITableCaption,
  TableCell as UITableCell,
  TableHead as UITableHead,
  TableHeader as UITableHeader,
  TableRow as UITableRow,
} from "./ui/table";
import { cn } from "@/lib/utils";

function Code({ children, className, ...props }: JSX.IntrinsicElements["code"]) {
  const classNameStr = className ?? "";

  // Handle Mermaid diagrams
  if (classNameStr.includes("language-mermaid")) {
    return <Mermaid chart={String(children).trim()} />;
  }

  // Handle inline code vs code blocks
  const isInlineCode = !classNameStr.includes("language-");
  if (isInlineCode) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // Highlight code blocks
  const codeHTML = highlight(String(children));
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

function Table(props: JSX.IntrinsicElements["table"]) {
  const { className, ...rest } = props;
  return (
    <div className="my-8">
      <UITable
        className={cn(
          "w-full text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3",
          className,
        )}
        {...rest}
      />
    </div>
  );
}

function TableHeaderSection(props: JSX.IntrinsicElements["thead"]) {
  const { className, ...rest } = props;
  return (
    <UITableHeader
      {...rest}
      className={cn(
        "bg-muted/70 text-foreground [&_tr]:border-b [&_tr]:border-border/60",
        "[&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide",
        className,
      )}
    />
  );
}

// Custom components available in MDX
const mdxComponents = {
  code: Code,
  Counter,
  Mermaid,
  // Lowercase HTML element mappings
  table: Table,
  thead: TableHeaderSection,
  tbody: UITableBody,
  th: UITableHead,
  td: UITableCell,
  tr: UITableRow,
  // PascalCase component names for MDX usage
  Table,
  TableHeader: TableHeaderSection,
  TableBody: UITableBody,
  TableHead: UITableHead,
  TableRow: UITableRow,
  TableCell: UITableCell,
  TableCaption: UITableCaption,
};

// Create MDX component from Velite-compiled code
function useMDXComponent(code: string) {
  return useMemo(() => {
    const fn = new Function(code);
    return fn({ ...runtime }).default;
  }, [code]);
}

interface MDXRendererProps {
  code: string;
  components?: Record<string, React.ComponentType<unknown>>;
}

/* eslint-disable react-hooks/static-components -- Component is memoized via useMemo in useMDXComponent */
export function MDXRenderer({ code, components = {} }: MDXRendererProps) {
  const Component = useMDXComponent(code);
  return <Component components={{ ...mdxComponents, ...components }} />;
}
/* eslint-enable react-hooks/static-components */
