import React, { lazy, Suspense } from "react";
import { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

const fallback = <div style={{ background: "#ddd", width: 24, height: 24 }} />;

// Cache lazy components so they aren't recreated on every render
const iconCache = new Map<string, React.LazyExoticComponent<React.ComponentType<LucideProps>>>();

function getLazyIcon(name: keyof typeof dynamicIconImports) {
  if (!iconCache.has(name)) {
    iconCache.set(name, lazy(dynamicIconImports[name]));
  }
  return iconCache.get(name)!;
}

interface IconProps extends Omit<LucideProps, "ref"> {
  name: keyof typeof dynamicIconImports;
}

/* eslint-disable react-hooks/static-components -- lazy components are cached via getLazyIcon */
const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = getLazyIcon(name);

  return (
    <Suspense fallback={fallback}>
      <LucideIcon {...props} />
    </Suspense>
  );
};
/* eslint-enable react-hooks/static-components */

export default Icon;
