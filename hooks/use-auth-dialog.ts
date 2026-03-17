"use client";

import { useState } from "react";

interface AuthDialogState {
  open: boolean;
  title: string;
  description: string;
}

const defaultState: AuthDialogState = {
  open: false,
  title: "需要登录后继续",
  description: "当前操作需要登录身份。你可以留在当前页面，或前往登录/注册后继续。"
};

export function useAuthDialog() {
  const [state, setState] = useState<AuthDialogState>(defaultState);

  function showAuthDialog(input?: Partial<Omit<AuthDialogState, "open">>) {
    setState({
      open: true,
      title: input?.title || defaultState.title,
      description: input?.description || defaultState.description
    });
  }

  function closeAuthDialog() {
    setState((prev) => ({ ...prev, open: false }));
  }

  function goToLogin() {
    const from = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/login?from=${encodeURIComponent(from)}`);
  }

  return {
    authDialog: state,
    showAuthDialog,
    closeAuthDialog,
    goToLogin
  };
}
