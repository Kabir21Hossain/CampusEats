import { redirect } from "next/navigation";

export default function RiderRegisterPage() {
  redirect("/signup?role=rider");
}
