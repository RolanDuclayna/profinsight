import type { MouseEvent as ReactMouseEvent } from "react";
import ReactDOM from "react-dom/client";
import HoverCard from "../components/HoverCard";
import { professorData, type ProfessorInfo } from "./mockData";
import { fetchProfessorInfo } from "./apiClient";
import "./content.css";

const INSTRUCTOR_HEADER_TEXT = "INSTRUCTOR";
const professorInfoCache = new Map<string, ProfessorInfo | null>();

function normalizeProfessorName(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\([^)]*\)/g, "")
    .trim();
}

function findInstructorColumnIndex(table: HTMLTableElement): number {
  const rows = Array.from(table.querySelectorAll("tr"));

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("th, td")) as HTMLElement[];

    const index = cells.findIndex((cell) =>
      cell.textContent?.trim().toUpperCase().includes(INSTRUCTOR_HEADER_TEXT)
    );

    if (index !== -1) {
      return index;
    }
  }

  return -1;
}

function getInstructorCells(): HTMLElement[] {
  const cells: HTMLElement[] = [];
  const tables = Array.from(document.querySelectorAll("table"));

  for (const table of tables) {
    const tableText = table.textContent?.toUpperCase() ?? "";

    const isClassResultsTable =
      tableText.includes("CLASS") &&
      tableText.includes("SECTION") &&
      tableText.includes("DAYS") &&
      tableText.includes("INSTRUCTOR") &&
      tableText.includes("INSTRUCTION MODE");

    if (!isClassResultsTable) {
      continue;
    }

    const rows = Array.from(table.querySelectorAll("tr"));
    let instructorIndex = -1;

    for (const row of rows) {
      const headerCells = Array.from(row.querySelectorAll("th, td")) as HTMLElement[];

      const possibleIndex = headerCells.findIndex((cell) => {
        const text = cell.textContent?.trim().toUpperCase() ?? "";
        return text === "INSTRUCTOR";
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
      const rowCells = Array.from(row.querySelectorAll("td")) as HTMLElement[];
      const instructorCell = rowCells[instructorIndex];

      if (!instructorCell) {
        continue;
      }

      const text = instructorCell.textContent?.trim() ?? "";

      if (
        text &&
        text.toUpperCase() !== "INSTRUCTOR" &&
        !text.toUpperCase().includes("INSTRUCTION MODE")
      ) {
        cells.push(instructorCell);
      }
    }
  }

  return cells;
}

function extractProfessorNamesFromCell(cell: HTMLElement): string[] {
  const rawText = cell.innerText || cell.textContent || "";

  const names = rawText
    .split(/\n|,|;|\/|\band\b/i)
    .map(normalizeProfessorName)
    .filter((name) => {
      return (
        name.length > 2 &&
        !/staff|tba|none|instructor|room|class|section|days|times|announced|to be announced/i.test(name) &&
        !/\d/.test(name)
      );
    });

  return Array.from(new Set(names));
}

function markProfessorName(element: HTMLElement, names: string[]) {
  if (element.dataset.profinsightProcessed === "true") {
    return;
  }

  element.dataset.profinsightProcessed = "true";
  element.classList.add("profinsight-instructor-cell");

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (node instanceof Text && node.textContent?.trim()) {
      textNodes.push(node);
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? "";
    let matchedName = "";

    for (const name of names) {
      if (text.includes(name)) {
        matchedName = name;
        break;
      }
    }

    if (!matchedName) {
      continue;
    }

    const before = text.slice(0, text.indexOf(matchedName));
    const after = text.slice(text.indexOf(matchedName) + matchedName.length);

    const fragment = document.createDocumentFragment();

    if (before) {
      fragment.appendChild(document.createTextNode(before));
    }

    const span = document.createElement("span");
    span.className = "profinsight-name";
    span.dataset.profinsightName = matchedName;
    span.textContent = matchedName;
    fragment.appendChild(span);

    if (after) {
      fragment.appendChild(document.createTextNode(after));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}

function scanForProfessorNames() {
  const instructorCells = getInstructorCells();

  for (const cell of instructorCells) {
    if (cell.dataset.profinsightProcessed === "true") {
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
  x: number;
  y: number;
} | null;

const rootId = "profinsight-root";
const CARD_VISIBLE_MS = 500;

let reactRoot: ReactDOM.Root | null = null;
let hideTimer: number | null = null;
let isNameHovered = false;
let isCardHovered = false;

function ensureRoot(): HTMLElement {
  let root = document.getElementById(rootId);

  if (!root) {
    root = document.createElement("div");
    root.id = rootId;
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.zIndex = "2147483647";
    root.style.pointerEvents = "none";
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
      x={card.x}
      y={card.y}
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
      onClose={() => {
        hideCard();
      }}
    />
  );
}

async function showCardForNode(node: HTMLElement) {
  const name = node.dataset.profinsightName ?? "";
  const cacheKey = name.toLowerCase().trim();

  let info: ProfessorInfo | undefined = professorData[name];

  if (professorInfoCache.has(cacheKey)) {
    info = professorInfoCache.get(cacheKey) ?? undefined;
  } else {
    try {
      const apiInfo = await fetchProfessorInfo("Cal Poly Pomona", name);
      professorInfoCache.set(cacheKey, apiInfo);
      if (apiInfo) {
        info = apiInfo;
      }
    } catch (error) {
      console.error("Failed to fetch professor info from API:", error);
      professorInfoCache.set(cacheKey, null);
    }
  }

  if (!info) {
    return;
  }

  const rect = node.getBoundingClientRect();

  renderCard({
    info,
    x: Math.min(rect.left + 4, window.innerWidth - 300),
    y: Math.min(rect.bottom + 4, window.innerHeight - 230)
  });
}

function bindHoverEvents(scope: ParentNode): void {
  const nodes = scope.querySelectorAll<HTMLElement>(".profinsight-name");

  nodes.forEach((node) => {
    if (node.dataset.profinsightBound === "true") {
      return;
    }

    node.dataset.profinsightBound = "true";

    node.addEventListener("mouseenter", () => {
      isNameHovered = true;
      clearHideTimer();
      void showCardForNode(node);
    });

    node.addEventListener("mouseleave", () => {
      isNameHovered = false;

      if (!isCardHovered) {
        startHideTimer();
      }
    });

    node.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      isNameHovered = true;
      clearHideTimer();
      void showCardForNode(node);
    });
  });
}

function scanPage(): void {
  const pageText = document.body.textContent?.toUpperCase() ?? "";

  if (!pageText.includes("SEARCH RESULTS")) {
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

scanPage();

window.setTimeout(scanPage, 500);
window.setTimeout(scanPage, 1500);
window.setTimeout(scanPage, 3000);

observer.observe(document.body, {
  childList: true,
  subtree: true
});