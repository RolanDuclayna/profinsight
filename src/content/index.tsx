import type { MouseEvent as ReactMouseEvent } from "react";
import ReactDOM from "react-dom/client";
import HoverCard from "../components/HoverCard";
import { professorData, type ProfessorInfo } from "./mockData";
import { fetchProfessorInfo } from "./apiClient";
import "./content.css";

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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shouldSkipNode(parent: HTMLElement | null): boolean {
  if (!parent) {
    return true;
  }

  if (parent.closest("#profinsight-root")) {
    return true;
  }

  const tagName = parent.tagName.toLowerCase();

  if (
    tagName === "script" ||
    tagName === "style" ||
    tagName === "noscript" ||
    tagName === "textarea"
  ) {
    return true;
  }

  if (parent.closest(".profinsight-name")) {
    return true;
  }

  return false;
}

async function showCardForNode(node: HTMLElement) {
  const name = node.dataset.profinsightName ?? "";
  let info = professorData[name];

  try {
    const apiInfo = await fetchProfessorInfo("Cal Poly Pomona", name);
    if (apiInfo) {
      info = apiInfo;
    }
  } catch (error) {
    console.error("Failed to fetch professor info from API:", error);
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
      showCardForNode(node);
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
      showCardForNode(node);
    });
  });
}

function replaceProfessorNamesInTextNode(textNode: Text): void {
  const parent = textNode.parentElement;

  if (shouldSkipNode(parent)) {
    return;
  }

  const text = textNode.textContent ?? "";

  if (!text.trim()) {
    return;
  }

  let hasMatch = false;

  for (const name of Object.keys(professorData)) {
    const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`);

    if (regex.test(text)) {
      hasMatch = true;
      break;
    }
  }

  if (!hasMatch) {
    return;
  }

  const fragment = document.createDocumentFragment();
  let remainingText = text;

  while (remainingText.length > 0) {
    let earliestIndex = -1;
    let earliestName = "";

    for (const name of Object.keys(professorData)) {
      const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`);
      const match = remainingText.match(regex);

      if (!match || match.index === undefined) {
        continue;
      }

      if (earliestIndex === -1 || match.index < earliestIndex) {
        earliestIndex = match.index;
        earliestName = name;
      }
    }

    if (earliestIndex === -1) {
      fragment.appendChild(document.createTextNode(remainingText));
      break;
    }

    if (earliestIndex > 0) {
      fragment.appendChild(
        document.createTextNode(remainingText.slice(0, earliestIndex))
      );
    }

    const span = document.createElement("span");
    span.className = "profinsight-name";
    span.dataset.profinsightName = earliestName;
    span.textContent = earliestName;
    fragment.appendChild(span);

    remainingText = remainingText.slice(earliestIndex + earliestName.length);
  }

  textNode.parentNode?.replaceChild(fragment, textNode);
}

function scanPage(): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const current = walker.currentNode;

    if (current instanceof Text) {
      textNodes.push(current);
    }
  }

  textNodes.forEach((textNode) => {
    replaceProfessorNamesInTextNode(textNode);
  });

  bindHoverEvents(document);
}

const observer = new MutationObserver(() => {
  scanPage();
});

scanPage();

observer.observe(document.body, {
  childList: true,
  subtree: true
});
