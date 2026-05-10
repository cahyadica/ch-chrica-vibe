import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, getDocs, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Plus, Trash2 } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCat, setNewCat] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "categories"));
    return onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "categories"));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      await addDoc(collection(db, "categories"), { name: newCat.trim(), createdAt: new Date().toISOString() });
      setNewCat("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "categories");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // Check if category is used
    try {
      const postsQuery = query(collection(db, "posts"), where("category", "==", name));
      const snap = await getDocs(postsQuery);
      if (!snap.empty) {
        alert("Cannot delete category because it is used by one or more posts. You can soft-delete or reassign posts first.");
        return;
      }
      if (confirm("Delete this category?")) {
        await deleteDoc(doc(db, "categories", id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900 dark:text-white">Category Management</h1>
        <p className="text-slate-500 italic mt-2">Manage categories for your posts.</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-4">
        <input 
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="New Category Name"
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white"
        />
        <button type="submit" className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800">
          <Plus size={16} /> Add
        </button>
      </form>

      {loading ? (
        <div>Loading categories...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500">
                <th className="font-bold py-4 px-6">Name</th>
                <th className="font-bold py-4 px-6 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/50">
                  <td className="py-4 px-6 font-medium text-slate-900 dark:text-white block truncate max-w-[150px] md:max-w-none">{c.name}</td>
                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleDelete(c.id, c.name)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
