import { redirect } from "next/navigation";

export default function StudentRegisterPage() {
  redirect("/signup?role=student");
}
