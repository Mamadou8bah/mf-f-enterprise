"use client";

export function BatchCopyReminders({ texts }: { texts: string[] }) {
  return (
    <button
      type="button"
      className="btn-primary"
      disabled={!texts.length}
      onClick={async () => {
        await navigator.clipboard.writeText(texts.join("\n\n---\n\n"));
        alert(`Copied ${texts.length} reminders`);
      }}
    >
      Copy all reminders ({texts.length})
    </button>
  );
}
