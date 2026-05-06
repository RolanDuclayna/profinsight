import { useEffect, useState } from 'react';
import type { SavedScheduleItem } from '../shared/schedule';
import { SCHEDULE_STORAGE_KEY } from '../shared/schedule';
import { AI_SUMMARY_STORAGE_KEY } from '../shared/schedule';
import { AI_SUMMARY_LOADING_KEY } from '../shared/schedule';

export function Popup() {
  const [savedClasses, setSavedClasses] = useState<SavedScheduleItem[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [dprSummary, setDprSummary] = useState('');
  const [isAnalyzingDpr, setIsAnalyzingDpr] = useState(false);

  function loadClasses() {
    chrome.storage.local.get(
      [SCHEDULE_STORAGE_KEY, AI_SUMMARY_STORAGE_KEY, AI_SUMMARY_LOADING_KEY],
      (result) => {
        const storedClasses = result[SCHEDULE_STORAGE_KEY] as
          | SavedScheduleItem[]
          | undefined;
        const storedSummary = result[AI_SUMMARY_STORAGE_KEY] as
          | string
          | undefined;
        const storedLoading = result[AI_SUMMARY_LOADING_KEY] as
          | boolean
          | undefined;

        setSavedClasses(storedClasses ?? []);
        setAiSummary(storedSummary ?? '');
        setIsSummarizing(storedLoading ?? false);
      },
    );
  }

  async function generateAiSummary() {
    if (savedClasses.length === 0) {
      alert('Add classes to your schedule first.');
      return;
    }

    setIsSummarizing(true);
    setAiSummary('');

    chrome.storage.local.set({
      [AI_SUMMARY_STORAGE_KEY]: '',
      [AI_SUMMARY_LOADING_KEY]: true,
    });

    try {
      const response = await fetch(
        'http://localhost:8787/api/schedule-summary',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            classes: savedClasses,
          }),
        },
      );

      if (!response.ok) {
        const errorSummary =
          'AI summary is unavailable. Make sure the local API and Ollama are running.';

        setAiSummary(errorSummary);

        chrome.storage.local.set({
          [AI_SUMMARY_STORAGE_KEY]: errorSummary,
          [AI_SUMMARY_LOADING_KEY]: false,
        });

        return;
      }

      const data = (await response.json()) as {
        summary?: string;
      };

      const nextSummary = data.summary ?? 'No summary was generated.';

      setAiSummary(nextSummary);

      chrome.storage.local.set({
        [AI_SUMMARY_STORAGE_KEY]: nextSummary,
        [AI_SUMMARY_LOADING_KEY]: false,
      });
    } catch {
      const errorSummary =
        'AI summary is unavailable. Make sure the local API and Ollama are running.';

      setAiSummary(errorSummary);

      chrome.storage.local.set({
        [AI_SUMMARY_STORAGE_KEY]: errorSummary,
        [AI_SUMMARY_LOADING_KEY]: false,
      });
    } finally {
      setIsSummarizing(false);
    }
  }

  async function analyzeDprFile(file: File): Promise<void> {
    setIsAnalyzingDpr(true);
    setDprSummary('');

    const formData = new FormData();

    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8787/api/dpr-summary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        setDprSummary(
          'DPR analysis failed. Make sure the local API and Ollama are running.',
        );
        return;
      }

      const data = (await response.json()) as {
        summary?: string;
      };

      setDprSummary(data.summary ?? 'No DPR summary was generated.');
    } catch {
      setDprSummary(
        'DPR analysis failed. Make sure the local API and Ollama are running.',
      );
    } finally {
      setIsAnalyzingDpr(false);
    }
  }

  function copySchedule() {
    const scheduleText = savedClasses
      .map((savedClass) => {
        const ratingText =
          savedClass.rating !== null ? ` (${savedClass.rating})` : '';

        const lines = [
          `${savedClass.course}`,
          savedClass.crn.length > 0
            ? `CRN: ${savedClass.crn}`
            : 'CRN: Not saved',
          savedClass.daysTime.length > 0
            ? `Time: ${savedClass.daysTime}`
            : 'Time: Not saved',
          `Professor: ${savedClass.professorName}${ratingText}`,
          savedClass.reviewUrl.length > 0 ? `RMP: ${savedClass.reviewUrl}` : '',
          savedClass.room.length > 0 ? `Room: ${savedClass.room}` : '',
        ];

        return lines
          .filter((line) => {
            return line.length > 0;
          })
          .join('\n');
      })
      .join('\n\n');

    void navigator.clipboard.writeText(scheduleText);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  function saveClasses(nextClasses: SavedScheduleItem[]) {
    chrome.storage.local.set(
      {
        [SCHEDULE_STORAGE_KEY]: nextClasses,
      },
      () => {
        chrome.storage.local.remove(AI_SUMMARY_STORAGE_KEY, () => {
          setSavedClasses(nextClasses);
          setAiSummary('');
        });
      },
    );
  }

  function removeClass(classId: string) {
    const nextClasses = savedClasses.filter((savedClass) => {
      return savedClass.id !== classId;
    });

    saveClasses(nextClasses);
  }

  function clearAllClasses() {
    saveClasses([]);
  }

  return (
    <main className='popup-page'>
      <h1>ProfessorInsight</h1>

      <section>
        <h2>Saved Schedule</h2>

        <section className='dpr-section'>
          <h2>DPR Helper</h2>

          <p className='helper-text'>
            Upload a Degree Progress Report PDF to estimate remaining
            requirements.
          </p>

          <label className='dpr-upload-label' htmlFor='dpr-upload'>
            Upload DPR PDF
          </label>

          <input
            id='dpr-upload'
            className='dpr-file-input'
            type='file'
            accept='application/pdf'
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file === undefined) {
                return;
              }

              void analyzeDprFile(file);

              event.target.value = '';
            }}
          />

          {isAnalyzingDpr ? (
            <p className='helper-text'>Analyzing DPR...</p>
          ) : null}

          {dprSummary.length > 0 ? (
            <div className='ai-summary-box'>
              <strong>DPR Summary</strong>
              <p>{dprSummary}</p>
            </div>
          ) : null}
        </section>

        {savedClasses.length === 0 ? (
          <p>No classes added yet.</p>
        ) : (
          <>
            <button
              className='clear-button'
              onClick={() => {
                clearAllClasses();
              }}
            >
              Clear All
            </button>

            <button
              className='copy-button'
              onClick={() => {
                copySchedule();
              }}
            >
              Copy Schedule
            </button>

            <button
              className='ai-button'
              onClick={() => {
                void generateAiSummary();
              }}
            >
              {isSummarizing ? 'Summarizing...' : 'AI Summary'}
            </button>

            {aiSummary.length > 0 ? (
              <div className='ai-summary-box'>
                <strong>AI Summary</strong>
                <p>{aiSummary}</p>
              </div>
            ) : null}

            <div className='class-list'>
              {savedClasses.map((savedClass) => {
                return (
                  <div key={savedClass.id} className='class-card'>
                    <div className='class-main-row'>
                      <strong className='class-code'>
                        {savedClass.course}
                      </strong>

                      {savedClass.crn.length > 0 ? (
                        <p className='class-crn'>CRN: {savedClass.crn}</p>
                      ) : (
                        <p className='class-crn'>CRN not saved</p>
                      )}

                      <button
                        className='remove-button'
                        onClick={() => {
                          removeClass(savedClass.id);
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    {savedClass.daysTime.length > 0 ? (
                      <p className='class-time'>{savedClass.daysTime}</p>
                    ) : (
                      <p className='class-time'>Time not saved</p>
                    )}

                    {savedClass.reviewUrl.length > 0 ? (
                      <a
                        className='professor-link'
                        href={savedClass.reviewUrl}
                        target='_blank'
                        rel='noreferrer'
                      >
                        {savedClass.professorName}
                        {savedClass.rating !== null
                          ? ` (${savedClass.rating})`
                          : ''}
                      </a>
                    ) : (
                      <p className='professor-link'>
                        {savedClass.professorName}
                        {savedClass.rating !== null
                          ? ` (${savedClass.rating})`
                          : ''}
                      </p>
                    )}

                    {savedClass.room.length > 0 ? (
                      <p className='class-room'>{savedClass.room}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
