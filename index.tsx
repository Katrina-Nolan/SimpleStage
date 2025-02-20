import { useEffect, useState } from "react";

interface Item {
  id: number;
  name: string;
  description: string;
  barcode: string;
  quantity: number;
  photo_url: string;
  missing?: boolean;
  damaged?: boolean;
  notes?: string;
}

export default function InventoryDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newItem, setNewItem] = useState<Omit<Item, "id">>({
    name: "",
    description: "",
    barcode: "",
    quantity: 0,
    photo_url: "",
    missing: false,
    damaged: false,
    notes: "",
  });

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("http://localhost:5000/items");
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    fetchItems();
  }, []);

  // Updates an item by sending a PUT request
  const updateItem = async (updatedItem: Item) => {
    try {
      const res = await fetch(`http://localhost:5000/items/${updatedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error updating item:", errorText);
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const updatedData = await res.json();
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === updatedData.id ? updatedData : item
        )
      );
      setEditingItem(null);
    } catch (error) {
      console.error("Error in updateItem:", error);
    }
  };

  // Toggle missing or damaged status exclusively and update the item
  const handleMissingOrDamaged = async (
    id: number,
    type: "missing" | "damaged"
  ) => {
    const item = items.find((item) => item.id === id);
    if (!item) return;

    // Toggle the selected type
    const newValue = !item[type];

    // Build updated item, ensuring only one status is active
    const updatedItem: Item = {
      ...item,
      [type]: newValue,
      ...(type === "missing" ? { damaged: false } : { missing: false }),
      notes: newValue ? "Updated status" : "",
    };

    // Persist the update via the PUT endpoint
    await updateItem(updatedItem);
  };

  // Adds a new item by sending a POST request
  const addItem = async () => {
    try {
      const res = await fetch("http://localhost:5000/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error adding item:", errorText);
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const createdItem = await res.json();
      setItems((prevItems) => [...prevItems, createdItem]);

      // Reset newItem form
      setNewItem({
        name: "",
        description: "",
        barcode: "",
        quantity: 0,
        photo_url: "",
        missing: false,
        damaged: false,
        notes: "",
      });
    } catch (error) {
      console.error("Error in addItem:", error);
    }
  };

  // Filter items based on search
  const filteredItems = items.filter((item) =>
    [item.name, item.description, item.barcode, item.notes]
      .map((field) => field?.toString().toLowerCase() || "")
      .some((field) => field.includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Inventory Dashboard</h1>

      {/* Add New Item Form */}
      <div className="mb-6 p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
        <input
          type="text"
          placeholder="Name"
          className="p-2 mb-4 w-full border rounded"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          className="p-2 mb-4 w-full border rounded"
          value={newItem.description}
          onChange={(e) =>
            setNewItem({ ...newItem, description: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Barcode"
          className="p-2 mb-4 w-full border rounded"
          value={newItem.barcode}
          onChange={(e) =>
            setNewItem({ ...newItem, barcode: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Quantity"
          className="p-2 mb-4 w-full border rounded"
          value={newItem.quantity}
          onChange={(e) =>
            setNewItem({
              ...newItem,
              quantity: Math.max(0, Number(e.target.value)),
            })
          }
        />
        <input
          type="text"
          placeholder="Photo URL"
          className="p-2 mb-4 w-full border rounded"
          value={newItem.photo_url}
          onChange={(e) =>
            setNewItem({ ...newItem, photo_url: e.target.value })
          }
        />
        <button
          onClick={addItem}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Add Item
        </button>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search items..."
        className="p-2 border rounded w-full mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Display Inventory Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white p-4 shadow rounded-lg hover:shadow-lg transition duration-200">
            <img src={item.photo_url} alt={item.name} className="w-full h-40 object-cover rounded" />
            <h2 className="text-lg font-semibold mt-2">{item.name}</h2>
            <p className="text-gray-600">{item.description}</p>
            <p className="text-gray-700 font-bold">Barcode: {item.barcode}</p>
            <p className={item.quantity > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
              Stock: {item.quantity}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setEditingItem(item)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
              >
                ✏️ Edit
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleMissingOrDamaged(item.id, "missing")}
                className={`${item.missing ? "bg-orange-500" : "bg-gray-500"} text-white px-4 py-2 rounded-lg`}
              >
                Missing
              </button>
              <button
                onClick={() => handleMissingOrDamaged(item.id, "damaged")}
                className={`${item.damaged ? "bg-orange-500" : "bg-gray-500"} text-white px-4 py-2 rounded-lg`}
              >
                Damaged
              </button>
            </div>
            {editingItem?.id === item.id && (
              <div className="mt-4 p-4 bg-white shadow-md rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Edit Item</h2>
                <input
                  type="text"
                  placeholder="Name"
                  className="p-2 mb-4 w-full border rounded"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Description"
                  className="p-2 mb-4 w-full border rounded"
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Barcode"
                  className="p-2 mb-4 w-full border rounded"
                  value={editingItem.barcode}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, barcode: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  className="p-2 mb-4 w-full border rounded"
                  value={editingItem.quantity}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      quantity: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
                <textarea
                  placeholder="Notes"
                  className="p-2 mb-4 w-full border rounded"
                  value={editingItem.notes || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, notes: e.target.value })
                  }
                />
                <button
                  onClick={() => updateItem(editingItem)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 ml-2"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}