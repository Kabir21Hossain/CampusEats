import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function POST(request) {
  try {
    const { applicationId, decision, reason } = await request.json();
    const appsCol = await getCollection("shopApplications");

    const app = await appsCol.findOne((a) => a.id === applicationId);
    if (!app) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    const updates = {
      status: decision,
      reviewReason: reason || "",
      reviewedAt: new Date().toISOString(),
      reviewedBy: "Dr. Farhana Yasmin (Admin)",
    };

    await appsCol.updateOne((a) => a.id === applicationId, updates);

    // If approved, add new active shop to shops collection in MongoDB
    if (decision === "approved") {
      const shopsCol = await getCollection("shops");
      const newShop = {
        id: `shop-${Date.now()}`,
        name: app.shopName,
        slug: app.shopName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: app.description,
        cuisine: "Snacks & Chaat",
        campusLocation: app.proposedLocation,
        operatingHours: "09:00 AM - 09:00 PM",
        isOpen: true,
        approvalStatus: "approved",
        rating: 5.0,
        reviewCount: 0,
        deliveryTimeMinutes: 20,
        minimumOrder: 50,
        bannerUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        logoUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=200&q=80",
        ownerUserId: app.ownerUserId,
        totalEarningsBDT: 0,
      };
      await shopsCol.insertOne(newShop);
    }

    return NextResponse.json({ success: true, message: `Application ${decision}` });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
