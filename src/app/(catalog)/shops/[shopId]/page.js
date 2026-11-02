import ShopDetailPage from "@/app/student/shops/[shopId]/page";

/**
 * Function PublicShopDetailPage.
 * @returns {*} The operation result.
 */
export default function PublicShopDetailPage({ params }) {
  return <ShopDetailPage params={params} />;
}
