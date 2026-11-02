import { redirect } from "next/navigation";

/**
 * Function RiderRegisterPage.
 * @returns {*} The operation result.
 */
export default function RiderRegisterPage() {
  redirect("/signup?role=rider");
}
