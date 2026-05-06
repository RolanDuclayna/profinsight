import { useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { ProfessorInfo } from '../content/mockData';
import type {
  ProfessorAiSummaryState,
  SavedScheduleItem,
} from '../shared/schedule';

import {
  PROFESSOR_SUMMARY_STORAGE_KEY,
  SCHEDULE_STORAGE_KEY,
  AI_SUMMARY_STORAGE_KEY,
} from '../shared/schedule';

type ClassRowDetails = {
  course: string;
  crn: string;
  section: string;
  daysTime: string;
  room: string;
  meetingDates: string;
};

type HoverCardProps = {
  professor: ProfessorInfo;
  classDetails: ClassRowDetails;
  x: number;
  y: number;
  onMouseEnter: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onMouseLeave: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onClose: () => void;
};

function formatScore(score: number | null): string {
  if (score === null) {
    return '-/5';
  }

  return `${score}/5`;
}

function isFallbackProfessor(professor: ProfessorInfo): boolean {
  return professor.rating === null || professor.difficulty === null;
}

export default function HoverCard(props: HoverCardProps) {
  const [showCompare, setShowCompare] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [professorSummary, setProfessorSummary] = useState('');
  const [professorSummaryStatus, setProfessorSummaryStatus] = useState<
    'idle' | 'loading' | 'done' | 'error'
  >('idle');

  function keepCardInsideViewport(): void {
    window.requestAnimationFrame(() => {
      const card = document.getElementById('profinsight-hover-card');

      if (card === null) {
        return;
      }

      const spacing = 8;
      const rect = card.getBoundingClientRect();

      let nextLeft = rect.left;
      let nextTop = rect.top;

      if (rect.right > window.innerWidth - spacing) {
        nextLeft = rect.left - (rect.right - window.innerWidth) - spacing;
      }

      if (nextLeft < spacing) {
        nextLeft = spacing;
      }

      if (rect.bottom > window.innerHeight - spacing) {
        nextTop = rect.top - (rect.bottom - window.innerHeight) - spacing;
      }

      if (nextTop < spacing) {
        nextTop = spacing;
      }

      card.style.left = `${nextLeft}px`;
      card.style.top = `${nextTop}px`;
    });
  }

  useEffect(() => {
    keepCardInsideViewport();
  }, [
    props.x,
    props.y,
    professorSummary,
    professorSummaryStatus,
    savedMessage,
    showCompare,
  ]);

  function getProfessorSummaryKey(): string {
    return `${props.professor.name}-${props.professor.reviewUrl}`.toLowerCase();
  }

  function saveProfessorSummaryState(nextState: ProfessorAiSummaryState): void {
    const summaryKey = getProfessorSummaryKey();

    chrome.storage.local.get([PROFESSOR_SUMMARY_STORAGE_KEY], (result) => {
      const summaries = result[PROFESSOR_SUMMARY_STORAGE_KEY] as
        | Record<string, ProfessorAiSummaryState>
        | undefined;

      const nextSummaries = {
        ...(summaries ?? {}),
        [summaryKey]: nextState,
      };

      chrome.storage.local.set({
        [PROFESSOR_SUMMARY_STORAGE_KEY]: nextSummaries,
      });
    });
  }

  useEffect(() => {
    const summaryKey = getProfessorSummaryKey();

    chrome.storage.local.get([PROFESSOR_SUMMARY_STORAGE_KEY], (result) => {
      const summaries = result[PROFESSOR_SUMMARY_STORAGE_KEY] as
        | Record<string, ProfessorAiSummaryState>
        | undefined;

      const savedSummary = summaries?.[summaryKey];

      if (savedSummary === undefined) {
        return;
      }

      setProfessorSummary(savedSummary.summary);

      if (savedSummary.status === 'loading') {
        setProfessorSummaryStatus('loading');
        return;
      }

      if (savedSummary.status === 'done') {
        setProfessorSummaryStatus('done');
        return;
      }

      if (savedSummary.status === 'error') {
        setProfessorSummaryStatus('error');
      }
    });
  }, [props.professor.name, props.professor.reviewUrl]);

  async function generateProfessorSummary(): Promise<void> {
    if (props.professor.reviewUrl.length === 0) {
      const errorMessage = 'No RMP page is available for this professor.';

      setProfessorSummary(errorMessage);
      setProfessorSummaryStatus('error');

      saveProfessorSummaryState({
        status: 'error',
        summary: errorMessage,
      });

      return;
    }

    setProfessorSummary('Generating professor summary...');
    setProfessorSummaryStatus('loading');

    saveProfessorSummaryState({
      status: 'loading',
      summary: 'Generating professor summary...',
    });

    try {
      const response = await fetch(
        'http://localhost:8787/api/professor-summary',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            professorName: props.professor.name,
            course: props.classDetails.course,
            rating: props.professor.rating,
            difficulty: props.professor.difficulty,
            reviewUrl: props.professor.reviewUrl,
          }),
        },
      );

      if (!response.ok) {
        const errorMessage =
          'Professor summary is unavailable. Make sure the local API and Ollama are running.';

        setProfessorSummary(errorMessage);
        setProfessorSummaryStatus('error');

        saveProfessorSummaryState({
          status: 'error',
          summary: errorMessage,
        });

        return;
      }

      const data = (await response.json()) as {
        summary?: string;
        commentsFound?: number;
      };

      const nextSummary = data.summary ?? 'No professor summary was generated.';

      setProfessorSummary(nextSummary);
      setProfessorSummaryStatus('done');

      saveProfessorSummaryState({
        status: 'done',
        summary: nextSummary,
      });
    } catch {
      const errorMessage =
        'Professor summary is unavailable. Make sure the local API and Ollama are running.';

      setProfessorSummary(errorMessage);
      setProfessorSummaryStatus('error');

      saveProfessorSummaryState({
        status: 'error',
        summary: errorMessage,
      });
    }
  }

  function handleAddToSchedule(): void {
    const scheduleItem: SavedScheduleItem = {
      id: `${props.classDetails.course}-${props.classDetails.section}-${props.professor.name}`.toLowerCase(),
      professorName: props.professor.name,
      course: props.classDetails.course,
      crn: props.classDetails.crn,
      section: props.classDetails.section,
      daysTime: props.classDetails.daysTime,
      room: props.classDetails.room,
      meetingDates: props.classDetails.meetingDates,
      rating: props.professor.rating,
      difficulty: props.professor.difficulty,
      reviewUrl: props.professor.reviewUrl,
      source: 'cpp-class-search',
    };

    chrome.storage.local.get([SCHEDULE_STORAGE_KEY], (result) => {
      const existing = result[SCHEDULE_STORAGE_KEY] as
        | SavedScheduleItem[]
        | undefined;
      const existingSchedule = existing ?? [];

      const alreadyExists = existingSchedule.some((item) => {
        return item.id === scheduleItem.id;
      });

      if (alreadyExists) {
        setSavedMessage('Already in schedule');
        return;
      }

      const updatedSchedule = [...existingSchedule, scheduleItem];

      chrome.storage.local.set(
        {
          [SCHEDULE_STORAGE_KEY]: updatedSchedule,
        },
        () => {
          chrome.storage.local.remove(AI_SUMMARY_STORAGE_KEY, () => {
            setSavedMessage('Added to schedule');
          });
        },
      );
    });
  }

  return (
    <div
      id='profinsight-hover-card'
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      style={{
        position: 'fixed',
        left: `${props.x}px`,
        top: `${props.y}px`,
        zIndex: '2147483647',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: '400px',
          background: '#ffffff',
          color: '#111827',
          border: '2px solid #111827',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>
              {props.professor.name}
            </h3>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: '#6b7280',
              }}
            >
              {props.classDetails.course}
              {props.classDetails.daysTime.length > 0
                ? ` • ${props.classDetails.daysTime}`
                : ''}
            </p>
          </div>

          <button
            onClick={props.onClose}
            style={{
              border: '1px solid #d1d5db',
              background: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: '4px 0' }}>
          Rating: {formatScore(props.professor.rating)}
        </p>
        <p style={{ margin: '4px 0' }}>
          Difficulty: {formatScore(props.professor.difficulty)}
        </p>
        <p style={{ margin: '10px 0', fontSize: '14px' }}>
          {props.professor.summary}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '14px',
          }}
        >
          {props.professor.reviewUrl ? (
            <a
              href={props.professor.reviewUrl}
              target='_blank'
              rel='noreferrer'
              style={{
                display: 'inline-block',
                background: '#2563eb',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              {isFallbackProfessor(props.professor)
                ? 'Search on RateMyProfessors'
                : 'Read reviews'}
            </a>
          ) : (
            <button
              type='button'
              disabled
              style={{
                display: 'inline-block',
                background: '#9ca3af',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                cursor: 'not-allowed',
                opacity: 0.7,
              }}
            >
              Read reviews
            </button>
          )}

          <button
            onClick={handleAddToSchedule}
            style={{
              border: '1px solid #111827',
              background: '#ffffff',
              color: '#111827',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '8px 12px',
              fontSize: '14px',
            }}
          >
            Add to Schedule
          </button>

          <button
            type='button'
            disabled={professorSummaryStatus === 'loading'}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void generateProfessorSummary();
            }}
            style={{
              border: '1px solid #7c3aed',
              background:
                professorSummaryStatus === 'loading' ? '#9ca3af' : '#7c3aed',
              color: '#ffffff',
              borderRadius: '8px',
              cursor:
                professorSummaryStatus === 'loading' ? 'default' : 'pointer',
              padding: '8px 12px',
              fontSize: '14px',
            }}
          >
            {professorSummaryStatus === 'loading'
              ? 'Summarizing...'
              : 'AI Professor Summary'}
          </button>

          {/* <button
            onMouseEnter={() => {
              setShowCompare(true);
            }}
            onClick={() => {
              setShowCompare((prev) => !prev);
            }}
            style={{
              border: '1px solid #111827',
              background: '#f9fafb',
              color: '#111827',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '8px 12px',
              fontSize: '14px',
            }}
          >
            Compare
          </button> */}
        </div>

        {savedMessage ? (
          <p
            style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#16a34a',
            }}
          >
            {savedMessage}
          </p>
        ) : null}

        {professorSummary ? (
          <div
            style={{
              marginTop: '10px',
              padding: '8px',
              border: '1px solid #ddd6fe',
              borderRadius: '8px',
              background: '#f5f3ff',
              color: '#111827',
              fontSize: '12px',
              maxHeight: '140px',
              overflowY: 'auto',
            }}
          >
            <strong>AI Professor Summary</strong>
            <p
              style={{
                margin: '6px 0 0 0',
                whiteSpace: 'pre-wrap',
              }}
            >
              {professorSummary}
            </p>
          </div>
        ) : null}
      </div>

      {showCompare ? (
        <div
          onMouseEnter={() => {
            setShowCompare(true);
          }}
          style={{
            width: '260px',
            background: '#ffffff',
            color: '#111827',
            border: '2px solid #111827',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
            Compare alternatives
          </h4>

          {props.professor.compareOptions.map((option) => {
            return (
              <div
                key={option.name}
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  padding: '10px',
                  marginBottom: '10px',
                  background: '#f9fafb',
                }}
              >
                <p style={{ margin: '0 0 6px 0', fontWeight: 700 }}>
                  {option.name}
                </p>
                <p style={{ margin: '2px 0', fontSize: '13px' }}>
                  Rating: {formatScore(option.rating)}
                </p>
                <p style={{ margin: '2px 0', fontSize: '13px' }}>
                  Difficulty: {formatScore(option.difficulty)}
                </p>
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: '#4b5563',
                  }}
                >
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
