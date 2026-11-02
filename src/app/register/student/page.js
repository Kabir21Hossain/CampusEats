import { redirect } from "next/navigation";

/**
 * Function StudentRegisterPage.
 * @returns {*} The operation result.
 */
export default function StudentRegisterPage() {
  redirect("/signup?role=student");
}
