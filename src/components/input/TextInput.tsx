'use client';

import { useState, useCallback, useEffect } from 'react';
import type { TextLine } from '@/types/banner';

interface TextInputProps {
  title: string;
  highlightKeyword: string;
  titleLines: TextLine[];
  accentColor: string;
  onTitleChange: (title: string) => void;
  onKeywordChange: (keyword: string) => void;
  onTitleLinesChange: (lines: TextLine[]) => void;
}

export default function TextInput({
  titleLines,
  accentColor,
  onTitleChange,
  onTitleLinesChange,
}: TextInputProps) {
  const [richTextInput, setRichTextInput] = useState('');
  const [highlightWords, setHighlightWords] = useState('');

  // Initialize rich text input from titleLines
  useEffect(() => {
    if (titleLines.length > 0 && !richTextInput) {
      const text = titleLines
        .map((line) => line.segments.map((s) => s.text).join(''))
        .join('\n');
      setRichTextInput(text);

      const highlighted = titleLines
        .flatMap((line) =>
          line.segments.filter((s) => s.fontWeight === 700 && s.color).map((s) => s.text)
        );
      const unique = [...new Set(highlighted)];
      setHighlightWords(unique.join(','));
    }
  }, []);

  const parseRichText = useCallback(
    (text: string, highlights: string) => {
      const highlightList = highlights
        .split(',')
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      const lines = text.split('\n');
      const result: TextLine[] = [];

      for (const lineText of lines) {
        if (!lineText) {
          result.push({ segments: [{ text: ' ' }] });
          continue;
        }

        if (highlightList.length === 0) {
          result.push({ segments: [{ text: lineText, fontWeight: 700 }] });
          continue;
        }

        // Split line by highlight words
        const segments: TextLine['segments'] = [];
        let remaining = lineText;

        while (remaining.length > 0) {
          let earliestIdx = -1;
          let earliestWord = '';

          for (const word of highlightList) {
            const idx = remaining.indexOf(word);
            if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
              earliestIdx = idx;
              earliestWord = word;
            }
          }

          if (earliestIdx === -1) {
            segments.push({ text: remaining, fontWeight: 700 });
            break;
          }

          if (earliestIdx > 0) {
            segments.push({ text: remaining.substring(0, earliestIdx), fontWeight: 700 });
          }

          segments.push({
            text: earliestWord,
            color: accentColor,
            fontWeight: 700,
          });

          remaining = remaining.substring(earliestIdx + earliestWord.length);
        }

        result.push({ segments });
      }

      return result;
    },
    [accentColor]
  );

  const handleRichTextChange = useCallback(
    (text: string) => {
      setRichTextInput(text);
      const lines = parseRichText(text, highlightWords);
      onTitleLinesChange(lines);
      onTitleChange(text.replace(/\n/g, ' '));
    },
    [highlightWords, parseRichText, onTitleLinesChange, onTitleChange]
  );

  const handleHighlightWordsChange = useCallback(
    (words: string) => {
      setHighlightWords(words);
      const lines = parseRichText(richTextInput, words);
      onTitleLinesChange(lines);
    },
    [richTextInput, parseRichText, onTitleLinesChange]
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-sm text-foreground mb-1">
          テキスト（改行で行分割）
        </label>
        <textarea
          value={richTextInput}
          onChange={(e) => handleRichTextChange(e.target.value)}
          placeholder={"みんなが集まれる\"場\"で\nフルリモートでも出社率向上"}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:border-primary focus:outline-none resize-none"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground mb-1">
          強調ワード（カンマ区切り）
        </label>
        <input
          type="text"
          value={highlightWords}
          onChange={(e) => handleHighlightWordsChange(e.target.value)}
          placeholder="場,出社率向上"
          className="w-full h-9 px-3 text-sm border border-border rounded-md bg-white focus:border-primary focus:outline-none"
        />
        <p className="text-[11px] text-muted mt-1">
          指定したワードがアクセントカラー+太字で表示されます
        </p>
      </div>

      {/* Segment preview */}
      {titleLines.length > 0 && (
        <div className="p-2 bg-background rounded-md border border-border">
          <p className="text-[10px] text-muted mb-1">プレビュー:</p>
          {titleLines.map((line, li) => (
            <div key={li} className="text-sm">
              {line.segments.map((seg, si) => (
                <span
                  key={si}
                  style={{
                    color: seg.color || undefined,
                    fontWeight: seg.fontWeight || 400,
                  }}
                >
                  {seg.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
