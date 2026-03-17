import test from "node:test";
import assert from "node:assert/strict";
import { getThemeToggleViewState } from "../components/shared/theme-toggle-state";

test("未挂载时不展示具体主题图标", () => {
  const state = getThemeToggleViewState({
    mounted: false,
    resolvedTheme: "dark"
  });

  assert.equal(state.icon, null);
  assert.equal(state.ariaLabel, "切换主题");
});

test("挂载后根据深色主题展示太阳图标并切换到浅色", () => {
  const state = getThemeToggleViewState({
    mounted: true,
    resolvedTheme: "dark"
  });

  assert.equal(state.icon, "sun");
  assert.equal(state.nextTheme, "light");
  assert.equal(state.ariaLabel, "切换到浅色主题");
});

test("挂载后根据浅色主题展示月亮图标并切换到深色", () => {
  const state = getThemeToggleViewState({
    mounted: true,
    resolvedTheme: "light"
  });

  assert.equal(state.icon, "moon");
  assert.equal(state.nextTheme, "dark");
  assert.equal(state.ariaLabel, "切换到深色主题");
});
