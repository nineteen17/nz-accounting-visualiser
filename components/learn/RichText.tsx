"use client";

import { Fragment, type ReactNode } from "react";
import { Term } from "./Term";

/** Inline markup: [[key]] / [[key|label]] glossary links, **bold**, *italic* */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyPrefix}-${i++}`;
    if (m[1]) out.push(<Term key={k} k={m[1]}>{m[2] ?? undefined}</Term>);
    else if (m[3]) out.push(<strong key={k}>{m[3]}</strong>);
    else if (m[4]) out.push(<em key={k}>{m[4]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Paragraphs separated by blank lines; lines starting with • become a list */
export function RichText({ text, inlineOnly }: { text: string; inlineOnly?: boolean }) {
  if (inlineOnly) return <>{inline(text, "i")}</>;
  const paras = text.split(/\n\n+/);
  return (
    <>
      {paras.map((p, pi) => {
        const lines = p.split("\n");
        if (lines.every((l) => l.trim().startsWith("•"))) {
          return (
            <ul key={pi}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*•\s*/, ""), `${pi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={pi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, `${pi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
