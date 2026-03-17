import React from "react";
import { useContext, useMemo } from "react";
import { ContextGlobal } from "@/contexts/global.context";

export type CategoryTreeNode = {
  id: string | number;
  nombre: string;
  subcategorias?: string[];
};

type GlobalContextState = {
  categoryTree?: unknown;
  categorys?: unknown;
};

type GlobalContextValue = {
  state?: GlobalContextState;
} | null;

export function buildCategoryHref(name: string): string {
  return `/products/category/${encodeURIComponent(name)}`;
}

export function useCategoriesNavigation() {
  // ContextGlobal está definido en JS; tipamos localmente para evitar `never` en TS.
  const ctx = useContext(ContextGlobal as unknown as React.Context<GlobalContextValue>);

  const categoryTree = useMemo(() => {
    const tree = ctx?.state?.categoryTree;
    return Array.isArray(tree) ? (tree as CategoryTreeNode[]) : [];
  }, [ctx?.state?.categoryTree]);

  const categorys = useMemo(() => {
    const flat = ctx?.state?.categorys;
    return Array.isArray(flat) ? (flat as string[]) : [];
  }, [ctx?.state?.categorys]);

  const useTree = categoryTree.length > 0;

  return { categoryTree, categorys, useTree };
}

