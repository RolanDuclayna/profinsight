import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ProfessorInfo } from "../content/mockData";

type HoverCardProps = {
  professor: ProfessorInfo;
  x: number;
  y: number;
  onMouseEnter: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onMouseLeave: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onClose: () => void;
};

type SavedScheduleItem = {
  name: string;
  course: string;
  rating: number;
  difficulty: number;
};

export default function HoverCard(props: HoverCardProps) {
  const [showCompare, setShowCompare] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  function handleAddToSchedule(): void {
    const existingRaw = localStorage.getItem("profinsight_schedule");
    const existing: SavedScheduleItem[] = existingRaw ? JSON.parse(existingRaw) : [];

    const alreadyExists = existing.some((item) => {
      return item.name === props.professor.name && item.course === props.professor.course;
    });

    if (!alreadyExists) {
      existing.push({
        name: props.professor.name,
        course: props.professor.course,
        rating: props.professor.rating,
        difficulty: props.professor.difficulty
      });

      localStorage.setItem("profinsight_schedule", JSON.stringify(existing));
      setSavedMessage("Added to schedule");
      return;
    }

    setSavedMessage("Already in schedule");
  }

  return (
    <div
      id="profinsight-hover-card"
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      style={{
        position: "fixed",
        left: `${props.x}px`,
        top: `${props.y}px`,
        zIndex: "2147483647",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        pointerEvents: "auto"
      }}
    >
      <div
        style={{
          width: "300px",
          background: "#ffffff",
          color: "#111827",
          border: "2px solid #111827",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "8px"
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "18px" }}>{props.professor.name}</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
              {props.professor.course}
            </p>
          </div>

          <button
            onClick={props.onClose}
            style={{
              border: "1px solid #d1d5db",
              background: "#ffffff",
              borderRadius: "8px",
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: "4px 0" }}>Rating: {props.professor.rating}/5</p>
        <p style={{ margin: "4px 0" }}>Difficulty: {props.professor.difficulty}/5</p>
        <p style={{ margin: "10px 0", fontSize: "14px" }}>{props.professor.summary}</p>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "14px"
          }}
        >
          {props.professor.reviewUrl ? (
  <a
    href={props.professor.reviewUrl}
    target="_blank"
    rel="noreferrer"
    style={{
      display: "inline-block",
      background: "#2563eb",
      color: "#ffffff",
      padding: "8px 12px",
      borderRadius: "8px",
      textDecoration: "none",
      fontSize: "14px"
    }}
  >
    Read reviews
  </a>
) : (
  <button
    type="button"
    disabled
    style={{
      display: "inline-block",
      background: "#9ca3af",
      color: "#ffffff",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      fontSize: "14px",
      cursor: "not-allowed",
      opacity: 0.7
    }}
  >
    Read reviews
  </button>
)}

          <button
            onClick={handleAddToSchedule}
            style={{
              border: "1px solid #111827",
              background: "#ffffff",
              color: "#111827",
              borderRadius: "8px",
              cursor: "pointer",
              padding: "8px 12px",
              fontSize: "14px"
            }}
          >
            Add to Schedule
          </button>

          <button
            onMouseEnter={() => {
              setShowCompare(true);
            }}
            onClick={() => {
              setShowCompare((prev) => !prev);
            }}
            style={{
              border: "1px solid #111827",
              background: "#f9fafb",
              color: "#111827",
              borderRadius: "8px",
              cursor: "pointer",
              padding: "8px 12px",
              fontSize: "14px"
            }}
          >
            Compare
          </button>
        </div>

        {savedMessage ? (
          <p
            style={{
              marginTop: "10px",
              fontSize: "12px",
              color: "#16a34a"
            }}
          >
            {savedMessage}
          </p>
        ) : null}
      </div>

      {showCompare ? (
        <div
          onMouseEnter={() => {
            setShowCompare(true);
          }}
          style={{
            width: "260px",
            background: "#ffffff",
            color: "#111827",
            border: "2px solid #111827",
            borderRadius: "12px",
            padding: "14px",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.25)",
            fontFamily: "Arial, sans-serif"
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
            Compare alternatives
          </h4>

          {props.professor.compareOptions.map((option) => {
            return (
              <div
                key={option.name}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "10px",
                  marginBottom: "10px",
                  background: "#f9fafb"
                }}
              >
                <p style={{ margin: "0 0 6px 0", fontWeight: 700 }}>{option.name}</p>
                <p style={{ margin: "2px 0", fontSize: "13px" }}>
                  Rating: {option.rating}/5
                </p>
                <p style={{ margin: "2px 0", fontSize: "13px" }}>
                  Difficulty: {option.difficulty}/5
                </p>
                <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#4b5563" }}>
                  {option.summary}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}