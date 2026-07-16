"use client";

import { useTransition } from "react";
import { toggleReaction, type EntryType } from "@/lib/reactions";

const EMOJI = ["♡", "😍", "😂", "👏", "😮"];

export type Reaction = { emoji: string; user_id: string };

export function ReactionBar({
  entryType,
  entryId,
  userId,
  reactions,
}: {
  entryType: EntryType;
  entryId: string;
  userId: string;
  reactions: Reaction[];
}) {
  const [pending, startTransition] = useTransition();
  const mine = reactions.find((r) => r.user_id === userId)?.emoji;

  return (
    <div className="ss-reactions">
      {EMOJI.map((emoji) => {
        const count = reactions.filter((r) => r.emoji === emoji).length;
        return (
          <button
            key={emoji}
            type="button"
            disabled={pending}
            className={`ss-reaction ${mine === emoji ? "sel" : ""}`}
            aria-pressed={mine === emoji}
            onClick={() => startTransition(() => toggleReaction(entryType, entryId, emoji))}
          >
            {emoji}
            {count > 0 && <span className="ss-reaction-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
