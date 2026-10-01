"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

import { TextInput } from "@/components/profile/TextInput";

type Props = {
  id: string;
  name: string;
  placeholder: string;
  initialTags: string[];
};

export function TagInput({ id, name, placeholder, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const tag = draft.trim();
    const isDuplicate = tags.some(
      (existing) => existing.toLowerCase() === tag.toLowerCase(),
    );

    if (tag && !isDuplicate) {
      setTags([...tags, tag]);
    }
    setDraft("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((existing) => existing !== tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Enter would otherwise submit the whole profile form
    if (event.key === "Enter") {
      event.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <TextInput
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={addTag}
          className="h-[42px] shrink-0 rounded-md bg-surface-tertiary px-4 text-sm font-medium text-text-dark transition-colors hover:bg-border-light"
        >
          Add
        </button>
      </div>

      {tags.length > 0 && (
        <ul className="mt-3.5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background py-1.5 pr-2 pl-3 text-sm font-medium text-text-darkest"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="text-text-secondary transition-colors hover:text-error"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {tags.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}
    </div>
  );
}
