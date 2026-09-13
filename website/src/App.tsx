import { useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Vacancies } from "./components/Vacancies";
import { Services } from "./components/Services";
import { Areas } from "./components/Areas";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import type { PublicVacancy } from "./lib/vacancies";
import { formatGmd } from "./lib/vacancies";

export default function App() {
  const [enquireDraft, setEnquireDraft] = useState("");

  function onEnquire(vacancy: PublicVacancy) {
    const rent =
      vacancy.askingRentGmd != null ? ` (${formatGmd(vacancy.askingRentGmd)} asking)` : "";
    setEnquireDraft(
      `I am interested in vacant unit ${vacancy.code} at ${vacancy.propertyName}${
        vacancy.area ? `, ${vacancy.area}` : ""
      }${rent}. Please contact me with viewing details.`
    );
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Vacancies onEnquire={onEnquire} />
        <Services />
        <Areas />
        <About />
        <Contact enquireDraft={enquireDraft} onDraftConsumed={() => setEnquireDraft("")} />
      </main>
      <Footer />
    </>
  );
}
