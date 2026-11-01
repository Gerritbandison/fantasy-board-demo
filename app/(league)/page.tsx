import { redirect } from "next/navigation";

/** The site opens on this week's matchups and roast cards. */
export default function HomePage() {
  redirect("/matchups");
}
