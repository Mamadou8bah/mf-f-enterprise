import { useEffect, useState, type FormEvent } from "react";
import { Reveal } from "./Reveal";

type Props = {
  enquireDraft?: string;
  onDraftConsumed?: () => void;
};

export function Contact({ enquireDraft = "", onDraftConsumed }: Props) {
  const [note, setNote] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!enquireDraft) return;
    setMessage(enquireDraft);
    onDraftConsumed?.();
  }, [enquireDraft]); // eslint-disable-line react-hooks/exhaustive-deps -- consume once per draft

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const reach = String(data.get("reach") || "").trim();
    const bodyMessage = String(data.get("message") || "").trim();
    if (!name || !reach || !bodyMessage) return;

    const body = [
      "Hello MF & F Enterprise,",
      "",
      `Name: ${name}`,
      `Reach: ${reach}`,
      "",
      bodyMessage,
    ].join("\n");

    setNote(
      "Message ready. Your email app should open — if not, copy and send it to the office."
    );

    window.location.href = `mailto:?subject=${encodeURIComponent(
      "MF & F website enquiry"
    )}&body=${encodeURIComponent(body)}`;
    form.reset();
    setMessage("");
  }

  return (
    <section className="section contact" id="contact">
      <div className="section-inner contact-grid">
        <div>
          <p className="eyebrow">Contact</p>
          <h2>Visit the office or leave a message</h2>
          <p className="section-lead">
            Tell us whether you are a landlord looking for management, or a tenant interested in a
            vacant place. We will get back to you from the MF &amp; F desk.
          </p>
          <ul className="contact-meta">
            <li>
              <span>Company</span> MF &amp; F Enterprise
            </li>
            <li>
              <span>Focus</span> Property &amp; rent management
            </li>
            <li>
              <span>Hours</span> Office days · by appointment preferred
            </li>
          </ul>
        </div>
        <Reveal>
          <form className="contact-form" onSubmit={onSubmit} noValidate>
            <label>
              Your name
              <input name="name" type="text" autoComplete="name" required />
            </label>
            <label>
              Phone or email
              <input name="reach" type="text" autoComplete="tel" required />
            </label>
            <label>
              Message
              <textarea
                name="message"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I would like help with…"
              />
            </label>
            <button className="btn btn-navy" type="submit">
              Send message
            </button>
            {note ? (
              <p className="form-note" role="status">
                {note}
              </p>
            ) : null}
          </form>
        </Reveal>
      </div>
    </section>
  );
}
