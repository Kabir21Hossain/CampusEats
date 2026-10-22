import { redirect } from "next/navigation";

export default function ShopOwnerRegisterPage() {
  redirect("/signup?role=shop_owner");
}
