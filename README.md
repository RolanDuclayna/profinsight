# ProfessorInsight

ProfessorInsight is a Chrome extension prototype for Cal Poly Pomona class search. It detects professor names on the CPP class search page, shows RateMyProfessors information in a hover card, lets students save classes to a schedule popup, and uses a local Ollama model for AI summaries.

## How to Run the Full Project

You need three things running or built:

1. Ollama running in the background
2. The local API running in the background
3. The Chrome extension built and loaded into Chrome

### 1. Start Ollama

Install Ollama first if you do not have it installed.

Pull the model:

```bash
ollama pull llama3.2:3b
```

Start Ollama:

```bash
ollama serve
```

Leave this terminal running.

If it says the port is already in use, Ollama is probably already running.

## Optional: Preload Ollama Model for Demo

Before presenting the demo, you can send a small test request to Ollama so the model stays loaded in memory for 10 minutes. This makes the first real request feel faster.

```bash
curl http://localhost:11434/api/generate \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "Say ready.",
    "stream": false,
    "keep_alive": "10m"
  }'
```

Check that the model is loaded:

```bash
ollama ps
```

### 2. Start the API

Open a new terminal from the project root:

```bash
npm install
```

Then start the API:

```bash
npm run dev:api
```

The API should run at:

```text
http://localhost:8787
```

You can test it with:

```bash
curl http://localhost:8787/health
```

Expected response:

```json
{
  "ok": true,
  "service": "profinsight-api"
}
```

Leave this terminal running too.

### 3. Build the Chrome Extension

Open another terminal from the project root:

```bash
npm run build
```

This creates the extension build inside:

```text
dist
```

### 4. Load the Extension in Chrome

Open Chrome and go to:

```text
chrome://extensions
```

Turn on:

```text
Developer mode
```

Click:

```text
Load unpacked
```

Select the project's `dist` folder.

The extension should now be installed.

### 5. Test the Extension

Go to the Cal Poly Pomona class search page:

```text
https://cmsweb.cms.cpp.edu/
```

Search for classes.

When professor names appear, hover over a professor name.

The extension should show a ProfessorInsight hover card with professor information.

## Main Features

### Professor Hover Card

When hovering over a professor name on the CPP class search page, the extension shows:

```text
Professor name
RateMyProfessors rating
Difficulty
Review link
Compare options
Add to Schedule button
AI Professor Summary button
```

### Saved Schedule Popup

Clicking **Add to Schedule** saves the class to Chrome local storage.

Clicking the extension icon opens the popup and shows saved classes with:

```text
Class code
CRN
Meeting time
Room
Professor name
Professor rating
RMP link
```

### Copy Schedule

The popup has a **Copy Schedule** button that copies a clean text version of the saved schedule.

### AI Schedule Summary

The popup has an **AI Summary** button.

It sends the saved schedule to the local API, which sends a short prompt to Ollama.

The AI summary can point out things like:

```text
Possible time conflicts
Back to back classes in different buildings
Professor rating comparisons
Missing schedule information
```

### AI Professor Summary

The hover card has an **AI Professor Summary** button.

The API fetches the professor's RateMyProfessors page, extracts a small number of visible recent review comments, and sends those comments to Ollama.

The summary is saved in Chrome local storage, so it can still appear later if the hover card closes.

### DPR Helper

The popup includes a DPR upload helper.

Students can upload a Degree Progress Report PDF. The API extracts the PDF text, manually parses the remaining course requirements, and sends only the safe extracted results to Ollama.

The AI does not read the full DPR directly.

The DPR helper summarizes things like:

```text
Remaining required courses
Remaining major elective units
Reminder to verify with an advisor
```

## Project Structure

```text
ProfessorInsight
  apps
    api
      src
        index.ts
        professorService.ts
        rmpProvider.ts
  src
    content
      index.tsx
      HoverCard.tsx
      content.css
    popup
      index.html
      main.tsx
      Popup.tsx
      popup.css
    shared
      schedule.ts
  manifest.config.ts
  vite.config.ts
  package.json
```

## API Endpoints

### Health Check

```text
GET /health
```

Checks if the API is running.

### Professor Lookup

```text
POST /api/professors
```

Used by the extension to get RateMyProfessors information.

Example body:

```json
{
  "school": "Cal Poly Pomona",
  "professors": ["Yu Sun"]
}
```

### Schedule Summary

```text
POST /api/schedule-summary
```

Used by the popup to summarize the saved schedule with Ollama.

### Professor Summary

```text
POST /api/professor-summary
```

Used by the hover card to summarize recent RateMyProfessors review comments with Ollama.

### DPR Summary

```text
POST /api/dpr-summary
```

Used by the popup to upload a DPR PDF and summarize remaining requirements.

## Important Demo Notes

The AI features run locally through Ollama.

The extension stores saved schedule data using:

```text
chrome.storage.local
```

The DPR helper does not send the full report to Ollama. The API first extracts only the detected remaining requirements, then asks Ollama to summarize those safe results.

The DPR helper is a prototype and should not replace academic advising.

## Useful Commands

Install dependencies:

```bash
npm install
```

Run the API:

```bash
npm run dev:api
```

Build the extension:

```bash
npm run build
```

Run Ollama:

```bash
ollama serve
```

Pull the Ollama model:

```bash
ollama pull llama3.2:3b
```

## Troubleshooting

If professor data does not load, make sure the API is running:

```bash
npm run dev:api
```

If AI summaries do not work, make sure Ollama is running:

```bash
ollama serve
```

If extension changes do not appear, rebuild and reload the extension:

```bash
npm run build
```

Then go to:

```text
chrome://extensions
```

Click reload on ProfessorInsight.
