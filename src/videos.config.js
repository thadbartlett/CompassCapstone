// videos.config.js
//
// The Academic Overview video list. Each video applies to a GRADE RANGE
// (gradeMin..gradeMax inclusive). A learner (parent) selects the grade(s) they
// have students in; the REQUIRED videos are the union of every video whose
// range covers a selected grade. All videos are viewable by anyone — only the
// grade-matched subset is required to complete the section.
//
// URLs are TEMPORARY placeholders (all point at one sample Vimeo video). The
// videos are embedded in the popup via the Vimeo player, so each `url` just
// needs to be the video's Vimeo page link (e.g. https://vimeo.com/1234567 or,
// for an unlisted video, https://vimeo.com/1234567/abcdef) — the embed URL is
// derived from it. Replace each with the real link when available. Keep the
// `id`s stable — they build xAPI activity ids and store watch progress.

export const VIDEOS = [
  { id: "science-7",           subject: "Science",          label: "Science – 7th Grade",            gradeMin: 7,  gradeMax: 7,  url: "https://vimeo.com/43224885" },
  { id: "science-8-11",        subject: "Science",          label: "Science – 8th–11th Grade",       gradeMin: 8,  gradeMax: 11, url: "https://vimeo.com/43224885" },
  { id: "latin-7-10",          subject: "Latin",            label: "Latin – 7th–10th Grade",         gradeMin: 7,  gradeMax: 10, url: "https://vimeo.com/43224885" },
  { id: "greek-11-12",         subject: "Greek",            label: "Greek – 11th–12th Grade",        gradeMin: 11, gradeMax: 12, url: "https://vimeo.com/43224885" },
  { id: "personal-finance-12", subject: "Personal Finance", label: "Personal Finance – 12th Grade",  gradeMin: 12, gradeMax: 12, url: "https://vimeo.com/43224885" },
  { id: "english-7-9",         subject: "English",          label: "English – 7th–9th Grade",        gradeMin: 7,  gradeMax: 9,  url: "https://vimeo.com/43224885" },
  { id: "english-10-11",       subject: "English",          label: "English – 10th–11th Grade",      gradeMin: 10, gradeMax: 11, url: "https://vimeo.com/43224885" },
  { id: "english-12",          subject: "English",          label: "English – 12th Grade",           gradeMin: 12, gradeMax: 12, url: "https://vimeo.com/43224885" },
  { id: "logic-7-9",           subject: "Logic",            label: "Logic – 7th–9th Grade",          gradeMin: 7,  gradeMax: 9,  url: "https://vimeo.com/43224885" },
  { id: "rhetoric-10-11",      subject: "Rhetoric",         label: "Rhetoric – 10th–11th Grade",     gradeMin: 10, gradeMax: 11, url: "https://vimeo.com/43224885" },
  { id: "rhetoric-12",         subject: "Rhetoric",         label: "Rhetoric – 12th Grade",          gradeMin: 12, gradeMax: 12, url: "https://vimeo.com/43224885" },
  { id: "history-7-8",         subject: "History",          label: "History – 7th–8th Grade",        gradeMin: 7,  gradeMax: 8,  url: "https://vimeo.com/43224885" },
  { id: "history-9-12",        subject: "History",          label: "History – 9th–12th Grade",       gradeMin: 9,  gradeMax: 12, url: "https://vimeo.com/43224885" },
  { id: "world-religions-12",  subject: "World Religions",  label: "World Religions – 12th Grade",   gradeMin: 12, gradeMax: 12, url: "https://vimeo.com/43224885" },
];

// Grades a learner can pick from.
export const GRADES = [7, 8, 9, 10, 11, 12];

// Which video ids are REQUIRED for the given selected grades (array of numbers)?
// A video is required if any selected grade falls within its range.
export function requiredVideoIds(grades) {
  const req = new Set();
  for (const v of VIDEOS) {
    if (grades.some((g) => g >= v.gradeMin && g <= v.gradeMax)) req.add(v.id);
  }
  return req;
}
