import { redirect } from "next/navigation";

/**
 * Function ShopOwnerRegisterPage.
 * @returns {*} The operation result.
 */
export default function ShopOwnerRegisterPage() {
  redirect("/signup?role=shop_owner");
}
