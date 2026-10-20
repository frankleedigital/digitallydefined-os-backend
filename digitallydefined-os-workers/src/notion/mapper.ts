/**
 * src/notion/mapper.ts — Notion ↔ internal data mapping helpers.
 *
 * Normalizes Notion API responses into view-friendly records and converts
 * internal records into Notion property payloads. Mirrors the dashboard's
 * lib/notionArchitect.js contract.
 */

import type { NotionPageRef, NotionDatabaseRef } from "../types.js";

/** Read a title property from a Notion page. */
export function readTitle(props: unknown, name: string): string {
  const p = (props as Record<string, unknown>)[name];
  const list = (p as { title?: Array<{ plain_text?: string }> })?.title;
  if (!Array.isArray(list) || !list[0]) return "";
  return String(list[0].plain_text ?? "").trim();
}

/** Read a rich_text property. */
export function readRichText(props: unknown, name: string): string {
  const p = (props as Record<string, unknown>)[name];
  const list = (p as { rich_text?: Array<{ plain_text?: string }> })?.rich_text;
  if (!Array.isArray(list) || !list[0]) return "";
  return String(list[0].plain_text ?? "").trim();
}

/** Read a select property name. */
export function readSelect(props: unknown, name: string): string {
  const p = (props as Record<string, unknown>)[name];
  const sel = (p as { select?: { name?: string } })?.select;
  return sel ? String(sel.name).trim() : "";
}

/** Read a url property. */
export function readUrl(props: unknown, name: string): string {
  const p = (props as Record<string, unknown>)[name];
  return p ? String(p).trim() : "";
}

/** Read a number property. */
export function readNumber(props: unknown, name: string): number | null {
  const p = (props as Record<string, unknown>)[name];
  return typeof p === "number" ? p : null;
}

/** Read a date property start. */
export function readDate(props: unknown, name: string): string | null {
  const p = (props as Record<string, unknown>)[name];
  const d = (p as { date?: { start?: string } })?.date;
  return d?.start ? String(d.start).trim() : null;
}

/**
 * Map a Notion page object into a generic view row with common fields plus
 * dbKey-specific extensions.
 */
export function mapNotionPageToView(dbKey: string, page: unknown): Record<string, unknown> {
  const props = (page as { properties?: Record<string, unknown> })?.properties ?? {};
  const base: Record<string, unknown> = {
    id: (page as { id?: string }).id ?? "",
    name: readTitle(props, "Name"),
    status: readSelect(props, "Status"),
    niche: readRichText(props, "Niche"),
    url: readUrl(props, "URL"),
    created: readDate(props, "Created"),
  };

  switch (dbKey) {
    case "money":
      return {
        ...base,
        month: readDate(props, "Month"),
        revenue: readNumber(props, "Revenue"),
        expenses: readNumber(props, "Expenses"),
        net: readNumber(props, "Net"),
      };
    case "monthly":
      return {
        ...base,
        period: readDate(props, "Period"),
        wins: readRichText(props, "Wins"),
        risks: readRichText(props, "Risks"),
        nextActions: readRichText(props, "NextActions"),
      };
    case "reputation":
      return { ...base, signal: readSelect(props, "Signal"), score: readNumber(props, "Score") };
    case "content":
      return { ...base, contentType: readSelect(props, "ContentType") };
    case "templates":
      return { ...base, format: readSelect(props, "Format") };
    case "assets":
      return { ...base, assetValue: readNumber(props, "AssetValue") };
    case "ideas":
      return { ...base, source: readRichText(props, "Source") };
    case "automations":
      return { ...base, source: readRichText(props, "Source") };
    default:
      return base;
  }
}

/** Build a Notion page reference from a create-page response. */
export function toPageRef(
  pageId: string,
  title: string,
  url: string,
  databaseId?: string,
): NotionPageRef {
  return { pageId, title, databaseId, url };
}

/** Build a Notion database reference from a create-database response. */
export function toDatabaseRef(
  key: string,
  name: string,
  id: string,
  url: string,
  propertyCount: number,
): NotionDatabaseRef {
  return { key, databaseId: id, name, url, propertyCount };
}
