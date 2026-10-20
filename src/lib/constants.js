/**
 * CampusEats Constants & Specifications
 */

export const ROLES = {
  STUDENT: "student",
  SHOP_OWNER: "shop_owner",
  RIDER: "rider",
  ADMIN: "admin",
};

export const ORDER_STATUS = {
  PLACED: "placed",
  CONFIRMED: "confirmed",
  AWAITING_RIDER: "awaiting_rider",
  CLAIMED: "claimed",
  PICKED_UP: "picked_up",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
  DISPUTED: "disputed",
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PLACED]: "Order Placed",
  [ORDER_STATUS.CONFIRMED]: "Preparing Food",
  [ORDER_STATUS.AWAITING_RIDER]: "Ready for Pickup",
  [ORDER_STATUS.CLAIMED]: "Rider Assigned",
  [ORDER_STATUS.PICKED_UP]: "Out for Delivery",
  [ORDER_STATUS.DELIVERED]: "Delivered",
  [ORDER_STATUS.CANCELLED]: "Cancelled",
  [ORDER_STATUS.REJECTED]: "Declined by Shop",
  [ORDER_STATUS.DISPUTED]: "Under Dispute",
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PLACED]: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  [ORDER_STATUS.CONFIRMED]: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  [ORDER_STATUS.AWAITING_RIDER]: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  [ORDER_STATUS.CLAIMED]: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  [ORDER_STATUS.PICKED_UP]: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  [ORDER_STATUS.DELIVERED]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  [ORDER_STATUS.CANCELLED]: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  [ORDER_STATUS.REJECTED]: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  [ORDER_STATUS.DISPUTED]: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
};

// Escrow split definition
export const ESCROW_CONFIG = {
  SHOP_PERCENTAGE: 0.85,
  RIDER_PERCENTAGE: 0.12,
  PLATFORM_PERCENTAGE: 0.03,
};

// Base delivery fee in BDT
export const DEFAULT_DELIVERY_FEE = 30;

// Campus Dormitories and Landmark addresses
export const CAMPUS_LOCATIONS = [
  "Shahidullah Hall",
  "Fazlul Huq Muslim Hall",
  "Jagannath Hall",
  "Salimullah Muslim Hall",
  "Zahir Raihan Hall",
  "Rokeya Hall",
  "Kabi Sufia Kamal Hall",
  "Shamsun Nahar Hall",
  "Bangabandhu Sheikh Mujibur Rahman Hall",
  "Bijoy Ekattor Hall",
  "Muktijoddha Ziaur Rahman Hall",
  "Central Library Area",
  "TSC (Teacher-Student Centre)",
  "Science Complex & Cafeteria",
  "Curzon Hall Quad",
  "Engineering Faculty Gate",
  "Arts Faculty Lawn",
];

export const CUISINE_CATEGORIES = [
  "All",
  "Biryani & Rice",
  "Burgers & Fast Food",
  "Healthy & Bowls",
  "Snacks & Chaat",
  "Drinks & Juices",
  "Bakery & Sweets",
  "Breakfast",
];
