/**
 * The public site read as one bound record: every page is a numbered "section" of
 * The USWAG Record, in the same order as the Header's nav. PageMasthead shows the number;
 * ChapterNav links each page to the one before and after it so no page is a dead end.
 */
export interface Chapter {
  path: string;
  /** Roman numeral shown in the masthead; the front page has none. */
  numeral: string;
  title: string;
  /** One line shown on the ChapterNav card pointing *to* this page. */
  teaser: string;
}

export const CHAPTERS: Chapter[] = [
  { path: '/', numeral: '', title: 'The Front Page', teaser: 'Where the record begins — and where it’s headed.' },
  { path: '/about', numeral: 'I', title: 'About USWAG', teaser: 'Who we are, in the words of our Constitution.' },
  { path: '/advocacies', numeral: 'II', title: 'Advocacies', teaser: 'The three causes every program answers to.' },
  { path: '/officers', numeral: 'III', title: 'Officers', teaser: 'From the founding batch to today’s stewards.' },
  { path: '/events', numeral: 'IV', title: 'Events', teaser: 'Assemblies, outreach, and forums on the calendar.' },
  { path: '/news', numeral: 'V', title: 'News', teaser: 'Updates from our Facebook Page, in one place.' },
  { path: '/join', numeral: 'VI', title: 'Join USWAG', teaser: 'How to add your name to the record.' },
];

export function chapterFor(path: string) {
  const i = CHAPTERS.findIndex((c) => c.path === path);
  return { index: i, chapter: CHAPTERS[i], prev: CHAPTERS[i - 1], next: CHAPTERS[i + 1] };
}
