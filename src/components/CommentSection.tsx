import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { trackEvent } from "../lib/analytics";
import {
  PlusCircle,
  ImageIcon,
  UserCircle,
  Check,
  X,
  Plus,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function CommentForm({
  postId,
  parentId = null,
  replyingToName = null,
  onSuccess,
  onCancel,
}: {
  postId: string;
  parentId?: string | null;
  replyingToName?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const { user, profile } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [uploadTab, setUploadTab] = useState<"upload" | "url">("upload");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload?path=posts/comments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setImageUrl(data.url);
      setShowUploadPopup(false);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setLoading(true);

    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        postId,
        authorId: user.uid,
        authorName: profile?.displayName || "Anonymous",
        authorPhotoURL: profile?.photoURL || "",
        content: replyingToName ? `@${replyingToName} ${newComment}` : newComment,
        imageUrl: imageUrl.trim() || null,
        parentId: parentId || null,
        status: "pending",
        likesCount: 0,
        createdAt: serverTimestamp(),
      });
      trackEvent("Engagement", "Comment", postId);
      setNewComment("");
      setImageUrl("");
      if (onSuccess) onSuccess();
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `posts/${postId}/comments`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 ${parentId ? "mt-4" : "mb-12"}`}
    >
      {replyingToName && (
        <div className="mb-4 flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Replying to {replyingToName}
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white"
            >
              <PlusCircle className="rotate-45" size={14} />
            </button>
          )}
        </div>
      )}
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="What are your thoughts?"
        autoFocus={!!parentId}
        className="w-full bg-transparent border-none outline-none text-sm font-serif min-h-[80px] resize-none dark:text-slate-200"
      />
      {newComment.length > 280 && (
        <div className="text-right mt-1 mb-2">
          <span className="text-xs text-red-500 font-bold">
            {280 - newComment.length} characters remaining
          </span>
        </div>
      )}
      {imageUrl && (
        <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
          <img
            src={imageUrl}
            className="w-full h-full object-cover"
            alt="Preview"
          />
          <button
            type="button"
            onClick={() => setImageUrl("")}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
          >
            <PlusCircle className="rotate-45" size={10} />
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
        <div className="relative flex items-center gap-4 text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setShowUploadPopup(!showUploadPopup)}
            className="hover:text-black dark:hover:text-white transition-colors"
            title="Add Image"
          >
            <ImageIcon size={18} />
          </button>

          <AnimatePresence>
            {showUploadPopup && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-8 left-0 z-10 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-4"
              >
                <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => setUploadTab("upload")}
                    className={`flex-1 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-colors ${
                      uploadTab === "upload"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadTab("url")}
                    className={`flex-1 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-colors ${
                      uploadTab === "url"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Link
                  </button>
                </div>

                {uploadTab === "upload" ? (
                  <label className="flex items-center justify-center p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                    <span className="text-xs font-bold text-slate-500">
                      {isUploadingImage
                        ? "Uploading..."
                        : "Click to select image"}
                    </span>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Paste image URL here..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 ring-indigo-500/20 dark:text-white"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUploadPopup(false)}
                      className="w-full bg-black dark:bg-white dark:text-black text-white text-[10px] font-black tracking-widest uppercase py-2 rounded-xl"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
               type="button"
               onClick={onCancel}
               className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-6 py-2 rounded-full text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all font-sans"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="bg-black dark:bg-white dark:text-black text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-50 font-sans"
          >
            {loading ? "Sending..." : parentId ? "Reply" : "Respond"}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  postId,
  replies = [],
  depth = 0,
  activeReplyId,
  setActiveReplyId,
}: {
  key?: React.Key;
  comment: any;
  postId: string;
  replies?: any[];
  depth?: number;
  activeReplyId: string | null;
  setActiveReplyId: (id: string | null) => void;
}) {
  const { user, isAdmin } = useAuth();
  
  const likeComment = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "posts", postId, "comments", comment.id), {
        likesCount: (comment.likesCount || 0) + 1,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `posts/${postId}/comments/${comment.id}`
      );
    }
  };

  const deleteComment = async () => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to permanently delete this comment?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", comment.id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `posts/${postId}/comments/${comment.id}`
      );
    }
  };

  const updateStatus = async (status: string) => {
    if (!isAdmin && status !== "flagged") return;
    try {
      await updateDoc(doc(db, "posts", postId, "comments", comment.id), {
        status,
        flaggedAt: status === "flagged" ? serverTimestamp() : null,
      });
      if (status === "flagged") trackEvent("Engagement", "Flag_Comment", comment.id);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `posts/${postId}/comments/${comment.id}`
      );
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const username = part.substring(1);
        return (
          <button
            key={i}
            onClick={() => trackEvent("Engagement", "Mention_Click", username)}
            className="text-indigo-600 font-bold hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 px-1 rounded font-sans"
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  const isReplying = activeReplyId === comment.id;

  return (
    <div className={`${depth > 0 ? "ml-4 md:ml-10 mt-3 border-l-2 border-slate-100 dark:border-slate-800 pl-4 md:pl-6" : "mt-4"}`}>
      <div
        className={`group p-4 rounded-2xl transition-all bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 shadow-sm ${
          comment.status === "flagged"
            ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
            : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-50 dark:border-slate-800 shrink-0">
              {comment.authorPhotoURL ? (
                <img src={comment.authorPhotoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={32} className="text-slate-700 dark:text-slate-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                  {comment.authorName}
                </h5>
                {isAdmin && (
                  <span
                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full font-sans ${
                      comment.status === "approved"
                        ? "bg-emerald-50 text-emerald-600"
                        : comment.status === "rejected"
                        ? "bg-red-50 text-red-600"
                        : comment.status === "pending" || !comment.status
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {comment.status || "pending"}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest font-sans">
                {comment.createdAt?.toDate().toLocaleDateString() || "Just now"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-1">
                {comment.status === "flagged" && (
                  <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-100 px-2 py-0.5 rounded-full mr-2">
                    Flagged for Review
                  </span>
                )}
                {comment.status !== "approved" && (
                  <button onClick={() => updateStatus("approved")} className="text-emerald-400 hover:text-emerald-600 transition-colors" title="Approve">
                    <Check size={14} />
                  </button>
                )}
                {comment.status !== "rejected" && (
                  <button onClick={() => updateStatus("rejected")} className="text-red-400 hover:text-red-600 transition-colors" title="Reject">
                    <X size={14} />
                  </button>
                )}
                <button onClick={deleteComment} className="text-slate-500 dark:text-slate-300 hover:text-slate-500 transition-colors" title="Delete">
                  <PlusCircle className="rotate-45" size={16} />
                </button>
              </div>
            )}
            {!isAdmin && comment.status !== "flagged" && (
              <button onClick={() => updateStatus("flagged")} className="text-slate-500 dark:text-slate-300 hover:text-red-500 transition-colors" title="Flag Comment">
                <Flag size={14} />
              </button>
            )}
            <MoreHorizontal size={16} className="text-slate-500 dark:text-slate-300 cursor-pointer hover:text-black dark:hover:text-white" />
          </div>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif mb-4 whitespace-pre-wrap">
          {renderContent(comment.content)}
        </p>
        {comment.imageUrl && (
          <div className="mb-4 max-w-sm rounded-2xl overflow-hidden shadow-xl shadow-black/5">
            <img src={comment.imageUrl} className="w-full h-auto" alt="Shared" referrerPolicy="no-referrer" />
          </div>
        )}
        <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400">
          <button
            onClick={likeComment}
            className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full transition-colors group/like text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-sans"
          >
            <ThumbsUp size={14} className="group-hover/like:-translate-y-0.5 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
              {comment.likesCount || 0} Likes
            </span>
          </button>
          {user && depth < 3 && (
            <button
              onClick={() => setActiveReplyId(isReplying ? null : comment.id)}
              className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full transition-colors text-slate-500 hover:text-black dark:hover:text-white font-sans"
            >
              <MessageCircle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
                Reply
              </span>
            </button>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CommentForm 
              postId={postId} 
              parentId={comment.id} 
              replyingToName={comment.authorName}
              onSuccess={() => setActiveReplyId(null)}
              onCancel={() => setActiveReplyId(null)}
            />
         </motion.div>
        )}
      </AnimatePresence>

      {replies.length > 0 && (
        <div className="replies-container">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              replies={reply.children}
              depth={depth + 1}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ 
  postId,
  onAuth
}: { 
  postId: string;
  onAuth: () => void;
}) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "likes">("newest");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);
  
  const [visibleCount, setVisibleCount] = useState(10);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const allComments = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(allComments);
        setInitialFetchLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `posts/${postId}/comments`);
      }
    );
    return () => unsub();
  }, [postId]);

  const treeData = useMemo(() => {
    let filtered = [...comments];

    if (!isAdmin) {
      filtered = filtered.filter((c) => c.status === "approved" || !c.status);
    } else if (filterStatus !== "all") {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    const commentMap = new Map();
    filtered.forEach(c => commentMap.set(c.id, { ...c, children: [] }));

    const topLevel: any[] = [];
    filtered.forEach(c => {
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId).children.push(commentMap.get(c.id));
      } else {
        topLevel.push(commentMap.get(c.id));
      }
    });

    topLevel.sort((a, b) => {
      if (sortBy === "newest") return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === "oldest") return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      if (sortBy === "likes") return (b.likesCount || 0) - (a.likesCount || 0);
      return 0;
    });

    // Sort children chronologically so replies read naturally
    commentMap.forEach(v => {
      v.children.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    });

    return topLevel;
  }, [comments, sortBy, filterStatus, isAdmin]);

  const visibleTopLevelComments = treeData.slice(0, visibleCount);
  const totalCount = comments.filter(c => isAdmin ? (filterStatus === "all" || c.status === filterStatus) : (c.status === "approved" || !c.status)).length;

  return (
    <div className="mt-20 pt-16 border-t border-slate-100 dark:border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h3 className="text-2xl font-serif font-black flex items-center gap-3">
          Responses{" "}
          <span className="text-slate-500 dark:text-slate-300 italic font-medium">
            ({totalCount})
          </span>
        </h3>

        <div className="flex flex-wrap items-center gap-3 font-sans">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
            <button onClick={() => setSortBy("newest")} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === "newest" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-600"}`}>Newest</button>
            <button onClick={() => setSortBy("oldest")} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === "oldest" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-600"}`}>Oldest</button>
            <button onClick={() => setSortBy("likes")} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === "likes" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-600"}`}>Popular</button>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1 bg-indigo-50/50 dark:bg-indigo-900/20 p-1 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              {["all", "pending", "approved", "rejected"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? "bg-indigo-600 text-white shadow-sm" : "text-indigo-400 hover:text-indigo-600"}`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {user ? (
        <CommentForm postId={postId} />
      ) : (
        <div className="mb-12 p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] text-center">
          <p className="text-sm text-slate-500 font-serif mb-6 italic">Sign in to join the conversation.</p>
          <button 
            onClick={onAuth}
            className="bg-black dark:bg-white dark:text-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[0.98] transition-all"
          >
            Sign In Now
          </button>
        </div>
      )}

      {initialFetchLoading ? (
        <div className="space-y-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 rounded-[32px] animate-pulse border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
              <div className="w-full h-12 bg-slate-100 dark:bg-slate-800/50 rounded-2xl mb-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleTopLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              replies={comment.children}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
            />
          ))}
          
          {visibleCount < treeData.length && (
            <div className="pt-8 flex justify-center">
               <button 
                 onClick={() => setVisibleCount(c => c + 10)}
                 className="px-6 py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
               >
                 Show more comments
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
