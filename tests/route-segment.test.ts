import test from "node:test";
import assert from "node:assert/strict";
import { decodeRouteSegment } from "../lib/route-segment";

test("将 URL 编码的中文标签段解码为可读文本", () => {
  assert.equal(decodeRouteSegment("%E5%B7%A5%E4%BD%9C%E5%8F%B0"), "工作台");
});

test("保留未编码的普通标签段", () => {
  assert.equal(decodeRouteSegment("react"), "react");
});

test("遇到非法编码时返回原始值，避免页面直接报错", () => {
  assert.equal(decodeRouteSegment("%E0%A4%A"), "%E0%A4%A");
});
