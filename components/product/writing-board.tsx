"use client";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import "./writing-board.css";

export type Point = [number, number];
export type Stroke = Point[];

export function WritingBoard({
  strokes,
  onChange,
  text,
  onText,
  handwritingOnly = false,
  disabled = false,
}: {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
  text?: string;
  onText?: (text: string) => void;
  handwritingOnly?: boolean;
  disabled?: boolean;
}) {
  const drawing = useRef(false);
  const pointer = useRef<number | null>(null);
  function point(event: ReactPointerEvent<SVGSVGElement>): Point {
    if (handwritingOnly) {
      const position = event.currentTarget.createSVGPoint();
      position.x = event.clientX; position.y = event.clientY;
      const transformed = position.matrixTransform(event.currentTarget.getScreenCTM()!.inverse());
      return [Math.round(Math.max(0, Math.min(1000, transformed.x))), Math.round(Math.max(0, Math.min(450, transformed.y)))];
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const coordinates: Point = [
      Math.max(
        0,
        Math.min(1000, ((event.clientX - rect.left) / rect.width) * 1000),
      ),
      Math.max(
        0,
        Math.min(450, ((event.clientY - rect.top) / rect.height) * 450),
      ),
    ];
    return coordinates;
  }
  return (
    <>
      {/* Drawing uses a pointing device; its controls below are native buttons. */}
      <svg
        className={`kpd-writing${handwritingOnly ? ' is-handwriting' : ''}`}
        viewBox="0 0 1000 450"
        aria-disabled={disabled || undefined}
        aria-label={handwritingOnly ? "Schrijfvlak voor muis, vinger of pen" : "Schrijfvlak voor vinger of pen; gebruik het tekstveld als alternatief"}
        onPointerDown={(event) => {
          if (disabled || event.button !== 0 || (handwritingOnly && (!event.isPrimary || pointer.current !== null))) return;
          pointer.current = event.pointerId;
          drawing.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          onChange([...strokes, [point(event)]]);
        }}
        onPointerMove={(event) => {
          if (disabled || !drawing.current || (handwritingOnly && event.pointerId !== pointer.current)) return;
          onChange([
            ...strokes.slice(0, -1),
            [...(strokes.at(-1) ?? []), point(event)],
          ]);
        }}
        onPointerUp={(event) => {
          if (handwritingOnly && event.pointerId !== pointer.current) return;
          pointer.current = null;
          drawing.current = false;
        }}
        onPointerCancel={(event) => {
          if (handwritingOnly && event.pointerId !== pointer.current) return;
          pointer.current = null;
          drawing.current = false;
        }}
      >
        {strokes.map((stroke, i) => (
          <polyline
            key={i}
            points={stroke.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={handwritingOnly ? 2 : 5}
            vectorEffect={handwritingOnly ? "non-scaling-stroke" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className={handwritingOnly ? "cp-task-actions" : "kpd-actions"}>
        <button
          className="secondary-button"
          aria-label={handwritingOnly ? "Laatste lijn weg" : undefined}
          onClick={() => onChange(strokes.slice(0, -1))}
          disabled={disabled || !strokes.length}
        >
          <Undo2 />
          {handwritingOnly ? "Lijn terug" : "Laatste lijn weg"}
        </button>
        <button
          className="secondary-button"
          aria-label={handwritingOnly ? "Wis bord" : undefined}
          disabled={disabled}
          onClick={() => {
            onChange([]);
            onText?.("");
          }}
        >
          <RotateCcw />
          {handwritingOnly ? "Wis" : "Wis bord"}
        </button>
      </div>
      {!handwritingOnly && <label className="kpd-type">
        Of typ op het bord
        <input
          value={text}
          onChange={(e) => onText?.(e.target.value)}
          disabled={disabled}
          maxLength={80}
        />
      </label>}
    </>
  );
}

