// videos.config.js
//
// The Academic Overview video list. Each video applies to a GRADE RANGE
// (gradeMin..gradeMax inclusive). A learner (parent) selects the grade(s) they
// have students in; the REQUIRED videos are the union of every video whose
// range covers a selected grade. All videos are viewable by anyone — only the
// grade-matched subset is required to complete the section.
//
// URLs are placeholders pointing at YouTube for now; replace each `url` with
// the real video link when available. Keep the `id`s stable — they are used to
// build xAPI activity ids and to store which videos a learner has watched.

export const VIDEOS = [
  { id: "science-7",           subject: "Science",          label: "Science – 7th Grade",            gradeMin: 7,  gradeMax: 7,  url: "https://www.youtube.com" },
  { id: "science-8-11",        subject: "Science",          label: "Science – 8th–11th Grade",       gradeMin: 8,  gradeMax: 11, url: "https://www.youtube.com" },
  { id: "latin-7-10",          subject: "Latin",            label: "Latin – 7th–10th Grade",         gradeMin: 7,  gradeMax: 10, url: "https://www.youtube.com" },
  { id: "greek-11-12",         subject: "Greek",            label: "Greek – 11th–12th Grade",        gradeMin: 11, gradeMax: 12, url: "https://www.youtube.com" },
  { id: "personal-finance-12", subject: "Personal Finance", label: "Personal Finance – 12th Grade",  gradeMin: 12, gradeMax: 12, url: "https://www.youtube.com" },
  { id: "english-7-9",         subject: "English",          label: "English – 7th–9th Grade",        gradeMin: 7,  gradeMax: 9,  url: "https://www.youtube.com" },
  { id: "english-10-11",       subject: "English",          label: "English – 10th–11th Grade",      gradeMin: 10, gradeMax: 11, url: "https://www.youtube.com" },
  { id: "english-12",          subject: "English",          label: "English – 12th Grade",           gradeMin: 12, gradeMax: 12, url: "https://www.youtube.com" },
  { id: "logic-7-9",           subject: "Logic",            label: "Logic – 7th–9th Grade",          gradeMin: 7,  gradeMax: 9,  url: "https://www.youtube.com" },
  { id: "rhetoric-10-11",      subject: "Rhetoric",         label: "Rhetoric – 10th–11th Grade",     gradeMin: 10, gradeMax: 11, url: "https://www.youtube.com" },
  { id: "rhetoric-12",         subject: "Rhetoric",         label: "Rhetoric – 12th Grade",          gradeMin: 12, gradeMax: 12, url: "https://www.youtube.com" },
  { id: "history-7-8",         subject: "History",          label: "History – 7th–8th Grade",        gradeMin: 7,  gradeMax: 8,  url: "https://www.youtube.com" },
  { id: "history-9-12",        subject: "History",          label: "History – 9th–12th Grade",       gradeMin: 9,  gradeMax: 12, url: "https://www.youtube.com" },
  { id: "world-religions-12",  subject: "World Religions",  label: "World Religions – 12th Grade",   gradeMin: 12, gradeMax: 12, url: "https://www.youtube.com" },
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
