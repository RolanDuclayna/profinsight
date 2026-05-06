import type { MouseEvent as ReactMouseEvent } from 'react';
import ReactDOM from 'react-dom/client';
import HoverCard from '../components/HoverCard';
import { professorData, type ProfessorInfo } from './mockData';
import { fetchProfessorInfo } from './apiClient';
import './content.css';
import { SCHEDULE_STORAGE_KEY } from '../shared/schedule';

// const INSTRUCTOR_HEADER_TEXT = "INSTRUCTOR";
const professorInfoCache = new Map<string, ProfessorInfo | null>();

type ProfessorNameMatch = {
  displayName: string;
  searchName: string;
};

function normalizeProfessorName(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

function getSearchNameFromDisplayName(displayName: string): string {
  const cleanName = normalizeProfessorName(displayName);

  if (window.location.hostname !== 'schedule.cpp.edu') {
    return cleanName;
  }

  const commaNameMatch = cleanName.match(/^([^,]+),\s*(.+)$/);

  if (commaNameMatch === null) {
    return cleanName;
  }

  const lastName = commaNameMatch[1].trim();
  const firstName = commaNameMatch[2].trim();

  return `${firstName} ${lastName}`;
}

// function findInstructorColumnIndex(table: HTMLTableElement): number {
//   const rows = Array.from(table.querySelectorAll("tr"));

//   for (const row of rows) {
//     const cells = Array.from(row.querySelectorAll("th, td")) as HTMLElement[];

//     const index = cells.findIndex((cell) =>
//       cell.textContent?.trim().toUpperCase().includes(INSTRUCTOR_HEADER_TEXT)
//     );

//     if (index !== -1) {
//       return index;
//     }
//   }

//   return -1;
// }

function getInstructorCells(): HTMLElement[] {
  if (window.location.hostname === 'schedule.cpp.edu') {
    return getPublicScheduleInstructorCells();
  }

  return getCmsInstructorCells();
}

function getCmsInstructorCells(): HTMLElement[] {
  const cells: HTMLElement[] = [];
  const tables = Array.from(document.querySelectorAll('table'));

  for (const table of tables) {
    const tableText = table.textContent?.toUpperCase() ?? '';

    const isClassResultsTable =
      tableText.includes('CLASS') &&
      tableText.includes('SECTION') &&
      tableText.includes('DAYS') &&
      tableText.includes('INSTRUCTOR') &&
      tableText.includes('INSTRUCTION MODE');

    if (!isClassResultsTable) {
      continue;
    }

    const rows = Array.from(table.querySelectorAll('tr'));
    let instructorIndex = -1;

    for (const row of rows) {
      const headerCells = Array.from(
        row.querySelectorAll('th, td'),
      ) as HTMLElement[];

      const possibleIndex = headerCells.findIndex((cell) => {
        const text = cell.textContent?.trim().toUpperCase() ?? '';
        return text === 'INSTRUCTOR';
      });

      if (possibleIndex !== -1) {
        instructorIndex = possibleIndex;
        break;
      }
    }

    if (instructorIndex === -1) {
      continue;
    }

    for (const row of rows) {
      const rowCells = Array.from(row.querySelectorAll('td')) as HTMLElement[];
      const instructorCell = rowCells[instructorIndex];

      if (!instructorCell) {
        continue;
      }

      const text = instructorCell.textContent?.trim() ?? '';

      if (
        text &&
        text.toUpperCase() !== 'INSTRUCTOR' &&
        !text.toUpperCase().includes('INSTRUCTION MODE')
      ) {
        cells.push(instructorCell);
      }
    }
  }

  return cells;
}

function getPublicScheduleInstructorCells(): HTMLElement[] {
  const cells: HTMLElement[] = [];
  const tables = Array.from(document.querySelectorAll('table'));

  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll('tr'));

    for (const row of rows) {
      const rowCells = Array.from(
        row.querySelectorAll('th, td'),
      ) as HTMLElement[];

      for (let index = 0; index < rowCells.length; index += 1) {
        const cell = rowCells[index];
        const text = cell.textContent?.trim().toUpperCase() ?? '';

        if (text !== 'INSTRUCTOR') {
          continue;
        }

        const instructorCell = rowCells[index + 1];

        if (instructorCell === undefined) {
          continue;
        }

        const instructorText = instructorCell.textContent?.trim() ?? '';

        if (instructorText.length === 0) {
          continue;
        }

        if (/staff|tba|none|announced|to be announced/i.test(instructorText)) {
          continue;
        }

        cells.push(instructorCell);
      }
    }
  }

  return cells;
}

