"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import { Modal } from "@/components/Modal";

export function LogoutButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  function close() {
    if (leaving) return;
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          variant === "dark"
            ? "w-full rounded-xl px-3 py-2.5 text-left text-base font-semibold text-red-300 hover:bg-[#162033]"
            : "mt-4 flex min-h-12 items-center rounded-2xl px-3 py-3 text-left text-base font-semibold text-red-800"
        )}
      >
        Logout
      </button>
      <Modal
        open={open}
        onClose={close}
        title="Log out?"
        description="You will need to sign in again to collect rent or open files."
        size="sm"
        preventClose={leaving}
      >
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-red-800 px-4 py-3 text-base font-semibold text-white sm:w-auto sm:px-8"
            disabled={leaving}
            onClick={() => {
              setLeaving(true);
              void signOut({ callbackUrl: "/login" });
            }}
          >
            {leaving ? "Logging out…" : "Log out"}
          </button>
          <button type="button" className="btn-secondary w-full sm:w-auto" disabled={leaving} onClick={close}>
            Stay signed in
          </button>
        </div>
      </Modal>
    </>
  );
}
