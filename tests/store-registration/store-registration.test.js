import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ROLES } from "../../src/lib/constants.js";
import { validateStoreRegistration } from "../../src/lib/store-registration.js";

describe("store registration workflow", () => {
  it("accepts a complete shop-owner registration and marks it for admin review", () => {
    const user = validateStoreRegistration({
      email: "owner@example.com",
      name: "Rafi Rahman",
      phone: "+8801700000000",
      role: ROLES.SHOP_OWNER,
      shopName: "Campus Grill",
      location: "Block C, Stall 04",
      shopCategory: "Biryani & Rice",
    });

    assert.equal(user.role, ROLES.SHOP_OWNER);
    assert.equal(user.verificationStatus, "pending");
    assert.equal(user.isSuspended, false);
    assert.equal(user.email, "owner@example.com");
  });

  it("rejects a shop owner application when the store profile is incomplete", () => {
    assert.throws(
      () =>
        validateStoreRegistration({
          email: "owner@example.com",
          name: "Rafi Rahman",
          phone: "+8801700000000",
          role: ROLES.SHOP_OWNER,
          shopName: "",
          location: "",
          shopCategory: "",
        }),
      (error) => {
        assert.match(error.message, /Shop name, location, and category are required/i);
        return true;
      }
    );
  });

  it("keeps students verified while pending shop-owner applications await admin approval", () => {
    const student = validateStoreRegistration({
      email: "student@example.com",
      name: "Nadia Islam",
      phone: "+8801800000000",
      role: ROLES.STUDENT,
      studentId: "2024-121",
      dormitoryAddress: "Al Beruni Hall, Room 204",
    });

    const owner = validateStoreRegistration({
      email: "shopowner@example.com",
      name: "Farhan Ahmed",
      phone: "+8801900000000",
      role: ROLES.SHOP_OWNER,
      shopName: "Dorm Bites",
      location: "Main Gate",
      shopCategory: "Snacks & Chaat",
    });

    assert.equal(student.verificationStatus, "verified");
    assert.equal(owner.verificationStatus, "pending");
  });
});
