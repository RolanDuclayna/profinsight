import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "ProfInsight Prototype",
  version: "0.1.0",
  description: "Quick professor ratings for Cal Poly Pomona class search.",
  host_permissions: [
    "https://cmsweb.cms.cpp.edu/*"
  ],
  content_scripts: [
    {
      matches: [
        "https://cmsweb.cms.cpp.edu/*"
      ],
      js: ["src/content/index.tsx"],
      css: ["src/content/content.css"],
      all_frames: true
    }
  ]
});