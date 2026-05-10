import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, getDocs, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Plus, Trash2 } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

export default function TagsManagement() {
  const [tags, setTags] = useState<any[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "tags"));
    return onSnapshot(q, (snap) => {
      setTags(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "tags"));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      await addDoc(collection(db, "tags"), { name: newTag.trim(), createdAt: new Date().toISOString() });
      setNewTag("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "tags");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const postsQuery = query(collection(db, "posts"), where("tags", "array-contains", name));
      const snap = await getDocs(postsQuery);
      if (!snap.empty) {
        alert("Cannot delete tag because it is used by one or more posts.");
        return;
      }
      if (confirm("Delete this tag?")) {
        await deleteDoc(doc(db, "tags", id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tags/${id}`);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900 dark:text-white">Tag Management</h1>
        <p className="text-slate-500 italic mt-2">Manage tags for your posts.</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-4">
        <input 
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="New Tag Name"
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white"
        />
        <button type="submit" className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800">
          <Plus size={16} /> Add
        </button>
      </form>

      {loading ? (
        <div>Loading tags...</div>
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
              {tags.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800/50">
                  <td className="py-4 px-6 font-medium text-slate-900 dark:text-white block truncate max-w-[150px] md:max-w-none">{t.name}</td>
                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleDelete(t.id, t.name)} className="text-slate-400 hover:text-red-500">
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
