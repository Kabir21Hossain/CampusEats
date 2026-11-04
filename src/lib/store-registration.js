import { APIError } from "better-auth/api";
import { ROLES } from "./constants.js";

export function validateStoreRegistration(user = {}) {
  const nextUser = { ...user };
  nextUser.email = nextUser.email?.trim().toLowerCase();
  nextUser.role = nextUser.role || ROLES.STUDENT;

  if (!Object.values(ROLES).includes(nextUser.role)) {
    throw new Error("Invalid account role");
  }

  if (!nextUser.phone?.trim()) {
    throw new APIError("BAD_REQUEST", {
      message: "Phone number is required",
    });
  }

  if (
    nextUser.role === ROLES.STUDENT &&
    (!nextUser.studentId?.trim() || !nextUser.dormitoryAddress?.trim())
  ) {
    throw new APIError("BAD_REQUEST", {
      message: "Student ID and dormitory details are required",
    });
  }

  if (
    nextUser.role === ROLES.SHOP_OWNER &&
    (!nextUser.shopName?.trim() ||
      !nextUser.location?.trim() ||
      !nextUser.shopCategory?.trim())
  ) {
    throw new APIError("BAD_REQUEST", {
      message: "Shop name, location, and category are required",
    });
  }

  if (
    nextUser.role === ROLES.RIDER &&
    (!["Bicycle", "Motorcycle"].includes(nextUser.vehicleType) ||
      !nextUser.deliveryZones?.trim() ||
      (nextUser.vehicleType === "Motorcycle" && !nextUser.licenseNumber?.trim()))
  ) {
    throw new APIError("BAD_REQUEST", {
      message: "Rider vehicle and delivery details are required",
    });
  }

  if (nextUser.role === ROLES.SHOP_OWNER || nextUser.role === ROLES.RIDER) {
    nextUser.verificationStatus = "pending";
  } else {
    nextUser.verificationStatus = "verified";
  }
  nextUser.isSuspended = false;

  return nextUser;
}
