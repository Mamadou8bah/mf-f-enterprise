import { redirect } from "next/navigation";

export default function SettlementRedirect() {
  redirect("/documents/collections");
}
