import { readFile } from "node:fs/promises";

async function source(path: string) { return readFile(path, "utf8"); }
function requireMarkers(label: string, body: string, markers: string[]) {
  for (const marker of markers) if (!body.includes(marker)) throw new Error(`${label} contract missing: ${marker}`);
}

const operating = await source("src/lib/ux-operating-layer.ts");
requireMarkers("P0 operating foundation", operating, [
  'export type OperatingPersona',
  'export type CompanyStage',
  'start-to-up-operating-preferences',
  'start-to-up-recent-work',
  'start-to-up-saved-views',
  'journeyStages',
  'suggestedRoutePaths',
  'workGroups',
]);

const shell = await source("src/components/app-shell.tsx");
requireMarkers("P0 shell", shell, [
  'to: "/app/home", label: "Today"',
  'to: "/app/work", label: "Work"',
  'to: "/app/create", label: "Create"',
  'to: "/app/inbox", label: "Inbox"',
  'to: "/app/profile", label: "Me"',
  'start-to-up-active-workspace',
  'Command search',
  'saveOperatingPreferences',
  'OperatingCreateLauncher',
  'start-to-up:workspace-change',
]);
requireMarkers("P1 shared shell", shell, [
  'start-to-up:save-state',
  'start-to-up:entity-peek',
  'operating-entity-drawer',
  'operating-save-state',
  'openWorkspacePeek',
  'readSavedViews',
  'recordRecentWork',
]);
requireMarkers("P2 keyboard workflow", shell, [
  'event.key.toLowerCase() === "k"',
  'event.key.toLowerCase() === "c"',
  'event.key.toLowerCase() === "h"',
  'event.key.toLowerCase() === "w"',
  'event.key.toLowerCase() === "i"',
]);

const home = await source("src/routes/app/home.tsx");
requireMarkers("P0 command centre", home, [
  'operating-command-centre',
  'Your next actions',
  'COMPANY PULSE',
  'COMPANY JOURNEY',
  'Continue working',
  'Recommended',
]);
requireMarkers("P1 timeline", home, [
  'Company timeline',
  'snapshot.activity',
  'readRecentWork',
]);

const work = await source("src/routes/app/work.tsx");
requireMarkers("P0 guided work", work, [
  'TASK-BASED COMPANY OPERATING SYSTEM',
  'Personalise the workspace',
  'workGroups',
  'suggestedRoutePaths',
]);
requireMarkers("P2 saved views", work, [
  'Saved views',
  'saveCurrentView',
  'removeSavedView',
]);

const inbox = await source("src/routes/app/inbox.tsx");
requireMarkers("P1 unified inbox", inbox, [
  'MESSAGES · ACTIONS · REVIEWS · ACTIVITY',
  'usePrivateTrustData',
  'snapshot.tasks',
  'snapshot.activity',
  'kind: needsReview ? "reviews" : "actions"',
]);

const createLauncher = await source("src/components/operating-create-launcher.tsx");
requireMarkers("P0 universal create", createLauncher, [
  'UNIVERSAL CREATE',
  'Lead / sale',
  'Campaign',
  'Contract / legal',
  'Investor / funding',
  'Website',
  'Company action',
]);

const studio = await source("src/components/website-studio-v6-enhancements.tsx");
requireMarkers("P2 Website Studio power layer", studio, [
  'type InspectorTab = "content" | "design" | "layout" | "responsive"',
  'start-to-up-studio-focus-mode',
  'start-to-up-studio-undo-history',
  'start-to-up-studio-redo-history',
  'stu-editor-toolbar',
  'stu-selection-breadcrumb',
  'stu-inspector-tabs',
  'stu-preflight-layer',
  'publishChecks',
  'Open export & publish',
]);

const studioPowerCss = await source("src/website-studio-power-tools.css");
requireMarkers("P2 Website Studio responsive UX", studioPowerCss, [
  '.stu-focus-mode .desktop-sidebar',
  '.stu-editor-toolbar',
  '.stu-preflight-card',
  '.stu-inspector-tabs',
  'top:auto!important',
  'max-height:min(78dvh,calc(100dvh - 20px))',
]);

const shellCss = await source("src/ux-operating-layer-p1.css");
requireMarkers("P1 canonical surface CSS", shellCss, [
  '.operating-entity-drawer',
  '.operating-save-state.saved',
  '.operating-save-state.saving',
  '.operating-save-state.offline',
  'max-height:min(76dvh,calc(100dvh - 20px))',
]);

console.log("UX Operating Layer P0 → P1 → P2 contract passed.");
