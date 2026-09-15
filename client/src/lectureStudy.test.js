import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('opening a lecture with a video begins at part 1 and never offers that video as a document', async () => {
  globalThis.localStorage = { getItem: () => null };
  const temp = await mkdtemp(path.resolve('.study-test-'));
  try {
    const outfile = path.join(temp, 'study.mjs');
    await build({ entryPoints: ['src/LectureStudyPage.jsx'], outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
      plugins: [{ name: 'pdf-browser-boundary', setup(builder) {
        builder.onLoad({ filter: /LectureStudyPage\.jsx$/ }, async (args) => ({ contents: (await readFile(args.path, 'utf8')).replace('const [backendLecture, setBackendLecture] = useState(null)', 'const [backendLecture, setBackendLecture] = useState(file)'), loader: 'jsx' }));
        builder.onResolve({ filter: /\/PdfReader$/ }, () => ({ path: 'pdf-reader', namespace: 'stub' }));
        builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export default function PdfReader() { return null; }' }));
      } }],
    });
    const { default: LectureStudyPage } = await import(pathToFileURL(outfile));
    const markup = renderToStaticMarkup(React.createElement(LectureStudyPage, {
      lectureId: 9, file: { id: 9, title: 'Lecture test', files: [{ fileId: 24, originalName: 'lecture.mp4', fileType: 'VIDEO' }] },
    }));
    assert.match(markup, /Đang xem: <strong>Phần 1<\/strong>/);
    assert.doesNotMatch(markup, /doc-office-title[^>]*>lecture.mp4/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});


