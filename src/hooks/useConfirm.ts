"use client";

import { useState, useCallback } from "react";

type State = { message: string; resolve: (v: boolean) => void } | null;

export function useConfirm() {
  const [state, setState] = useState<State>(null);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => setState({ message, resolve }));
  }, []);

  const handleResult = useCallback((result: boolean) => {
    state?.resolve(result);
    setState(null);
  }, [state]);

  return { confirm, confirmState: state, handleResult };
}