function extractProfessorNamesFromCell(
  cell: HTMLElement,
): ProfessorNameMatch[] {
  const rawText = cell.innerText || cell.textContent || '';

  const splitPattern =
    window.location.hostname === 'schedule.cpp.edu'
      ? /\n|;|\/|\band\b/i
      : /\n|,|;|\/|\band\b/i;

  const names = rawText
    .split(splitPattern)
    .map(normalizeProfessorName)
    .filter((name) => {
      return (
        name.length > 2 &&
        !/staff|tba|none|instructor|room|class|section|days|times|announced|to be announced/i.test(
          name,
        ) &&
        !/\d/.test(name)
      );
    })
    .map((name) => {
      return {
        displayName: name,
        searchName: getSearchNameFromDisplayName(name),
      };
    });

  const uniqueNames = new Map<string, ProfessorNameMatch>();

  for (const name of names) {
    uniqueNames.set(name.searchName.toLowerCase(), name);
  }

  return Array.from(uniqueNames.values());
}

function markProfessorName(
  element: HTMLElement,
  names: ProfessorNameMatch[],
): void {
  if (element.dataset.profinsightProcessed === 'true') {
    return;
  }

  element.dataset.profinsightProcessed = 'true';
  element.classList.add('profinsight-instructor-cell');

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (node instanceof Text && node.textContent?.trim()) {
      textNodes.push(node);
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? '';
    let matchedName: ProfessorNameMatch | null = null;

    for (const name of names) {
      if (text.includes(name.displayName)) {
        matchedName = name;
        break;
      }
    }

    if (matchedName === null) {
      continue;
    }

    const matchIndex = text.indexOf(matchedName.displayName);
    const before = text.slice(0, matchIndex);
    const after = text.slice(matchIndex + matchedName.displayName.length);

    const fragment = document.createDocumentFragment();

    if (before.length > 0) {
      fragment.appendChild(document.createTextNode(before));
    }

    const span = document.createElement('span');
    span.className = 'profinsight-name';
    span.dataset.profinsightName = matchedName.searchName;
    span.textContent = matchedName.displayName;
    fragment.appendChild(span);

    if (after.length > 0) {
      fragment.appendChild(document.createTextNode(after));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}

function scanForProfessorNames() {
  const instructorCells = getInstructorCells();

  for (const cell of instructorCells) {
    if (cell.dataset.profinsightProcessed === 'true') {
      continue;
    }
    const names = extractProfessorNamesFromCell(cell);

    if (names.length > 0) {
      markProfessorName(cell, names);
      bindHoverEvents(cell);
    }
  }
}

type ActiveCard = {
  info: ProfessorInfo;
  classDetails: ClassRowDetails;
  x: number;
  y: number;
} | null;

const rootId = 'profinsight-root';
const CARD_VISIBLE_MS = 500;

let reactRoot: ReactDOM.Root | null = null;
let hideTimer: number | null = null;
let isNameHovered = false;
let isCardHovered = false;

function ensureRoot(): HTMLElement {
  let root = document.getElementById(rootId);

  if (!root) {
    root = document.createElement('div');
    root.id = rootId;
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '2147483647';
    root.style.pointerEvents = 'none';
    document.body.appendChild(root);
  }

  return root;
}

function clearHideTimer(): void {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function startHideTimer(): void {
  clearHideTimer();

  hideTimer = window.setTimeout(() => {
    if (!isNameHovered && !isCardHovered) {
      hideCard();
    }
  }, CARD_VISIBLE_MS);
}

function hideCard(): void {
  clearHideTimer();
  isNameHovered = false;
  isCardHovered = false;

  const container = ensureRoot();

  if (!reactRoot) {
    reactRoot = ReactDOM.createRoot(container);
  }

  reactRoot.render(<></>);
}

function handleCardMouseEnter(_event: ReactMouseEvent<HTMLDivElement>): void {
  isCardHovered = true;
  clearHideTimer();
}

function handleCardMouseLeave(_event: ReactMouseEvent<HTMLDivElement>): void {
  isCardHovered = false;

  if (!isNameHovered) {
    startHideTimer();
  }
}

function renderCard(card: ActiveCard): void {
  const container = ensureRoot();

  if (!reactRoot) {
    reactRoot = ReactDOM.createRoot(container);
  }

  if (!card) {
    reactRoot.render(<></>);
    return;
  }

  reactRoot.render(
    <HoverCard
      professor={card.info}
      classDetails={card.classDetails}
      x={card.x}
      y={card.y}
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
      onClose={() => {
        hideCard();
      }}
    />,
  );
}

const RMP_SCHOOL_ID = '13914';

function createRateMyProfessorFallback(professorName: string): ProfessorInfo {
  const searchUrl = `https://www.ratemyprofessors.com/search/professors/${RMP_SCHOOL_ID}?q=${encodeURIComponent(professorName)}`;

  return {
    name: professorName,
    course: 'Not available',
    rating: null,
    difficulty: null,
    summary:
      'Professor info is not available right now. Click the button below to search for this professor on RateMyProfessors.',
    reviewUrl: searchUrl,
    compareOptions: [],
  };
}

type ClassRowDetails = {
  course: string;
  crn: string;
  section: string;
  daysTime: string;
  room: string;
  meetingDates: string;
};

function getTextByRowField(rowIndex: string, fieldName: string): string {
  const element = document.getElementById(`${fieldName}$${rowIndex}`);

  if (element === null) {
    return '';
  }

  return element.textContent?.trim() ?? '';
}

function getCourseFromPage(): string {
  const courseHeader = document.querySelector<HTMLElement>(
    '[id^="win0divSSR_CLSRSLT_WRK_GROUPBOX2GP"]',
  );

  const headerText = courseHeader?.textContent?.trim() ?? '';

  const match = headerText.match(/[A-Z]{2,5}\s*\d{4}/);

  if (match === null) {
    return 'Course not found';
  }

  return match[0].replace(/\s+/g, ' ');
}

function getPublicScheduleTextByHeader(
  table: HTMLTableElement,
  headerName: string,
): string {
  const rows = Array.from(table.querySelectorAll('tr'));

  for (const row of rows) {
    const rowCells = Array.from(
      row.querySelectorAll('th, td'),
    ) as HTMLElement[];

    for (let index = 0; index < rowCells.length; index += 1) {
      const cell = rowCells[index];
      const text = cell.textContent?.trim().toUpperCase() ?? '';

      if (text !== headerName.toUpperCase()) {
        continue;
      }

      const valueCell = rowCells[index + 1];

      if (valueCell === undefined) {
        continue;
      }

      return valueCell.textContent?.trim().replace(/\s+/g, ' ') ?? '';
    }
  }

  return '';
}

function getPublicScheduleCourseFromNode(node: HTMLElement): string {
  const listItem = node.closest('li');

  if (listItem === null) {
    return 'Course not found';
  }

  const classTitle = listItem.querySelector<HTMLElement>('.ClassTitle');
  const titleText = classTitle?.textContent?.trim() ?? '';

  const match = titleText.match(/[A-Z]{2,5}\s*\d{4}/);

  if (match === null) {
    return 'Course not found';
  }

  return match[0].replace(/\s+/g, ' ');
}

function getClassRowDetailsFromProfessorNode(
  node: HTMLElement,
): ClassRowDetails {
  if (window.location.hostname === 'schedule.cpp.edu') {
    const table = node.closest<HTMLTableElement>('table');

    if (table === null) {
      return {
        course: getPublicScheduleCourseFromNode(node),
        crn: '',
        section: '',
        daysTime: '',
        room: '',
        meetingDates: '',
      };
    }

    return {
      course: getPublicScheduleCourseFromNode(node),
      crn: getPublicScheduleTextByHeader(table, 'Class Nbr'),
      section: getPublicScheduleTextByHeader(table, 'Section'),
      daysTime: getPublicScheduleTextByHeader(table, 'Time'),
      room: getPublicScheduleTextByHeader(table, 'Building/Room'),
      meetingDates: getPublicScheduleTextByHeader(table, 'Date'),
    };
  }

  const instructorContainer = node.closest<HTMLElement>(
    '[id^="win0divMTG_INSTR$"]',
  );
  const rowIndex = instructorContainer?.id.match(/\$(\d+)$/)?.[1] ?? '';

  if (rowIndex.length === 0) {
    return {
      course: getCourseFromPage(),
      crn: '',
      section: '',
      daysTime: '',
      room: '',
      meetingDates: '',
    };
  }

  return {
    course: getCourseFromPage(),
    crn: getTextByRowField(rowIndex, 'MTG_CLASS_NBR'),
    section: getTextByRowField(rowIndex, 'MTG_CLASSNAME'),
    daysTime: getTextByRowField(rowIndex, 'MTG_DAYTIME'),
    room: getTextByRowField(rowIndex, 'MTG_ROOM'),
    meetingDates: getTextByRowField(rowIndex, 'MTG_TOPIC'),
  };
}

async function showCardForNode(node: HTMLElement): Promise<void> {
  const name = node.dataset.profinsightName ?? '';
  const cacheKey = name.toLowerCase().trim();

  let info: ProfessorInfo | undefined = professorData[name];

  if (professorInfoCache.has(cacheKey)) {
    info =
      professorInfoCache.get(cacheKey) ?? createRateMyProfessorFallback(name);
  } else {
    try {
      const apiInfo = await fetchProfessorInfo('Cal Poly Pomona', name);

      if (apiInfo) {
        professorInfoCache.set(cacheKey, apiInfo);
        info = apiInfo;
      } else {
        const fallbackInfo = createRateMyProfessorFallback(name);

        professorInfoCache.set(cacheKey, fallbackInfo);
        info = fallbackInfo;
      }
    } catch {
      const fallbackInfo = createRateMyProfessorFallback(name);

      professorInfoCache.set(cacheKey, fallbackInfo);
      info = fallbackInfo;
    }
  }

  const rect = node.getBoundingClientRect();
  const classDetails = getClassRowDetailsFromProfessorNode(node);

  renderCard({
    info,
    classDetails,
    x: rect.left + 8,
    y: rect.bottom + 8,
  });
}

function bindHoverEvents(scope: ParentNode): void {
  const nodes = scope.querySelectorAll<HTMLElement>('.profinsight-name');

  nodes.forEach((node) => {
    if (node.dataset.profinsightBound === 'true') {
      return;
    }

    node.dataset.profinsightBound = 'true';

    node.addEventListener('mouseenter', () => {
      isNameHovered = true;
      clearHideTimer();
      void showCardForNode(node);
    });

    node.addEventListener('mouseleave', () => {
      isNameHovered = false;

      if (!isCardHovered) {
        startHideTimer();
      }
    });

    node.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      isNameHovered = true;
      clearHideTimer();
      void showCardForNode(node);
    });
  });
}

function scanPage(): void {
  const pageText = document.body.textContent?.toUpperCase() ?? '';

  const isCmsSearchPage = pageText.includes('SEARCH RESULTS');
  const isPublicSchedulePage = window.location.hostname === 'schedule.cpp.edu';

  if (!isCmsSearchPage && !isPublicSchedulePage) {
    return;
  }

  scanForProfessorNames();
  bindHoverEvents(document);
}

let scanTimer: number | null = null;

function scheduleScan(): void {
  if (scanTimer !== null) {
    window.clearTimeout(scanTimer);
  }

  scanTimer = window.setTimeout(() => {
    scanPage();
  }, 150);
}

const observer = new MutationObserver(() => {
  scheduleScan();
});

document.addEventListener(
  'click',
  () => {
    window.setTimeout(scanPage, 50);
    window.setTimeout(scanPage, 250);
    window.setTimeout(scanPage, 750);
  },
  true,
);

scanPage();

window.setTimeout(scanPage, 250);
window.setTimeout(scanPage, 750);
window.setTimeout(scanPage, 1500);
window.setTimeout(scanPage, 3000);
window.setTimeout(scanPage, 5000);

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

window.addEventListener('message', (event) => {
  if (event.source !== window) {
    return;
  }

  if (event.data?.type !== 'PROFINSIGHT_GET_SCHEDULE') {
    return;
  }

  chrome.storage.local.get([SCHEDULE_STORAGE_KEY], (result) => {
    const schedule = result[SCHEDULE_STORAGE_KEY] ?? [];

    window.postMessage(
      {
        type: 'PROFINSIGHT_SCHEDULE_RESPONSE',
        schedule,
      },
      window.location.origin,
    );
  });
});
