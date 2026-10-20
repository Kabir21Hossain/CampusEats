"use client";

import React, { useState, useEffect } from "react";
import { menuService } from "@/services/menu-service";
import { CUISINE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Clock,
  Check,
  Power,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";

export default function ShopOwnerMenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    priceBDT: "",
    category: CUISINE_CATEGORIES[1],
    preparationTimeMinutes: 15,
    description: "",
    photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
    dietary: ["Halal"],
  });

  const loadMenu = () => {
    setLoading(true);
    menuService.listMenuItems("shop-1").then((res) => {
      if (res.success) setItems(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleToggleAvailability = async (item) => {
    const res = await menuService.updateMenuItem(item.id, {
      isAvailable: !item.isAvailable,
    });
    if (res.success) {
      toast.success(
        res.data.isAvailable
          ? `${item.name} is now marked IN STOCK`
          : `${item.name} marked as OUT OF STOCK`
      );
      loadMenu();
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      const res = await menuService.deleteMenuItem(itemId);
      if (res.success) {
        toast.info("Item deleted from canteen menu.");
        loadMenu();
      }
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.priceBDT) {
      toast.error("Please provide both name and price");
      return;
    }

    const res = await menuService.createMenuItem({
      ...newItem,
      shopId: "shop-1",
      priceBDT: Number(newItem.priceBDT),
      preparationTimeMinutes: Number(newItem.preparationTimeMinutes) || 10,
    });

    if (res.success) {
      toast.success("New menu item created!");
      setShowAddModal(false);
      setNewItem({
        name: "",
        priceBDT: "",
        category: CUISINE_CATEGORIES[1],
        preparationTimeMinutes: 15,
        description: "",
        photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
        dietary: ["Halal"],
      });
      loadMenu();
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Menu Item Management
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Add items, update prices, and toggle real-time stock availability
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowAddModal(true)}
          className="rounded-xl font-bold text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Menu Item</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading menu items...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu items listed"
          description="Create your first meal or beverage item to make it available for campus ordering."
          actionText="Add New Item"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4 flex gap-4 items-center">
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="h-20 w-20 rounded-xl object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-800"
                />

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {item.name}
                    </h4>
                    <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400 shrink-0">
                      {formatCurrency(item.priceBDT)}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="neutral" size="sm" className="text-[10px]">
                      {item.category}
                    </Badge>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.preparationTimeMinutes}m
                    </span>
                  </div>
                </div>

                {/* Stock Toggle & Delete */}
                <div className="flex flex-col items-end gap-2 shrink-0 border-l border-zinc-100 dark:border-zinc-800 pl-3">
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(item)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      item.isAvailable
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                    }`}
                  >
                    {item.isAvailable ? "In Stock" : "Sold Out"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Menu Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Menu Item"
        description="Add a meal or beverage to your campus canteen menu"
      >
        <form onSubmit={handleCreateItem} className="space-y-4 text-left">
          <Input
            label="Item Title"
            placeholder="e.g. Crispy Chicken Burger"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (BDT ৳)"
              type="number"
              placeholder="e.g. 180"
              value={newItem.priceBDT}
              onChange={(e) => setNewItem({ ...newItem, priceBDT: e.target.value })}
              required
            />

            <Input
              label="Prep Time (Minutes)"
              type="number"
              placeholder="e.g. 15"
              value={newItem.preparationTimeMinutes}
              onChange={(e) =>
                setNewItem({ ...newItem, preparationTimeMinutes: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Food Category
            </label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs"
            >
              {CUISINE_CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Ingredients, toppings, or special flavor notes..."
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <Input
            label="Image URL"
            placeholder="https://..."
            value={newItem.photoUrl}
            onChange={(e) => setNewItem({ ...newItem, photoUrl: e.target.value })}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full rounded-xl font-bold">
            Add to Canteen Menu
          </Button>
        </form>
      </Modal>
    </div>
  );
}
