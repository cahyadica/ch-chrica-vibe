import CommentSection from "./components/CommentSection";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import Cropper from "react-easy-crop";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  PlusCircle,
  Search,
  Bell,
  CheckCircle,
  UserCircle,
  User,
  Bookmark,
  ThumbsUp,
  MessageCircle,
  Share2,
  Link,
  Facebook,
  Twitter,
  Linkedin,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  MoreHorizontal,
  LogOut,
  Settings,
  Mail,
  Zap,
  Clock,
  ArrowUpRight,
  PenSquare,
  BookOpen,
  LayoutDashboard,
  FileText,
  ShoppingBag,
  ShoppingCart,
  ExternalLink,
  Download,
  Globe,
  Gift,
  CreditCard,
  DollarSign,
  Users,
  ShieldCheck,
  Activity,
  SearchCheck,
  ImageIcon,
  MessageSquare,
  RotateCcw,
  Layers,
  Edit,
  Eye,
  Trash2,
  Flag,
  Key,
  EyeOff,
  Shield,
  Lock,
  Check,
  X,
  Upload,
  Sun,
  Moon,
  AlertTriangle,
  Plus,
  Edit3,
  MinusCircle,
  BarChart3,
  Terminal,
  Code2,
  Database,
  History,
  MousePointer2,
  Filter,
  ArrowUpDown,
  Star,
  MoreVertical,
  ChevronDown,
  Home,
  AlertCircle,
  Instagram,
  Apple,
  FolderTree,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { loginWithGoogle, loginWithEmail, signupWithEmail, logoutUser, db, storage } from "./lib/firebase";
import { LoginModal, SignupModal } from "./components/AuthModals";
import { handleFirestoreError, OperationType } from "./lib/firestore-errors";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  addDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  collectionGroup,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { initGA, trackPageView, trackEvent } from "./lib/analytics";

// --- Types ---
type ViewState =
  | "feed"
  | "story"
  | "write"
  | "profile"
  | "admin"
  | "about"
  | "products"
  | "privacy"
  | "terms";
type AdminPage =
  | "dashboard"
  | "posts"
  | "products"
  | "ads"
  | "authors"
  | "comments"
  | "roles"
  | "post-detail"
  | "api-mgmt"
  | "api-docs"
  | "subscriptions"
  | "integrations"
  | "categories"
  | "tags";

const API_PERMISSIONS = [
  {
    id: "api:analytics",
    label: "Analytics Pipeline",
    description: "Allows read-only access to traffic and user event metrics.",
    category: "API Access",
  },
  {
    id: "api:marketing",
    label: "Ad Placements",
    description:
      "Enables control over ad campaign creation and budget allocation.",
    category: "API Access",
  },
  {
    id: "api:digital-product",
    label: "Digital Product",
    description: "Manage digital assets, stock levels, and supply chain nodes",
    category: "Digital Product",
  },
  {
    id: "api:ads-management",
    label: "Ads Management",
    description: "Configure programmatic ad serving and mediation",
    category: "Ads Management",
  },
  {
    id: "api:post-service",
    label: "Post Management Service",
    description: "CRUD operations on content library via RESTful interface",
    category: "Content Management",
  },
  {
    id: "api:content",
    label: "Editorial Content",
    description: "Publish and modify editorial stories and articles",
    category: "Content Management",
  },
  {
    id: "vault:manage",
    label: "Vault Access",
    description: "Provision and revoke API keys",
    category: "Security",
  },
];

// --- Components ---

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

function Navbar({
  onWrite,
  onNavigate,
  onAuth,
  searchQuery,
  onSearchChange,
  selectedCategories,
  setSelectedCategories,
}: {
  onWrite: () => void;
  onNavigate: (v: ViewState) => void;
  onAuth: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (c: string[]) => void;
}) {
  const { user, profile, isAdmin } = useAuth();
  
  useEffect(() => {
    console.log("Global Auth State:", { user, profile, isAdmin });
  }, [user, profile, isAdmin]);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const categories = [
    "All",
    "Technology",
    "Business",
    "Life",
    "Finance",
    "Crypto",
    "Web3",
    "Growth",
  ];

  const toggleCategory = (cat: string) => {
    setSelectedCategories([cat]);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-colors bg-white/80 border-b border-black/5 dark:bg-black/80 dark:border-white/5 backdrop-blur-md`}
    >
      <div className="h-16 px-4 md:px-20 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <div
            onClick={() => {
              onNavigate("feed");
              setSelectedCategories(["All"]);
              onSearchChange("");
            }}
            className="text-3xl font-serif font-black tracking-tighter cursor-pointer select-none text-slate-900 dark:text-white"
          >
            Chrica<span className="text-indigo-600">.</span>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full px-4 h-10 w-64 focus-within:border-indigo-200 transition-all">
            <Search size={16} className="text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search stories..."
              className="bg-transparent border-none text-sm outline-none w-full dark:text-white"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <ThemeToggle />

          <button
            onClick={() => onNavigate("products")}
            className={`flex items-center gap-2 transition-colors ${selectedCategories.includes("Products") ? "text-indigo-600" : "text-slate-500 hover:text-black dark:hover:text-white"}`}
          >
            <ShoppingBag size={20} />
            <span className="text-sm hidden sm:inline">Product</span>
          </button>

          <button
            onClick={() => onNavigate("about")}
            className="text-slate-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">About</span>
          </button>

          {user && (isAdmin || profile?.role === "author") && (
            <button
              onClick={onWrite}
              className="flex items-center gap-2 text-slate-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <PenSquare size={20} />
              <span className="text-sm hidden sm:inline">Write</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <Bell
                size={20}
                className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
              />
              <div className="relative flex items-center">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-600 transition-all flex items-center justify-center cursor-pointer focus:outline-none ring-offset-2 focus:ring-2 ring-indigo-500/20"
                >
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <UserCircle size={24} className="text-slate-500 dark:text-slate-400" />
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-3xl p-3 z-20 overflow-hidden"
                      >
                        <div className="px-4 py-3 mb-2 border-b border-slate-50 dark:border-white/5">
                          <p className="text-sm font-black text-slate-900 dark:text-white dark:text-white truncate">
                            {profile?.displayName || "User"}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                            {profile?.email}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              onNavigate("profile");
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-colors group"
                          >
                            <User
                              size={18}
                              className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 transition-colors"
                            />
                            <span className="font-medium">Profile</span>
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                onNavigate("admin");
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-sm text-indigo-600 flex items-center gap-3 transition-colors group"
                            >
                              <Shield
                                size={18}
                                className="text-indigo-400 group-hover:text-indigo-600 transition-colors"
                              />
                              <span className="font-bold">Admin Console</span>
                            </button>
                          )}

                          <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2"></div>

                          <button
                            onClick={() => {
                              logoutUser();
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl text-sm text-red-500 flex items-center gap-3 transition-colors group"
                          >
                            <LogOut
                              size={18}
                              className="text-red-400 group-hover:text-red-500 transition-colors"
                            />
                            <span className="font-bold">Sign out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <button
              onClick={onAuth}
              className="bg-black dark:bg-white dark:text-black text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Get started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function ShareModal({ story, onClose }: { story: any; onClose: () => void }) {
  const shareUrl = `${window.location.origin}/story/${story.id}`;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    {
      name: "Twitter",
      icon: Twitter,
      color: "text-[#1DA1F2]",
      bg: "bg-[#1DA1F2]/10",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(story.title)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-[#1877F2]",
      bg: "bg-[#1877F2]/10",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-[#0A66C2]",
      bg: "bg-[#0A66C2]/10",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "text-slate-600",
      bg: "bg-slate-100",
      href: `mailto:?subject=${encodeURIComponent(story.title)}&body=${encodeURIComponent(shareUrl)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden p-8 md:p-12"
      >
        <div className="mb-8">
          <h3 className="text-3xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            Share <span className="italic">Story</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">
            Invite others into the conversation
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1">
              Direct Link
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent border-none text-xs font-medium text-slate-600 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                {copied ? <ShieldCheck size={12} /> : <Link size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {platforms.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${p.bg} ${p.color} flex items-center justify-center transition-all group-hover:scale-110`}
                >
                  <p.icon size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {p.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 dark:text-white dark:hover:text-white transition-all"
        >
          Close Panel
        </button>
      </motion.div>
    </div>
  );
}

function AdUnit({
  placement,
  targetPage = "home",
  category = "All",
  className = "",
}: {
  placement: string;
  targetPage?: "home" | "post";
  category?: string;
  className?: string;
}) {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    let q = query(
      collection(db, "ads"),
      where("placement", "==", placement),
      where("targetPage", "==", targetPage),
      where("active", "==", true),
    );

    if (targetPage === "post" && category !== "All") {
      // In a real app we might use 'where category in [selected, All]' but Firestore needs index
      // For now we fetch and filter in-memory if needed, or query specifically
      // Let's assume the user can target 'All' or a specific category
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          // Filter by category if on post page
          let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);
          if (targetPage === "post" && category !== "All") {
            docs = docs.filter(
              (d) =>
                d.targetCategory === "All" || d.targetCategory === category,
            );
          }

          if (docs.length > 0) {
            const adData = docs[Math.floor(Math.random() * docs.length)];
            setAd(adData);
            // Track Impression (silent)
            updateDoc(doc(db, "ads", adData.id), {
              impressions: (adData.impressions || 0) + 1,
            }).catch((err) =>
              handleFirestoreError(
                err,
                OperationType.UPDATE,
                `ads/${adData.id}`,
              ),
            );
          } else {
            setAd(null);
          }
        } else {
          setAd(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, "ads"),
    );

    return () => unsub();
  }, [placement, targetPage, category]);

  const handleAdClick = async () => {
    if (!ad) return;
    try {
      await updateDoc(doc(db, "ads", ad.id), {
        clicks: (ad.clicks || 0) + 1,
      });
      if (ad.url) {
        window.open(ad.url, "_blank");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ads/${ad.id}`);
    }
  };

  if (!ad) return null;

  return (
    <div
      className={`overflow-hidden rounded-[32px] border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 transition-all ${className}`}
    >
      {ad.type === "image" ? (
        <div onClick={handleAdClick} className="cursor-pointer group relative">
          <img
            src={
              ad.imageUrl ||
              "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1600"
            }
            alt={ad.name}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">
            Sponsored
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
            Advertisement
          </div>
          <div dangerouslySetInnerHTML={{ __html: ad.code }} />
        </div>
      )}
    </div>
  );
}

function FeaturedCarousel({
  stories,
  onStoryClick,
}: {
  stories: any[];
  onStoryClick: (s: any) => void;
}) {
  const [index, setIndex] = useState(0);
  const featured = stories
    .filter((s) => s.featured || s.category === "Technology")
    .slice(0, 5);

  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) return null;

  return (
    <div className="relative h-[450px] md:h-[600px] w-full overflow-hidden rounded-[2rem] md:rounded-[3rem] mb-10 md:mb-20 group shadow-2xl shadow-indigo-900/10">
      <AnimatePresence mode="wait">
        <motion.div
          key={featured[index].id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 cursor-pointer"
          onClick={() => onStoryClick(featured[index])}
        >
          <img
            src={
              featured[index].imageUrl ||
              "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1600"
            }
            className="w-full h-full object-cover"
            alt={featured[index].title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8 md:p-20">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full inline-block shadow-lg shadow-indigo-600/30">
                  Top Manuscript
                </span>
                <span className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">
                  •
                </span>
                <span className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em]">
                  {featured[index].category}
                </span>
              </div>

              <h2 className="text-4xl md:text-7xl font-serif font-black text-white leading-[1.05] tracking-tighter mb-6">
                {featured[index].title}
              </h2>

              <p className="text-slate-500 dark:text-slate-300 text-lg md:text-xl font-serif italic max-w-2xl line-clamp-2 opacity-80 mb-10 leading-relaxed">
                {featured[index].excerpt}
              </p>

              <div className="flex items-center gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden ring-4 ring-white/5">
                    <img
                      src={
                        featured[index].authorPhotoURL ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(featured[index].authorName || "User")}`
                      }
                      alt={featured[index].authorName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-none mb-1">
                      {featured[index].authorName}
                    </p>
                    <p className="text-white/40 text-[9px] uppercase font-black tracking-widest">
                      Master Contributor
                    </p>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10 mx-2" />
                <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group/btn">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Read Full Article
                  </span>
                  <ArrowRight
                    size={14}
                    className="group-hover/btn:translate-x-1 transition-transform"
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const el = document.getElementById("subscribe-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-6 py-3 ml-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-black/20"
                >
                  Subscribe Now
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute bottom-12 right-12 flex items-center gap-6 z-20">
        <div className="flex gap-3">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className="relative group p-2"
            >
              <div
                className={`h-1 rounded-full transition-all duration-700 ${i === index ? "w-12 bg-white" : "w-2 bg-white/20 group-hover:bg-white/40"}`}
              />
              {i === index && (
                <motion.div
                  layoutId="active-progress"
                  className="absolute inset-0 flex items-center"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 8, ease: "linear" }}
                    className="h-1 bg-indigo-400 rounded-full"
                  />
                </motion.div>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex(
                (prev) => (prev - 1 + featured.length) % featured.length,
              );
            }}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev + 1) % featured.length);
            }}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SubscribeModule({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [weeklyDigest, setWeeklyDigest] = useState<boolean>(false);
  const CATEGORIES_LIST = [
    "Technology",
    "Business",
    "Life",
    "Finance",
    "Crypto",
    "Web3",
    "Growth",
    
  ];

  useEffect(() => {
    if (profile?.subscribedCategories) {
      setSelectedCats(profile.subscribedCategories);
    }
    if (typeof profile?.weeklyDigest === "boolean") {
      setWeeklyDigest(profile.weeklyDigest);
    }
  }, [profile]);

  const handleToggle = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          subscribedCategories: selectedCats,
          weeklyDigest: weeklyDigest,
        },
        { merge: true },
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "users");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <div className="space-y-6">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
          Newsletter Configuration
        </h4>

        <div
          className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between cursor-pointer"
          onClick={() => setWeeklyDigest(!weeklyDigest)}
        >
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white dark:text-white mb-1">
              Weekly Digest
            </p>
            <p className="text-[10px] text-slate-500 max-w-xs">
              Receive a curated summary of stories based on your selected
              categories straight to your inbox every Friday.
            </p>
          </div>
          <div
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${weeklyDigest ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"}`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${weeklyDigest ? "translate-x-6" : "translate-x-0"}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {CATEGORIES_LIST.map((cat) => (
            <button
              key={cat}
              onClick={() => handleToggle(cat)}
              className={`p-4 rounded-3xl border text-left transition-all ${
                selectedCats.includes(cat)
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest mb-1">
                {cat}
              </div>
              <div
                className={`text-[9px] ${selectedCats.includes(cat) ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"}`}
              >
                {selectedCats.includes(cat) ? "Following" : "Follow"}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[0.98] active:scale-95 transition-all"
        >
          {loading
            ? "Saving Preferences..."
            : success
              ? "Preferences Saved"
              : "Update Subscriptions"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-10 bg-black dark:bg-white rounded-[3rem] text-white dark:text-black shadow-2xl shadow-indigo-900/10 dark:shadow-black/10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-slate-50 flex items-center justify-center">
          <Bell size={24} className="text-white dark:text-black" />
        </div>
        <div>
          <h4 className="text-xl font-serif font-black tracking-tight leading-none">
            Stay <span className="italic">Inspired.</span>
          </h4>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">
            Weekly Manuscripts
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-8 font-serif italic leading-relaxed">
        The most compelling stories from our top contributors, curated for your
        specific interests.
      </p>

      <div className="flex flex-wrap gap-2 mb-10">
        {["Technology", "Business", "Finance", "Crypto"].map((cat) => (
          <button
            key={cat}
            onClick={() => handleToggle(cat)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
              selectedCats.includes(cat)
                ? "bg-white text-black border-white"
                : "bg-transparent text-white/50 border-white/10 hover:border-white/30"
            } dark:${selectedCats.includes(cat) ? "bg-black text-white border-black" : "bg-transparent text-black/50 border-black/10 hover:border-black/30"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
          success
            ? "bg-indigo-500 text-white"
            : "bg-white dark:bg-black text-black dark:text-white"
        } hover:scale-[0.98] active:scale-95`}
      >
        {loading
          ? "Processing..."
          : success
            ? "Subscribed Successfully"
            : "Join Weekly Reader"}
      </button>
    </div>
  );
}

function StorySkeleton() {
  return (
    <div className="break-inside-avoid flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
      <div className="aspect-video bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="w-full h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
          <div className="w-4/5 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-full" />
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-full" />
          <div className="w-2/3 h-3 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-full" />
        </div>
        <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between">
          <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />
          <div className="flex gap-4">
            <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />
            <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryFeed({
  stories,
  onStoryClick,
  searchQuery,
  isAdmin,
  selectedCategories,
  setSelectedCategories,
  loading,
  onSearchChange,
}: {
  stories: any[];
  onStoryClick: (s: any) => void;
  searchQuery: string;
  isAdmin: boolean;
  selectedCategories: string[];
  setSelectedCategories: (c: string[]) => void;
  loading: boolean;
  onSearchChange: (q: string) => void;
}) {
  const [sharingStory, setSharingStory] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(query(collection(db, "categories")), (snap) => {
      setCategories(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, () => {});
  }, []);

  const filteredStories = stories.filter((story) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      story.title?.toLowerCase().includes(query) ||
      story.excerpt?.toLowerCase().includes(query) ||
      story.authorName?.toLowerCase().includes(query) ||
      story.category?.toLowerCase().includes(query) ||
      (story.tags &&
        story.tags.some((t: string) => t.toLowerCase().includes(query)));
    const matchesCategory =
      selectedCategories.includes("All") ||
      selectedCategories.includes(story.category);
    return matchesSearch && matchesCategory;
  });

  const CATEGORIES = ["All", ...categories.map((c) => c.name)];

  const toggleCategory = (cat: string) => {
    setSelectedCategories([cat]);
    if (cat === "All") onSearchChange("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-20 pt-32 pb-20">
      {/* Category Icons Bar - Now integrated above the feed */}
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pb-8 mb-8 border-b border-slate-50 dark:border-white/5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full transition-all border ${
              selectedCategories.includes(cat)
                ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg shadow-black/10"
                : "text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white border-transparent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Header for Home */}
      {!searchQuery &&
        selectedCategories.includes("All") &&
        (loading ? (
          <div className="relative h-[450px] md:h-[600px] w-full overflow-hidden rounded-[2rem] md:rounded-[3rem] mb-10 md:mb-20 bg-slate-50 dark:bg-slate-900 animate-pulse border border-slate-100 dark:border-slate-800">
            <div className="absolute inset-x-8 md:inset-x-20 bottom-8 md:bottom-20 space-y-6">
              <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="w-2/3 h-16 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              <div className="w-1/2 h-8 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </div>
          </div>
        ) : (
          <FeaturedCarousel stories={stories} onStoryClick={onStoryClick} />
        ))}

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Main News Content */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <h2 className="text-2xl font-serif font-black tracking-tight">
              Latest <span className="italic">Stories</span>
            </h2>
            {(searchQuery || !selectedCategories.includes("All")) && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                    Search: {searchQuery}
                  </span>
                )}
                {!selectedCategories.includes("All") &&
                  selectedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                    >
                      {cat} ×
                    </button>
                  ))}
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                  Found {filteredStories.length} results
                </div>
              </div>
            )}
          </div>

          <div className="columns-1 md:columns-2 gap-10 space-y-10">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <StorySkeleton key={i} />
                ))
              : filteredStories.map((story, i) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      duration: 0.8,
                      ease: [0.16, 1, 0.3, 1],
                      delay: (i % 4) * 0.05,
                    }}
                    className="break-inside-avoid group cursor-pointer flex flex-col bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all"
                    onClick={() => onStoryClick(story)}
                  >
                    <div className="aspect-video overflow-hidden relative">
                      <img
                        src={
                          story.imageUrl ||
                          "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1600"
                        }
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/80 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-800 dark:text-white border border-white/20">
                          {story.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-100">
                          <img
                            src={
                              story.authorPhotoURL ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName || "User")}`
                            }
                            alt={story.authorName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          {story.authorName}
                        </span>
                      </div>
                      <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white dark:text-white leading-tight mb-4 group-hover:text-indigo-600 transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 font-serif italic line-clamp-3 text-sm leading-relaxed mb-6">
                        {story.excerpt}
                      </p>

                      <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 dark:text-slate-600">
                          <span>
                            {new Date(
                              story.createdAt?.seconds * 1000,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span>{story.readTime || "5m"} read</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharingStory(story);
                            }}
                            className="hover:text-black dark:hover:text-white transition-colors"
                          >
                            <Share2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="hover:text-black dark:hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Bookmark size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
          </div>

          {filteredStories.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[4rem] p-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700 dark:text-slate-200">
                <Search size={24} />
              </div>
              <h3 className="text-xl font-serif font-black mb-2 text-slate-900 dark:text-white dark:text-white">
                No articles found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-serif italic text-sm">
                Try adjusting your filters or search query.
              </p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {sharingStory && (
            <ShareModal
              story={sharingStory}
              onClose={() => setSharingStory(null)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar Discovery */}
        <aside className="w-full lg:w-80 space-y-12">
          <div className="sticky top-24 space-y-12 pb-20">
            <div id="subscribe-section" className="mb-12">
              <SubscribeModule />
            </div>

            {/* This Week */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
                This Week
              </h4>
              <div className="space-y-6">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="w-2/3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full" />
                      </div>
                    ))
                  : stories.slice(0, 3).map((s) => (
                      <div key={`tw-${s.id}`} onClick={() => onStoryClick(s)} className="group cursor-pointer">
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-snug mb-2">
                          {s.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.authorName}</p>
                      </div>
                    ))}
              </div>
            </div>

            {/* Most Read */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
                Most Read
              </h4>
              <div className="space-y-6">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-4 animate-pulse">
                        <div className="text-2xl font-serif font-black text-slate-200 dark:text-slate-800">
                          0{i + 1}
                        </div>
                        <div className="flex-1 space-y-3 pt-2">
                          <div className="w-2/3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
                          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full" />
                        </div>
                      </div>
                    ))
                  : [...stories].sort((a,b) => (b.likesCount || 0) - (a.likesCount || 0)).slice(0, 4).map((s, i) => (
                      <div
                        key={`mr-${s.id}`}
                        onClick={() => onStoryClick(s)}
                        className="group cursor-pointer flex gap-4"
                      >
                        <div className="text-2xl font-serif font-black text-slate-300 dark:text-slate-800 tabular-nums">
                          0{i + 1}
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-snug mb-1">
                            {s.title}
                          </h5>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {s.authorName}
                          </span>
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            {/* Our Product Review */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
                Our Product Reviews
              </h4>
              <div className="space-y-4">
                {loading ? null : stories.filter(s => s.postType === "Product Review").slice(0, 3).map((s) => (
                   <div key={`pr-${s.id}`} onClick={() => onStoryClick(s)} className="group cursor-pointer bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-1 text-amber-500 mb-2">
                         <Star size={12} fill="currentColor" />
                         <span className="text-xs font-bold text-slate-900 dark:text-white">{s.reviewScore || 5}/5</span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 leading-snug line-clamp-2">{s.title}</h5>
                   </div>
                ))}
                {stories.filter(s => s.postType === "Product Review").length === 0 && !loading && (
                   <p className="text-xs italic text-slate-500">No product reviews yet.</p>
                )}
              </div>
            </div>

            <AdUnit placement="sidebar" targetPage="home" className="mt-12" />

            <div className="mt-12">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
                Hot Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggleCategory(c.name)}
                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategories.includes(c.name) ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white"}`}
                  >
                    {c.name}
                  </button>
                ))}
                {!selectedCategories.includes("All") && (
                  <button
                    onClick={() => setSelectedCategories(["All"])}
                    className="px-5 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full text-xs font-black uppercase tracking-widest border border-red-100 dark:border-red-900/50"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}

import ProductsSection from "./components/ProductsSection";

function RelatedStories({
  currentStoryId,
  category,
}: {
  currentStoryId: string;
  category: string;
}) {
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("status", "==", "published"),
      where("category", "==", category),
      limit(4),
    );
    return onSnapshot(q, (snap) => {
      setRelated(
        snap.docs
          .filter((d) => d.id !== currentStoryId)
          .map((d) => ({ id: d.id, ...d.data() }))
          .slice(0, 3),
      );
    });
  }, [currentStoryId, category]);

  if (related.length === 0) return null;

  return (
    <div className="mt-20 pt-20 border-t border-slate-50 dark:border-white/5">
      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 mb-8">
        Related Manuscripts
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {related.map((s) => (
          <div key={s.id} className="group cursor-pointer">
            <div className="aspect-video rounded-3xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-800">
              <img
                src={
                  s.featuredImage ||
                  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=600"
                }
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt={s.title}
                loading="lazy"
              />
            </div>
            <h5 className="text-sm font-serif font-black text-slate-900 dark:text-white dark:text-white group-hover:text-indigo-600 transition-colors leading-tight">
              {s.title}
            </h5>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReaderView({
  story,
  onBack,
  user,
  setIsAuthOpen,
}: {
  story: any;
  onBack: () => void;
  user: any;
  setIsAuthOpen: (o: boolean) => void;
}) {
  const [sharingStory, setSharingStory] = useState<any | null>(null);
  const { profile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followMessage, setFollowMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [localLikes, setLocalLikes] = useState(story.likesCount || 0);
  
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const isBookmarked = profile?.bookmarks?.includes(story.id) || false;

  useEffect(() => {
    if (profile?.followedAuthors?.includes(story.authorId)) {
      setIsFollowing(true);
    } else {
      setIsFollowing(false);
    }
  }, [profile, story.authorId]);

  const handleLikePost = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    if (isLikeLoading) return;
    setIsLikeLoading(true);

    // Optimistic update
    setLocalLikes((prev) => prev + 1);

    try {
      await updateDoc(doc(db, "posts", story.id), {
        likesCount: increment(1),
      });
      trackEvent("Engagement", "Like", story.id);
    } catch (err) {
      console.error("Failed to like post:", err);
      // Revert on failure
      setLocalLikes((prev) => prev - 1);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleBookmarkPost = async () => {
    if (!profile) {
      setIsAuthOpen(true);
      return;
    }
    if (isBookmarkLoading) return;
    setIsBookmarkLoading(true);
    try {
      const userRef = doc(db, "users", profile.uid);
      if (isBookmarked) {
        await updateDoc(userRef, {
          bookmarks: arrayRemove(story.id)
        });
      } else {
        await updateDoc(userRef, {
          bookmarks: arrayUnion(story.id)
        });
      }
      trackEvent("Engagement", "Bookmark_Post", story.id);
    } catch(err) {
      console.error("Error bookmarking post:", err);
      handleFirestoreError(err, OperationType.UPDATE, "users");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleFollowAuthor = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setIsFollowLoading(true);
    try {
      const currentFollows = profile?.followedAuthors || [];
      const updatedFollows = isFollowing
        ? currentFollows.filter((id: string) => id !== story.authorId)
        : [...currentFollows, story.authorId];

      await setDoc(
        doc(db, "users", user.uid),
        {
          followedAuthors: updatedFollows,
        },
        { merge: true },
      );
      setIsFollowing(!isFollowing);
      setFollowMessage({ type: "success", text: !isFollowing ? "Author followed!" : "Author unfollowed." });
      setTimeout(() => setFollowMessage(null), 3000);
      trackEvent(
        "Engagement",
        isFollowing ? "Unfollow" : "Follow",
        story.authorName,
      );
    } catch (err) {
      console.error("Failed to follow author:", err);
      setFollowMessage({ type: "error", text: "Failed to update follow status." });
      setTimeout(() => setFollowMessage(null), 3000);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Restore saved reading progress
    const timer = setTimeout(() => {
      const saved = localStorage.getItem(`reading_progress_${story.id}`);
      if (saved) {
        const perc = parseFloat(saved);
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0 && perc > 0) {
          window.scrollTo({ top: (perc / 100) * docHeight, behavior: 'smooth' });
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [story.id]);

  useEffect(() => {
    let timeout: any;
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
        setScrollProgress(progress);

        clearTimeout(timeout);
        timeout = setTimeout(() => {
          localStorage.setItem(`reading_progress_${story.id}`, progress.toString());
        }, 1000);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, [story.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen transition-colors"
    >
      {followMessage && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-xl shadow-xl text-[10px] font-black uppercase tracking-widest text-white animate-fade-in flex items-center gap-2 ${followMessage.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {followMessage.type === 'error' ? <AlertCircle size={16}/> : <CheckCircle size={16}/>}
          {followMessage.text}
        </div>
      )}

      <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 z-[100]">
        <div 
          className="h-full bg-indigo-600 transition-all duration-150 ease-out" 
          style={{ width: `${scrollProgress}%` }} 
        />
      </div>

      <AnimatePresence>
        {sharingStory && (
          <ShareModal
            story={sharingStory}
            onClose={() => setSharingStory(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 md:px-0 pt-32 pb-40">
        <header className="mb-12">
          <div
            className="flex items-center gap-4 mb-10 group cursor-pointer"
            onClick={onBack}
          >
            <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:text-black group-hover:bg-slate-50 transition-all">
              <ChevronRight className="rotate-180" size={16} />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-black transition-colors uppercase tracking-widest">
              Home
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-black text-slate-900 dark:text-white dark:text-white leading-[1.05] mb-8 tracking-tighter">
            {story.title}
          </h1>

          <div className="flex items-center justify-between border-y border-slate-50 dark:border-slate-800 py-8 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 dark:text-slate-200 border border-slate-100">
                {story.authorPhotoURL ? (
                  <img
                    src={story.authorPhotoURL}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCircle size={40} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white dark:text-white">
                    {story.authorName}
                  </h4>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <button
                    onClick={handleFollowAuthor}
                    disabled={isFollowLoading}
                    className="text-sm text-green-600 font-bold hover:text-green-800 transition-colors disabled:opacity-50"
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  5 min read ·{" "}
                  {story.createdAt
                    ?.toDate()
                    .toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400">
              <button
                onClick={handleLikePost}
                disabled={isLikeLoading}
                className="flex items-center gap-2 hover:text-slate-900 dark:text-white dark:hover:text-white cursor-pointer transition-colors disabled:opacity-50 group"
              >
                <ThumbsUp
                  size={20}
                  className="group-hover:-translate-y-1 transition-transform"
                />
                <span className="text-xs font-bold">{localLikes}</span>
              </button>
              <div
                onClick={() => {
                  const el = document.getElementById("comments");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="flex items-center gap-2 hover:text-slate-900 dark:text-white dark:hover:text-white cursor-pointer transition-colors"
              >
                <MessageCircle size={20} />
                <span className="text-xs font-bold">
                  {story.commentsCount || 0}
                </span>
              </div>
              <button
                onClick={() => {
                  setSharingStory(story);
                  trackEvent("Engagement", "Share_Initiated", story.id);
                }}
                className="hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors"
              >
                <Share2 size={20} />
              </button>
              <button
                onClick={handleBookmarkPost}
                disabled={isBookmarkLoading}
                className={`hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50 ${isBookmarked ? "text-indigo-600 dark:text-indigo-400" : ""}`}
              >
                <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </header>

        <article className="prose prose-slate dark:prose-invert prose-lg md:prose-xl max-w-none prose-p:font-serif prose-p:text-slate-800 dark:prose-p:text-slate-500 dark:text-slate-300 prose-p:leading-relaxed prose-headings:font-black prose-headings:tracking-tight prose-blockquote:border-black dark:prose-blockquote:border-white prose-blockquote:italic prose-blockquote:text-slate-500">
          <div className="flex items-center gap-4 mb-8">
            {story.postType === "Product Review" && story.reviewScore && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Review Score</span>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={24}
                      fill={i < Math.floor(story.reviewScore) ? "currentColor" : "none"}
                      className={i < story.reviewScore ? "text-amber-500" : "text-slate-200 dark:text-slate-700"}
                    />
                  ))}
                  <span className="ml-2 font-black text-xl text-slate-900 dark:text-white">{story.reviewScore}/5</span>
                </div>
              </div>
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full not-prose ml-auto">
              {story.postType || story.category || "Article"}
            </span>
          </div>

          <p className="text-2xl font-serif text-slate-500 dark:text-slate-400 italic mb-12 leading-relaxed tracking-tight border-l-2 border-black/5 pl-8">
            {story.excerpt}
          </p>

          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12 not-prose">
              {story.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="ql-editor font-serif text-xl text-slate-900 dark:text-white dark:text-slate-200 leading-loose !p-0"
            dangerouslySetInnerHTML={{ __html: story.content || "<p className='italic text-slate-400'>This manuscript has no content yet.</p>" }}
          />
        </article>

        {story.linkedProducts && story.linkedProducts.length > 0 && (
           <ProductsSection productIds={story.linkedProducts} />
        )}

        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              {story.authorPhotoURL ? (
                <img
                  src={story.authorPhotoURL}
                  alt={story.authorName}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCircle size={40} className="text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {story.authorName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs md:max-w-md italic font-serif line-clamp-1">
                {story.authorBio || "A storyteller exploring the intersection of human psychology and digital systems."}
              </p>
            </div>
          </div>
          <button
            onClick={handleFollowAuthor}
            disabled={isFollowLoading}
            className="hidden sm:block bg-black dark:bg-white dark:text-black text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>

        <AdUnit
          placement="inline"
          targetPage="post"
          category={story.category}
          className="my-16"
        />

        <div id="comments">
          <CommentSection postId={story.id} onAuth={() => setIsAuthOpen(true)} />
        </div>

        <AdUnit
          placement="bottom"
          targetPage="post"
          category={story.category}
          className="my-16"
        />

        <RelatedStories currentStoryId={story.id} category={story.category} />
      </div>
    </motion.div>
  );
}

function AdminComments() {
  const [allComments, setAllComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected" | "flagged"
  >("flagged");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "status" | "author"
  >("newest");

  useEffect(() => {
    // We'll fetch all comments globally
    const q = query(
      collectionGroup(db, "comments"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAllComments(
          snap.docs.map((d) => ({
            id: d.id,
            postId: d.ref.parent.parent?.id,
            ...d.data(),
          })),
        );
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, "comments-group");
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const updateStatus = async (
    postId: string,
    commentId: string,
    status: string,
  ) => {
    try {
      await updateDoc(doc(db, "posts", postId, "comments", commentId), {
        status,
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `posts/${postId}/comments/${commentId}`,
      );
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Are you sure you want to permanently delete this comment?"))
      return;
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `posts/${postId}/comments/${commentId}`,
      );
    }
  };

  const sortedAndFiltered = useMemo(() => {
    let result = [...allComments];
    if (filterStatus !== "all") {
      result = result.filter((c) => (c.status || "pending") === filterStatus);
    }

    result.sort((a, b) => {
      if (sortBy === "newest")
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === "oldest")
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      if (sortBy === "status")
        return (a.status || "pending").localeCompare(b.status || "pending");
      if (sortBy === "author")
        return (a.authorName || "").localeCompare(b.authorName || "");
      return 0;
    });

    return result;
  }, [allComments, filterStatus, sortBy]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            Interactions <span className="italic">Review</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">
            High-priority moderation queue
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-2xl">
            {["all", "pending", "approved", "rejected", "flagged"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${filterStatus === s ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-2xl">
            {["newest", "oldest", "status", "author"].map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${sortBy === s ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-500 dark:text-slate-400 font-serif italic">
            Accessing moderation nodes...
          </p>
        </div>
      ) : sortedAndFiltered.length === 0 ? (
        <div className="p-20 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-[48px] bg-white dark:bg-slate-900/50">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <p className="text-slate-900 dark:text-white dark:text-white font-serif font-bold text-xl mb-2">
            Workspace Clean
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No flagged comments detected in the current cycle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sortedAndFiltered.map((c) => (
            <div
              key={c.id}
              className={`bg-white dark:bg-slate-900 border p-8 rounded-[40px] shadow-sm flex flex-col xl:flex-row gap-8 items-start xl:items-center transition-all ${c.status === "flagged" ? "border-red-500/50 dark:border-red-500/50 shadow-red-500/10" : "border-slate-100 dark:border-slate-800"}`}
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                    {c.authorPhotoURL ? (
                      <img
                        src={c.authorPhotoURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} className="m-2 text-slate-500 dark:text-slate-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white dark:text-white">
                        {c.authorName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">
                        on Post ID: {c.postId || "Unknown"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        c.status === "flagged"
                          ? "bg-red-50 text-red-600"
                          : c.status === "approved"
                            ? "bg-emerald-50 text-emerald-600"
                            : c.status === "rejected"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {c.status || "pending"}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-serif italic text-lg leading-relaxed">
                  "{c.content}"
                </p>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <span>
                    {c.createdAt?.toDate
                      ? c.createdAt.toDate().toLocaleString()
                      : "Just now"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={() => updateStatus(c.postId, c.id, "approved")}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all font-bold"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(c.postId, c.id, "rejected")}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold"
                >
                  Reject
                </button>
                <button
                  onClick={() => deleteComment(c.postId, c.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 dark:border-red-900/40 transition-all font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostDetailView({
  postId,
  onBack,
}: {
  postId: string;
  onBack: () => void;
}) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, "posts", postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching post details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Manuscript not found.</p>
        <button
          onClick={onBack}
          className="mt-4 text-black font-black uppercase tracking-widest text-[10px]"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-black transition-colors group"
        >
          <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-50">
            <ChevronRight className="rotate-180" size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">
            Back to Nodes
          </span>
        </button>
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              post.status === "published"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {post.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <header className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {post.category}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 uppercase tracking-widest font-black">
                {post.readTime}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-slate-900 dark:text-white dark:text-white leading-[1.1] tracking-tighter">
              {post.title}
            </h1>
            <p className="text-xl font-serif text-slate-500 italic leading-relaxed border-l-4 border-slate-100 dark:border-slate-800 pl-8">
              {post.excerpt}
            </p>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {post.featuredImage && (
            <div className="aspect-[21/9] rounded-[48px] overflow-hidden shadow-2xl shadow-black/5">
              <img
                src={
                  post.featuredImage ||
                  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1600"
                }
                className="w-full h-full object-cover"
                alt=""
              />
            </div>
          )}

          <div
            className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-p:font-serif prose-p:text-slate-800 dark:prose-p:text-slate-500 dark:text-slate-300 prose-p:leading-relaxed prose-headings:font-black prose-headings:tracking-tight"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.linkedProducts && post.linkedProducts.length > 0 && (
             <ProductsSection productIds={post.linkedProducts} />
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-[48px] shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 mb-6">
              Manuscript Identity
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 shadow-inner overflow-hidden">
                {post.authorPhotoURL ? (
                  <img
                    src={post.authorPhotoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle size={48} />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">
                  Architect
                </p>
                <h5 className="text-lg font-bold text-slate-900 dark:text-white dark:text-white">
                  {post.authorName}
                </h5>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 space-y-6">
              <div>
                <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-[0.2em] mb-1.5">
                  Established On
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-white">
                  {post.createdAt
                    ?.toDate()
                    .toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-[0.2em] mb-1.5">
                  Last Sync
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-white">
                  {post.updatedAt
                    ?.toDate()
                    .toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black text-white p-10 rounded-[48px] shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={16} className="text-green-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">
                Engagement Metrics
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/5 p-6 rounded-3xl">
                <p className="text-2xl font-black">{post.likesCount || 0}</p>
                <p className="text-[8px] uppercase font-black text-white/40 tracking-widest mt-1">
                  Acclaim
                </p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl">
                <p className="text-2xl font-black">{post.viewsCount || 0}</p>
                <p className="text-[8px] uppercase font-black text-white/40 tracking-widest mt-1">
                  Reach
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-12 mt-12 border-t border-slate-100 dark:border-slate-800">
        <RelatedStories currentStoryId={post.id} category={post.category} />
      </div>
    </motion.div>
  );
}

import CategoriesManagement from "./components/CategoriesManagement";
import TagsManagement from "./components/TagsManagement";

function AdminShell({
  activePage,
  setPage,
  adminPostId,
  setAdminPostId,
  onBackToHome,
}: {
  activePage: AdminPage;
  setPage: (p: AdminPage) => void;
  adminPostId: string | null;
  setAdminPostId: (id: string | null) => void;
  onBackToHome: () => void;
}) {
  const { profile } = useAuth();
  const { theme } = useTheme();

  const navGroups = [
    {
      title: "Platform Core",
      items: [
        { id: "dashboard", label: "Systems Hub", icon: LayoutDashboard },
        { id: "roles", label: "RBAC Architecture", icon: ShieldCheck },
      ],
    },
    {
      title: "Monetization & Content",
      items: [
        { id: "posts", label: "Post Management", icon: FileText },
        { id: "categories", label: "Categories", icon: FolderTree },
        { id: "tags", label: "Tags", icon: Tag },
        { id: "products", label: "Digital Product", icon: ShoppingBag },
        { id: "ads", label: "Ads Management", icon: DollarSign },
      ],
    },
    {
      title: "Network & Community",
      items: [
        { id: "authors", label: "Author Personnel", icon: Users },
        { id: "subscriptions", label: "Subscribers", icon: Mail },
        { id: "comments", label: "Interactions", icon: MessageCircle },
      ],
    },
    {
      title: "Developer Options",
      items: [
        { id: "api-mgmt", label: "API Management", icon: Terminal },
        { id: "api-docs", label: "API Documentation", icon: BookOpen },
        { id: "integrations", label: "Module Integrations", icon: Layers },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-white font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col shrink-0 md:h-full overflow-y-auto max-h-[40vh] md:max-h-full">
        <div className="p-10 pb-6">
          <div className="flex items-center gap-3 mb-8 select-none">
            <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center font-black text-white dark:text-black text-sm italic">
              C
            </div>
            <div>
              <h2 className="text-black dark:text-white text-sm font-black uppercase tracking-[0.2em]">
                Core Engine
              </h2>
              <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mt-0.5">
                Chrica v4.2
              </p>
            </div>
          </div>

          <nav className="space-y-8 h-auto md:h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar pr-2 md:mt-0 mt-4">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-4 px-5">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      title={item.label}
                      onClick={() => setPage(item.id as AdminPage)}
                      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all group relative ${
                        activePage === item.id
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-2xl shadow-black/10 font-black translate-x-2"
                          : "text-slate-500 dark:text-slate-400 font-bold hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {activePage === item.id && (
                        <motion.div
                          layoutId="admin-nav-indicator"
                          className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                      <item.icon
                        size={16}
                        className={
                          activePage === item.id
                            ? theme === "dark"
                              ? "text-black"
                              : "text-white"
                            : "text-slate-500 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition-colors"
                        }
                      />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-10 border-t border-slate-50 dark:border-slate-800 space-y-6">
          <button
            onClick={onBackToHome}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors"
          >
            <Home size={16} />
            Home
          </button>

          <div className="flex items-center gap-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold overflow-hidden">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.displayName?.charAt(0)
              )}
            </div>
            <div>
              <p className="text-xs text-slate-900 dark:text-white dark:text-white font-black uppercase tracking-widest leading-none truncate max-w-[100px]">
                {profile?.displayName}
              </p>
              <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mt-1.5">
                {profile?.role}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <ThemeToggle />
              <button
                onClick={() => logoutUser()}
                className="text-slate-500 dark:text-slate-300 hover:text-red-500 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-16 bg-[#FBFBFB] dark:bg-slate-950">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
          >
            {activePage === "dashboard" && <AdminDashboard setPage={setPage} />}
            {activePage === "roles" && <RoleManagement />}
            {activePage === "posts" && (
              <PostManagement
                setPage={setPage}
                setAdminPostId={setAdminPostId}
              />
            )}
            {activePage === "post-detail" && adminPostId && (
              <PostDetailView
                postId={adminPostId}
                onBack={() => setPage("posts")}
              />
            )}
            {activePage === "ads" && <AdsManagement />}
            {activePage === "products" && <ProductsManagement />}
            {activePage === "authors" && <AuthorManagement />}
            {activePage === "subscriptions" && <SubscriptionsManagement />}
            {activePage === "comments" && <AdminComments />}
            {activePage === "api-mgmt" && <ApiManagement />}
            {activePage === "api-docs" && <ApiDocumentation />}
            {activePage === "categories" && <CategoriesManagement />}
            {activePage === "tags" && <TagsManagement />}
            {activePage === "integrations" && <IntegrationsManagement />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function ApiHealthWidget() {
  const [status, setStatus] = useState<"healthy" | "unhealthy" | "checking">(
    "checking",
  );

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // In a real environment, we'd fetch actual /api/health
        // Since we are in a preview, we'll simulate a check
        const start = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatus(Date.now() - start < 1500 ? "healthy" : "unhealthy");
      } catch (e) {
        setStatus("unhealthy");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[40px] shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            status === "healthy"
              ? "bg-emerald-50 text-emerald-600"
              : status === "unhealthy"
                ? "bg-red-50 text-red-600"
                : "bg-slate-50 text-slate-500 dark:text-slate-400"
          }`}
        >
          <Database size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white dark:text-white">
            API Mesh Health
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-serif italic">
            Operational Status Monitoring
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        <div
          className={`w-2 h-2 rounded-full ${
            status === "healthy"
              ? "bg-emerald-500 animate-pulse"
              : status === "unhealthy"
                ? "bg-red-500"
                : "bg-slate-300"
          }`}
        />
        <span
          className={`text-[10px] font-black uppercase tracking-widest ${
            status === "healthy"
              ? "text-emerald-600"
              : status === "unhealthy"
                ? "text-red-600"
                : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function AdminDashboard({ setPage }: { setPage: (p: AdminPage) => void }) {
  const { hasPermission, user, profile } = useAuth();
  const [apis, setApis] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [stats, setStats] = useState({
    publishedPosts: 0,
    totalUsers: 0,
    activeProducts: 0,
    totalComments: 0,
  });
  const [trafficData, setTrafficData] = useState<number[]>([]);

  useEffect(() => {
    // Generate initial traffic data for last 24 intervals
    const initialTraffic = Array.from(
      { length: 24 },
      () => Math.floor(Math.random() * 60) + 20,
    );
    setTrafficData(initialTraffic);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setTrafficData((prev) => {
        const newData = [...prev.slice(1), Math.floor(Math.random() * 60) + 20];
        return newData;
      });
    }, 5000);

    const unsubApis = onSnapshot(collection(db, "api_management"), (s) =>
      setApis(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    // Quick Stats Real-time Listeners
    const qPublished = query(
      collection(db, "posts"),
      where("status", "==", "published"),
    );
    const unsubPosts = onSnapshot(qPublished, (snap) => {
      setStats((prev) => ({ ...prev, publishedPosts: snap.size }));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setStats((prev) => ({ ...prev, totalUsers: snap.size }));
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setStats((prev) => ({ ...prev, activeProducts: snap.size }));
    });

    return () => {
      clearInterval(interval);
      unsubApis();
      unsubPosts();
      unsubUsers();
      unsubProducts();
    };
  }, []);

  const seedEngine = async () => {
    if (!user || !profile) {
      alert("Please login first.");
      return;
    }
    setSeeding(true);
    try {
      const dummyPosts = [];
      for (let i = 0; i < 10; i++) {
        dummyPosts.push({
          title: `Sample Story ${i + 1}: The Future of AI and Design`,
          excerpt: `An exploration into how generative models are reshaping the creative process. ${i}`,
          content: `<h2>The Evolution</h2><p>As we delve deeper into artificial intelligence, the boundaries between creator and tool blur. This is sample content ${i}.</p>`,
          category: [
            "Technology",
            
            "Crypto",
            "Finance",
          ][i % 5],
          featuredImage: `https://images.unsplash.com/photo-${1600000000000 + i}?auto=format&fit=crop&q=80&w=1600`, // randomish URL, just a placeholder structure
          status: "published",
          authorId: user.uid,
          authorName: profile.displayName || "Admin User",
          authorPhotoURL: profile.photoURL || "",
          authorBio: profile.bio || "Sample Bio",
          readTime: `${Math.floor(Math.random() * 10) + 2} min read`,
          likesCount: Math.floor(Math.random() * 500),
          viewsCount: Math.floor(Math.random() * 5000),
          featured: i === 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const post of dummyPosts) {
        await addDoc(collection(db, "posts"), post);
      }

      const dummyProducts = [];
      for (let i = 0; i < 6; i++) {
        dummyProducts.push({
          name: `Sample Product ${i + 1}`,
          price: `$${(i + 1) * 29}.00`,
          description: `A highly curated digital asset designed for modern workflows. Perfect for scaling your projects. Variation ${i}.`,
          type: i % 2 === 0 ? "real" : "affiliate",
          gallery: [
            `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80&w=800`,
          ],
          affiliateButtons:
            i % 2 !== 0
              ? [
                  {
                    label: "Buy on Amazon",
                    url: "https://amazon.com",
                    icon: "ShoppingCart",
                    color: "bg-amber-500 text-white hover:bg-amber-600",
                  },
                ]
              : [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const p of dummyProducts) {
        await addDoc(collection(db, "products"), p);
      }

      const dummyApis = [];
      for (let i = 0; i < 5; i++) {
        dummyApis.push({
          name: `API Service ${i + 1}`,
          method: ["GET", "POST", "PUT", "DELETE"][i % 4],
          endpoint: `/api/service_${i + 1}`,
          description: `Sample API description for service ${i + 1}. Facilitates integration with the core engine.`,
          payload: JSON.stringify(
            { sampleParam: "value123", index: i },
            null,
            2,
          ),
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const api of dummyApis) {
        await addDoc(collection(db, "api_management"), api);
      }

      const dummyAds = [];
      for (let i = 0; i < 5; i++) {
        dummyAds.push({
          name: `Ad Campaign ${i + 1}`,
          targetPage: i % 2 === 0 ? "home" : "post",
          placement: ["top", "inline", "sidebar", "bottom"][i % 4],
          type: "image",
          imageUrl: `https://images.unsplash.com/photo-${1400000000000 + i}?auto=format&fit=crop&q=80&w=1600`,
          url: "https://chrica.io",
          active: true,
          impressions: Math.floor(Math.random() * 1000),
          clicks: Math.floor(Math.random() * 100),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const ad of dummyAds) {
        await addDoc(collection(db, "ads"), ad);
      }

      alert("Database seeded with 10 Posts, 6 Products, 5 APIs, and 5 Ads!");
    } catch (error: any) {
      console.error(error);
      alert("Seeding failed: " + error.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col justify-center">
          <div className="px-3 py-1 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-[0.4em] inline-block mb-4">
            Architecture / Insights
          </div>
          <h2 className="text-5xl text-slate-900 dark:text-white dark:text-white font-serif font-black tracking-tighter">
            Engine <span className="italic">Intelligence.</span>
          </h2>
        </div>
        <ApiHealthWidget />
      </div>

      <div className="flex items-center gap-4 justify-end">
        <button
          onClick={seedEngine}
          disabled={seeding}
          className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
        >
          {seeding ? "Seeding..." : "Seed Sample Data"}
        </button>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 rounded-[24px] border border-emerald-100 dark:border-emerald-900/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
            System Health
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-900 dark:text-white dark:text-white">
              All Nodes Operational
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="space-y-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
          Quick Stats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <StatCard
            title="Published Nodes"
            value={stats.publishedPosts.toString()}
            trend="Live"
            icon={<FileText size={20} />}
            onClick={() => setPage("posts")}
          />
          <StatCard
            title="Active Directory"
            value={stats.totalUsers.toString()}
            trend="Real-time"
            icon={<Users size={20} />}
            onClick={() => setPage("subscriptions")}
          />
          <StatCard
            title="Managed Assets"
            value={stats.activeProducts.toString()}
            trend="Product"
            icon={<ShoppingBag size={20} />}
            onClick={() => setPage("products")}
          />
          <StatCard
            title="Content Reach"
            value="12.4k"
            trend="Estimated"
            icon={<TrendingUp size={20} />}
            onClick={() => setPage("dashboard")}
          />
        </div>

        {/* Real-time Traffic Flow Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[48px] p-12 shadow-sm">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white mb-1">
                Real-time Traffic Flow
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Live analytics nodes / Last 24 intervals
                </p>
                <div className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />{" "}
                  Live Stream
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-900 dark:text-white dark:text-white">
                Active Users
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-serif italic">
                {(trafficData[trafficData.length - 1] || 0) * 1.5} current
                sessions
              </p>
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 md:gap-4 px-4 overflow-hidden border-b border-slate-50 dark:border-slate-800 pb-2">
            {trafficData.map((val, idx) => (
              <motion.div
                key={idx}
                initial={false}
                animate={{ height: `${(val / 100) * 100}%` }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="flex-1 relative group cursor-pointer"
              >
                <div
                  className={`absolute inset-0 rounded-t-xl opacity-20 group-hover:opacity-40 transition-opacity ${val > 70 ? "bg-indigo-600" : "bg-indigo-400"}`}
                />
                <div
                  className={`h-full w-full rounded-t-xl mt-auto relative z-10 overflow-hidden transition-colors ${
                    val > 70
                      ? "bg-gradient-to-t from-indigo-700 to-indigo-500"
                      : val > 40
                        ? "bg-gradient-to-t from-indigo-600 to-indigo-400"
                        : "bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black py-2 px-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 shadow-xl pointer-events-none z-50">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">
                    Interval {idx + 1}
                  </p>
                  <p className="text-xs font-black">{val} hits</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-between mt-8 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>Peak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800" />
                <span>Baseline</span>
              </div>
            </div>
            <div className="font-serif italic text-slate-500 dark:text-slate-400">
              T - 24 Intervals
            </div>
            <div className="flex items-center gap-2">
              PRESENT{" "}
              <div className="w-1 h-3 bg-indigo-200 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      {/* Authorized Tools Enforcement Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
            Authorized Service Matrix
          </h3>
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 px-3 py-1 rounded-full flex items-center gap-2">
            <ShieldCheck size={10} /> Active Enforcement
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apis.map((api) => {
            const authorized = hasPermission(`api:${api.id}`);
            return (
              <div
                key={api.id}
                className={`p-8 rounded-[32px] border transition-all ${authorized ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm" : "bg-slate-50 dark:bg-slate-950 border-transparent opacity-40 grayscale"}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${authorized ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-white dark:text-slate-600"}`}
                  >
                    <Zap size={20} />
                  </div>
                  {authorized ? (
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      Authorized
                    </span>
                  ) : (
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Restricted
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white dark:text-white mb-1">
                  {api.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-serif italic line-clamp-2 min-h-[2.5rem]">
                  {api.description}
                </p>

                {authorized ? (
                  <button className="w-full mt-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black dark:hover:bg-slate-100 transition-all">
                    Launch Instance
                  </button>
                ) : (
                  <div className="w-full mt-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2">
                    <ShieldCheck size={12} /> Access Denied
                  </div>
                )}
              </div>
            );
          })}
          {apis.length === 0 && (
            <p className="text-slate-500 dark:text-slate-300 dark:text-slate-700 italic font-serif">
              No API nodes registered.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[48px] p-12 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 dark:text-slate-600">
              Real-time Traffic Flow
            </h3>
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </div>
          </div>
          <div className="h-64 flex items-end gap-2 px-2">
            {trafficData.map((h, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ height: `${h}%` }}
                className={`flex-1 rounded-t-lg transition-colors ${h > 70 ? "bg-indigo-600" : "bg-slate-100 dark:bg-slate-800 hover:bg-black dark:hover:bg-white"}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-6 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 dark:text-slate-800">
            <span>-24h</span>
            <span>Active Nodes Network</span>
            <span>Now</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] p-10 flex items-center justify-between group cursor-pointer hover:border-black dark:hover:border-white transition-all">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white dark:text-white mb-1">
                Search Engine Optimization
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-serif italic">
                Index coverage and keyword saturation.
              </p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-slate-50 dark:border-slate-800 border-t-black dark:border-t-white flex items-center justify-center text-sm font-black">
              92%
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] p-10 flex items-center justify-between group cursor-pointer hover:border-black dark:hover:border-white transition-all">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white dark:text-white mb-1">
                Infrastructure Load
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-serif italic">
                Computational resources and latency.
              </p>
            </div>
            <div className="text-2xl font-black text-slate-700 dark:text-slate-200 dark:text-slate-800 group-hover:text-black dark:group-hover:text-white transition-colors">
              42<span className="text-xs font-bold ml-1 uppercase">ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-[40px] hover:shadow-2xl hover:shadow-black/5 transition-all group ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 dark:text-slate-600 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
          {icon || <Activity size={24} />}
        </div>
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-500 group-hover:text-indigo-600 transition-colors">
          {trend}{" "}
          {onClick && (
            <ArrowRight
              size={10}
              className="group-hover:translate-x-1 transition-transform"
            />
          )}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-3">
        {title}
      </p>
      <p className="text-3xl font-black text-slate-900 dark:text-white dark:text-white tracking-tighter">
        {value}
      </p>
    </div>
  );
}

// --- Image Utilities ---

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.95,
    );
  });
}

function ImageCropper({ image, onCropComplete, onCancel }: any) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop: any) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: any) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleDone = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels!);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-xl">
      <div className="relative w-full max-w-2xl h-[400px] md:h-[600px] bg-slate-900 rounded-[32px] overflow-hidden">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChange}
          onCropComplete={onCropAreaComplete}
          onZoomChange={onZoomChange}
        />
      </div>
      <div className="w-full max-w-2xl mt-8 flex flex-col gap-6">
        <div className="bg-white/10 p-6 rounded-2xl flex items-center gap-4">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
          <span className="text-white text-[10px] font-black w-8">
            {(zoom * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDone}
            className="flex-1 bg-white text-black p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Apply Transform
          </button>
          <button
            onClick={onCancel}
            className="px-10 bg-white/10 text-white p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<any>(null); // { url, type, index }

  const handleFileUpload = async (
    file: Blob,
    path: string,
    originalName: string = "image.jpg",
  ): Promise<string> => {
    console.log(`Starting local upload for: ${originalName}`);
    try {
      const formData = new FormData();
      formData.append('file', file, originalName);

      const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log("Local upload success:", data.url);
      return data.url;
    } catch (error: any) {
      console.error("Local upload error:", error.message);
      throw error;
    }
  };

  const onFileSelected = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
    index?: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCropSource({
        url: reader.result as string,
        type,
        index,
        fileName: file.name,
      });
    };
  };

  const finalizeCrop = async (croppedBlob: Blob) => {
    const { type, index, fileName } = cropSource;
    setCropSource(null);
    setUploading(type === "gallery" ? `gallery-${index}` : `btn-icon-${index}`);

    try {
      const url = await handleFileUpload(
        croppedBlob,
        type === "gallery" ? "gallery" : "icons",
        fileName,
      );
      if (type === "gallery") {
        updateGalleryImage(index, url);
      } else {
        updateAffiliateButton(index, "customIcon", url);
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setUploading(null);
    }
  };

  const AVAILABLE_ICONS = [
    { name: "ShoppingBag", icon: <ShoppingBag size={14} /> },
    { name: "ShoppingCart", icon: <ShoppingCart size={14} /> },
    { name: "ExternalLink", icon: <ExternalLink size={14} /> },
    { name: "Download", icon: <Download size={14} /> },
    { name: "Zap", icon: <Zap size={14} /> },
    { name: "Globe", icon: <Globe size={14} /> },
    { name: "Gift", icon: <Gift size={14} /> },
    { name: "CreditCard", icon: <CreditCard size={14} /> },
  ];

  const COLORS = [
    { name: "Black", class: "bg-black text-white hover:bg-slate-800" },
    { name: "Indigo", class: "bg-indigo-600 text-white hover:bg-indigo-700" },
    {
      name: "Emerald",
      class: "bg-emerald-600 text-white hover:bg-emerald-700",
    },
    { name: "Rose", class: "bg-rose-600 text-white hover:bg-rose-700" },
    { name: "Amber", class: "bg-amber-500 text-white hover:bg-amber-600" },
    { name: "Sky", class: "bg-sky-500 text-white hover:bg-sky-600" },
  ];

  useEffect(() => {
    onSnapshot(collection(db, "products"), (s) =>
      setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, []);

  const save = async (e: any) => {
    e.preventDefault();
    const dataToSend = {
      ...current,
      updatedAt: serverTimestamp(),
    };
    if (current.id)
      await updateDoc(doc(db, "products", current.id), dataToSend);
    else
      await addDoc(collection(db, "products"), {
        ...dataToSend,
        createdAt: serverTimestamp(),
      });
    setIsEditing(false);
  };

  const addGalleryImage = () => {
    const images = current.gallery || [];
    setCurrent({ ...current, gallery: [...images, ""] });
  };

  const updateGalleryImage = (index: number, val: string) => {
    const images = [...(current.gallery || [])];
    images[index] = val;
    setCurrent({ ...current, gallery: images });
  };

  const removeGalleryImage = (index: number) => {
    const images = current.gallery.filter((_: any, i: number) => i !== index);
    setCurrent({ ...current, gallery: images });
  };

  const addAffiliateButton = () => {
    const buttons = current.affiliateButtons || [];
    setCurrent({
      ...current,
      affiliateButtons: [
        ...buttons,
        {
          label: "Buy Now",
          url: "",
          icon: "ExternalLink",
          color: "bg-black text-white hover:bg-slate-800",
        },
      ],
    });
  };

  const updateAffiliateButton = (index: number, field: string, val: string) => {
    const buttons = [...(current.affiliateButtons || [])];
    buttons[index] = { ...buttons[index], [field]: val };
    setCurrent({ ...current, affiliateButtons: buttons });
  };

  const removeAffiliateButton = (index: number) => {
    const buttons = current.affiliateButtons.filter(
      (_: any, i: number) => i !== index,
    );
    setCurrent({ ...current, affiliateButtons: buttons });
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            Product <span className="italic">& Assets</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 uppercase font-black tracking-widest text-[9px] opacity-70 italic shadow-sm bg-indigo-50 dark:bg-indigo-900/10 px-2 py-0.5 inline-block rounded">
            Best size: 800x800px (1:1) • Under 2MB
          </p>
        </div>
        <button
          onClick={() => {
            setCurrent({ type: "real", gallery: [], affiliateButtons: [] });
            setIsEditing(true);
          }}
          className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all"
        >
          Add Product Item
        </button>
      </div>

      {isEditing ? (
        <div className="max-w-4xl bg-white dark:bg-slate-900 p-12 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-2xl">
          <form onSubmit={save} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-4">
                    Asset Designation
                  </label>
                  <input
                    placeholder="Product Name"
                    value={current?.name || ""}
                    onChange={(e) =>
                      setCurrent({ ...current, name: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-5 rounded-2xl text-sm font-bold placeholder:text-slate-500 dark:text-slate-300 dark:placeholder:text-slate-600 outline-none dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-4">
                      Category
                    </label>
                    <select
                      value={current?.type}
                      onChange={(e) =>
                        setCurrent({ ...current, type: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none p-5 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none dark:text-white"
                    >
                      <option value="real">Real Product</option>
                      <option value="digital">Digital Product</option>
                      <option value="affiliate">Affiliate Link</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-4">
                      Currency
                    </label>
                    <select
                      value={current?.currency || "USD"}
                      onChange={(e) =>
                        setCurrent({ ...current, currency: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none p-5 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none dark:text-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="IDR">IDR (Rp)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-4">
                      Price
                    </label>
                    <input
                      placeholder="e.g. 29.00"
                      value={current?.price || ""}
                      onChange={(e) =>
                        setCurrent({ ...current, price: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none p-5 rounded-2xl text-sm font-bold outline-none dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-4">Brand</label>
                  <input placeholder="Brand Name" value={current?.brand || ""} onChange={(e) => setCurrent({ ...current, brand: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none p-5 rounded-2xl text-sm font-bold outline-none dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-4">
                    Narrative Description
                  </label>
                  <textarea
                    placeholder="Description"
                    rows={4}
                    value={current?.description || ""}
                    onChange={(e) =>
                      setCurrent({ ...current, description: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-5 rounded-2xl text-sm leading-relaxed outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-4">Specification</label>
                  <textarea placeholder="Product specifications..." rows={4} value={current?.specification || ""} onChange={(e) => setCurrent({ ...current, specification: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-none p-5 rounded-2xl text-sm leading-relaxed outline-none dark:text-white" />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Visual Gallery
                    </label>
                    <button
                      type="button"
                      onClick={addGalleryImage}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700"
                    >
                      Add Image
                    </button>
                  </div>
                  <div className="space-y-3">
                    {current.gallery?.map((url: string, idx: number) => (
                      <div
                        key={idx}
                        className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50"
                      >
                        <div className="flex gap-2">
                          <input
                            placeholder="Image URL"
                            value={url}
                            onChange={(e) =>
                              updateGalleryImage(idx, e.target.value)
                            }
                            className="flex-1 bg-white dark:bg-slate-900 border-none px-4 py-2 rounded-xl text-xs outline-none dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="p-2 text-slate-500 dark:text-slate-300 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            <Upload size={12} />
                            {uploading === `gallery-${idx}`
                              ? "Uploading..."
                              : "Upload & Transform"}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) =>
                                onFileSelected(e, "gallery", idx)
                              }
                            />
                          </label>
                          {url && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                              <img
                                src={url}
                                className="w-full h-full object-cover"
                                alt=""
                                crossOrigin="anonymous"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!current.gallery || current.gallery.length === 0) && (
                      <p className="text-center py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                        No visuals indexed
                      </p>
                    )}
                  </div>
                </div>

                {current.type === "affiliate" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Affiliate Nodes
                      </label>
                      <button
                        type="button"
                        onClick={addAffiliateButton}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700"
                      >
                        Add Button
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {current.affiliateButtons?.map(
                        (btn: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[28px] space-y-4 relative group/btn"
                          >
                            <button
                              type="button"
                              onClick={() => removeAffiliateButton(idx)}
                              className="absolute top-4 right-4 text-slate-500 dark:text-slate-300 hover:text-red-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="grid grid-cols-2 gap-4">
                              <input
                                placeholder="Button Label"
                                value={btn.label}
                                onChange={(e) =>
                                  updateAffiliateButton(
                                    idx,
                                    "label",
                                    e.target.value,
                                  )
                                }
                                className="bg-white dark:bg-slate-900 border-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none dark:text-white"
                              />
                              <input
                                placeholder="Target URL"
                                value={btn.url}
                                onChange={(e) =>
                                  updateAffiliateButton(
                                    idx,
                                    "url",
                                    e.target.value,
                                  )
                                }
                                className="bg-white dark:bg-slate-900 border-none px-4 py-2.5 rounded-xl text-[10px] outline-none dark:text-white"
                              />
                            </div>
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                  Preset Glyph
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {AVAILABLE_ICONS.map((icon) => (
                                    <button
                                      key={icon.name}
                                      type="button"
                                      onClick={() =>
                                        updateAffiliateButton(
                                          idx,
                                          "icon",
                                          icon.name,
                                        )
                                      }
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${btn.icon === icon.name ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"}`}
                                    >
                                      {icon.icon}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                  Custom Deployment Glyph
                                </p>
                                <div className="flex items-center gap-3">
                                  <input
                                    placeholder="Icon URL"
                                    value={btn.customIcon || ""}
                                    onChange={(e) =>
                                      updateAffiliateButton(
                                        idx,
                                        "customIcon",
                                        e.target.value,
                                      )
                                    }
                                    className="flex-1 bg-white dark:bg-slate-900 border-none px-4 py-2 rounded-xl text-[10px] outline-none dark:text-white"
                                  />
                                  <label className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all">
                                    <Upload size={14} />
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) =>
                                        onFileSelected(e, "btn-icon", idx)
                                      }
                                    />
                                  </label>
                                  {btn.customIcon && (
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
                                      <img
                                        src={
                                          btn.customIcon ||
                                          `https://ui-avatars.com/api/?name=B`
                                        }
                                        className="w-full h-full object-cover"
                                        alt=""
                                        crossOrigin="anonymous"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  )}
                                </div>
                                {uploading === `btn-icon-${idx}` && (
                                  <p className="text-[8px] font-bold text-indigo-500 animate-pulse">
                                    Synchronizing Custom Glyph...
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                  Atmosphere
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {COLORS.map((color) => (
                                    <button
                                      key={color.name}
                                      type="button"
                                      onClick={() =>
                                        updateAffiliateButton(
                                          idx,
                                          "color",
                                          color.class,
                                        )
                                      }
                                      className={`w-6 h-6 rounded-full transition-all border-2 ${btn.color === color.class ? "border-indigo-500 scale-110 shadow-lg" : "border-transparent"} ${color.class.split(" ")[0]}`}
                                      title={color.name}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                      {(!current.affiliateButtons ||
                        current.affiliateButtons.length === 0) && (
                        <p className="text-center py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                          No deployment nodes configured
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-8 border-t border-slate-50 dark:border-slate-800">
              <button
                type="submit"
                className="flex-1 bg-black dark:bg-white text-white dark:text-black p-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/10 hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
              >
                Synchronize Asset
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-12 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Abandon
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-[56px] hover:shadow-2xl hover:shadow-black/5 transition-all group overflow-hidden flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 dark:text-slate-300 dark:text-slate-600 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all shadow-inner">
                  <ShoppingBag size={28} />
                </div>
                <span
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.type === "real" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                >
                  {p.type}
                </span>
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="text-2xl font-serif font-black text-slate-900 dark:text-white dark:text-white tracking-tight">
                  {p.name}
                </h4>
                <p className="text-2xl font-black text-indigo-600">
                  {p.currency === 'USD' ? '$' : p.currency === 'EUR' ? '€' : p.currency === 'GBP' ? '£' : p.currency === 'JPY' ? '¥' : p.currency === 'IDR' ? 'Rp' : p.currency === 'INR' ? '₹' : (p.currency ? p.currency + ' ' : '$')}
                  {p.price?.replace('$', '')}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed h-[40px]">
                  {p.description}
                </p>
              </div>

              <div className="mb-8 overflow-hidden rounded-3xl h-48 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                <img
                  src={
                    (p.gallery?.filter(Boolean)[0]) ||
                    `https://image.pollinations.ai/prompt/${encodeURIComponent("minimalist digital product " + p.name + " sleek abstract")}?width=800&height=500&nologo=true`
                  }
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt=""
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 space-y-3">
                {p.type === "affiliate" &&
                  p.affiliateButtons?.map((btn: any, idx: number) => {
                    const IconComponent = btn.customIcon ? (
                      <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20">
                        <img
                          src={
                            btn.customIcon ||
                            `https://ui-avatars.com/api/?name=B`
                          }
                          className="w-full h-full object-cover"
                          alt=""
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      AVAILABLE_ICONS.find((i) => i.name === btn.icon)
                        ?.icon || <ExternalLink size={14} />
                    );

                    return (
                      <a
                        key={idx}
                        href={btn.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${btn.color || "bg-black text-white"}`}
                      >
                        {IconComponent}
                        {btn.label}
                      </a>
                    );
                  })}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <button
                  onClick={() => {
                    setCurrent(p);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
                >
                  <Edit size={14} /> Edit Module
                </button>
                <button
                  onClick={() => deleteDoc(doc(db, "products", p.id))}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:text-red-500"
                >
                  Purge
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-40 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto text-slate-700 dark:text-slate-200">
                <Layers size={40} />
              </div>
              <p className="text-xl font-serif italic text-slate-500 dark:text-slate-400">
                Product cache empty. Initialize first node.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Processing Engine */}
      {cropSource && (
        <ImageCropper
          image={cropSource.url}
          onCropComplete={finalizeCrop}
          onCancel={() => setCropSource(null)}
        />
      )}

      <div className="mt-20 p-12 bg-indigo-50 dark:bg-indigo-900/10 rounded-[56px] border border-indigo-100 dark:border-indigo-900/30">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tight text-indigo-900 dark:text-indigo-300">
            Synchronization Protocols
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
              Optimization Tips
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Check size={14} className="text-emerald-500" /> Use 800x800px
                square images for best results.
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Check size={14} className="text-emerald-500" /> Keep file sizes
                under 2MB to ensure fast loading.
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Check size={14} className="text-emerald-500" /> Transform tool
                ensures optimal aspect ratio automatically.
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
              Security Note
            </p>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-500 italic">
              All assets are indexed with cryptographic timestamps and stored in
              a secure edge-distributed network. Ensure you have the appropriate
              distribution rights for all uploaded content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<any[]>([]);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [currentRole, setCurrentRole] = useState<any>(null);
  const [currentKey, setCurrentKey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"roles" | "apikeys">("roles");

  useEffect(() => {
    const unsubRoles = onSnapshot(
      collection(db, "roles"),
      (s) => {
        setRoles(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, "roles"),
    );

    const unsubKeys = onSnapshot(
      collection(db, "apis"),
      (s) => {
        setApiKeys(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, "apis"),
    );

    const unsubEndpoints = onSnapshot(
      collection(db, "api_management"),
      (s) => setApiEndpoints(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.GET, "api_management"),
    );

    return () => {
      unsubRoles();
      unsubKeys();
      unsubEndpoints();
    };
  }, []);

  const dynamicPermissions = [
    ...API_PERMISSIONS,
    ...apiEndpoints.map(api => ({
      id: `api:${api.id}`,
      label: api.name,
      description: api.description || 'Dynamic API Access',
      category: 'Dynamic APIs'
    }))
  ];

  const groupedPermissions = dynamicPermissions.reduce((acc, p) => {
    const cat = p.category || 'Other Contexts';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole.name) return;
    try {
      const roleData = {
        name: currentRole.name,
        description: currentRole.description || "",
        permissions: currentRole.permissions || [],
        updatedAt: serverTimestamp(),
      };

      if (currentRole.id) {
        await updateDoc(doc(db, "roles", currentRole.id), roleData);
      } else {
        await addDoc(collection(db, "roles"), {
          ...roleData,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditingRole(false);
      setCurrentRole(null);
    } catch (error) {
      handleFirestoreError(
        error,
        currentRole.id ? OperationType.UPDATE : OperationType.CREATE,
        "roles",
      );
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKey.name) return;
    try {
      if (currentKey.id) {
        const { id, ...data } = currentKey;
        await updateDoc(doc(db, "apis", id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        const newKeyValue = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        await addDoc(collection(db, "apis"), {
          ...currentKey,
          key:
            currentKey.key ||
            currentKey.name.toLowerCase().replace(/\s+/g, ":"),
          value: newKeyValue,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsEditingKey(false);
      setCurrentKey(null);
    } catch (error) {
      handleFirestoreError(
        error,
        currentKey.id ? OperationType.UPDATE : OperationType.CREATE,
        "apis",
      );
    }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this API key?"))
      return;
    try {
      await deleteDoc(doc(db, "apis", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `apis/${id}`);
    }
  };

  const toggleRolePermission = (permissionId: string) => {
    const currentPermissions = currentRole.permissions || [];
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter((p: string) => p !== permissionId)
      : [...currentPermissions, permissionId];
    setCurrentRole({ ...currentRole, permissions: newPermissions });
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            Role & <span className="italic">Access Control</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">
            Architecture of permissions and interface nodes
          </p>
        </div>
        <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "roles" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
          >
            Roles
          </button>
          <button
            onClick={() => setActiveTab("apikeys")}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "apikeys" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
          >
            API Keys
          </button>
        </div>
      </div>

      {activeTab === "roles" ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
              Active Roles
            </h3>
            <button
              onClick={() => {
                setCurrentRole({ name: "", description: "", permissions: [] });
                setIsEditingRole(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-black uppercase tracking-widest"
            >
              <Plus size={14} /> Define Custom Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-[48px] shadow-sm group"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role.type === "system" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"}`}>
                    <Shield size={24} />
                  </div>
                  <div className="flex items-center gap-3">
                    {role.type === "system" && (
                      <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">System Defined</span>
                    )}
                    {(role.type !== "system") && (
                      <button
                        onClick={() => {
                          setCurrentRole(role);
                          setIsEditingRole(true);
                        }}
                        className="text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white mb-2">
                  {role.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-serif italic mb-8">
                  {role.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {role.permissions?.map((p: string) => (
                    <span
                      key={p}
                      className="text-[8px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700"
                    >
                      {dynamicPermissions.find((ap) => ap.id === p)?.label || p}
                    </span>
                  ))}
                  {(role.permissions?.length || 0) === 0 && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 italic">
                      No direct permissions
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
              Infrastructure Nodes
            </h3>
            <button
              onClick={() => {
                setCurrentKey({
                  name: "",
                  description: "",
                  purpose: "Production",
                });
                setIsEditingKey(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-black uppercase tracking-widest"
            >
              <Key size={14} /> Generate API Node
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[48px] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Node Name
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Access Value
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Purpose
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">
                    Operations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {apiKeys.map((key) => (
                  <tr
                    key={key.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                          <Zap size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white dark:text-white">
                            {key.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">
                            {key.key}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <code className="text-[10px] font-black text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          {showKeys[key.id] ? key.value : "••••••••••••••••"}
                        </code>
                        <button
                          onClick={() =>
                            setShowKeys((prev) => ({
                              ...prev,
                              [key.id]: !prev[key.id],
                            }))
                          }
                          className="text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                        >
                          {showKeys[key.id] ? (
                            <X size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2 items-start">
                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                          {key.purpose || "Production"}
                        </span>
                        {key.roleId && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                            Role:{" "}
                            {roles.find((r) => r.id === key.roleId)?.name ||
                              "Unknown Role"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="text-slate-500 dark:text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <MinusCircle size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {apiKeys.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-8 py-20 text-center text-slate-500 dark:text-slate-300 italic font-serif"
                    >
                      No API nodes generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Editor Modal */}
      <AnimatePresence>
        {isEditingRole && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 backdrop-blur-xl bg-black/20">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[48px] shadow-2xl shadow-black/20 overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <form onSubmit={handleSaveRole}>
                <div className="p-12 border-b border-slate-50 dark:border-slate-800">
                  <h4 className="text-2xl font-serif font-black mb-8">
                    {currentRole.id ? "Modify" : "Create"} Access{" "}
                    <span className="italic">Role</span>
                  </h4>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1">
                        Role Identifier
                      </label>
                      <input
                        type="text"
                        value={currentRole.name}
                        onChange={(e) =>
                          setCurrentRole({
                            ...currentRole,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"
                        placeholder="e.g. Content Architect"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1">
                        Core Description
                      </label>
                      <textarea
                        value={currentRole.description}
                        onChange={(e) =>
                          setCurrentRole({
                            ...currentRole,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all font-serif h-24 resize-none"
                        placeholder="Describe the purpose of this role..."
                      />
                    </div>
                  </div>
                </div>

                <div className="p-12 bg-slate-50/50 dark:bg-slate-950/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-6 px-1">
                    Authorized Permissions Matrix
                  </label>
                  
                  <div className="space-y-8">
                    {Object.entries(groupedPermissions).map(([categoryName, prms]) => {
                      const perms = prms as any[];
                      return (
                      <div key={categoryName}>
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 mb-4 px-1">{categoryName}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {perms.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleRolePermission(p.id)}
                              className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${
                                currentRole.permissions?.includes(p.id)
                                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xl shadow-black/10"
                                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full shrink-0 ${currentRole.permissions?.includes(p.id) ? "bg-indigo-400" : "bg-slate-200"}`}
                              />
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                  {p.label}
                                </p>
                                <p
                                  className={`text-[8px] uppercase tracking-widest font-black opacity-50 ${currentRole.permissions?.includes(p.id) ? "text-white/60 dark:text-black/60" : "text-slate-500 dark:text-slate-400"}`}
                                >
                                  {p.description}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-12 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-black dark:bg-white text-white dark:text-black py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
                  >
                    Submit Protocol
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingRole(false)}
                    className="px-10 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* API Key Modal */}
      <AnimatePresence>
        {isEditingKey && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 backdrop-blur-xl bg-black/20">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[48px] shadow-2xl shadow-black/20 overflow-hidden border border-slate-100 dark:border-slate-800 p-12"
            >
              <form onSubmit={handleSaveKey}>
                <h4 className="text-2xl font-serif font-black mb-8">
                  Generate API <span className="italic">Node</span>
                </h4>

                <div className="space-y-6 mb-10">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1">
                      Node Identifier
                    </label>
                    <input
                      type="text"
                      value={currentKey.name}
                      onChange={(e) =>
                        setCurrentKey({ ...currentKey, name: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold"
                      placeholder="e.g. Analytics Webhook"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1">
                      Functional Purpose
                    </label>
                    <select
                      value={currentKey.purpose || "Production"}
                      onChange={(e) =>
                        setCurrentKey({
                          ...currentKey,
                          purpose: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold appearance-none mb-6"
                    >
                      <option>Production</option>
                      <option>Development</option>
                      <option>Testing</option>
                      <option>Third-Party Integration</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1">
                      Associated Role
                    </label>
                    <select
                      value={currentKey.roleId || ""}
                      onChange={(e) =>
                        setCurrentKey({ ...currentKey, roleId: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all font-bold appearance-none"
                    >
                      <option value="">No specific role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                  >
                    <Key size={14} /> Initialize Node Access
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingKey(false)}
                    className="w-full py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
function AdsManagement() {
  const [ads, setAds] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "home" | "post">("all");

  useEffect(() => {
    return onSnapshot(
      collection(db, "ads"),
      (s) => {
        setAds(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, "ads"),
    );
  }, []);

  const filteredAds = ads.filter(
    (ad) => activeTab === "all" || ad.targetPage === activeTab,
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const adData = {
        ...currentAd,
        updatedAt: serverTimestamp(),
        impressions: currentAd.impressions || 0,
        clicks: currentAd.clicks || 0,
      };

      if (currentAd.id) {
        const { id, ...updateData } = adData;
        await updateDoc(doc(db, "ads", id), updateData);
      } else {
        await addDoc(collection(db, "ads"), {
          ...adData,
          createdAt: serverTimestamp(),
          active: true,
        });
      }
      setIsEditing(false);
      setCurrentAd(null);
    } catch (error) {
      handleFirestoreError(
        error,
        currentAd?.id ? OperationType.UPDATE : OperationType.CREATE,
        "ads",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (ad: any) => {
    try {
      await updateDoc(doc(db, "ads", ad.id), {
        active: !ad.active,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ads/${ad.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    try {
      await deleteDoc(doc(db, "ads", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `ads/${id}`);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            Revenue <span className="italic">& Placements</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Manage your global ad product and campaign performance.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
          {(["all", "home", "post"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 text-[10px] uppercase font-black tracking-widest rounded-full transition-all ${
                activeTab === tab
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-lg"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setCurrentAd({
              type: "image",
              placement: "sidebar",
              targetPage: "home",
              targetCategory: "All",
              active: true,
            });
            setIsEditing(true);
          }}
          className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 transition-transform"
        >
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAds.map((ad) => (
          <div
            key={ad.id}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[48px] group hover:border-black dark:hover:border-white transition-all flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white dark:text-white leading-tight">
                  {ad.name}
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                    {ad.targetPage} Page
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                    {ad.placement}
                  </span>
                  {ad.targetPage === "post" && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                      {ad.targetCategory}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleStatus(ad)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
                  ad.active
                    ? "border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 text-green-500"
                    : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${ad.active ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}
                />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {ad.active ? "Active" : "Paused"}
                </span>
              </button>
            </div>

            <div className="aspect-video bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-6">
              {ad.type === "image" && ad.imageUrl ? (
                <img
                  src={ad.imageUrl}
                  alt={ad.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <Layers className="mx-auto mb-2 text-slate-500 dark:text-slate-300" size={24} />
                  <p className="text-slate-500 dark:text-slate-300 font-serif italic text-xs">
                    {ad.type === "code"
                      ? "HTML/JS Code Ad"
                      : "No Image Creative"}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  CTR
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-white">
                  {ad.impressions > 0
                    ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  Impact
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-white">
                  {(ad.impressions / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  Clicks
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-white">
                  {ad.clicks || 0}
                </p>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-6">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentAd(ad);
                    setIsEditing(true);
                  }}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                {ad.type} creative
              </span>
            </div>
          </div>
        ))}
        {ads.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Zap className="mx-auto mb-4 text-slate-500 dark:text-slate-300" size={48} />
            <p className="text-slate-500 dark:text-slate-400 font-serif italic text-lg">
              No active campaigns. Start monetization today.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden text-slate-900 dark:text-white dark:text-white"
            >
              <form onSubmit={handleSave} className="p-12">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-serif font-black">
                    {currentAd?.id ? "Edit" : "New"} Ad Campaign
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                      Campaign Name
                    </label>
                    <input
                      required
                      type="text"
                      value={currentAd?.name || ""}
                      onChange={(e) =>
                        setCurrentAd({ ...currentAd, name: e.target.value })
                      }
                      placeholder="e.g. Q4 Tech Conference Banner"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-all text-sm font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                        Target Page
                      </label>
                      <select
                        value={currentAd?.targetPage || "home"}
                        onChange={(e) =>
                          setCurrentAd({
                            ...currentAd,
                            targetPage: e.target.value as any,
                            targetCategory:
                              e.target.value === "home"
                                ? "All"
                                : currentAd.targetCategory,
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-all text-sm font-bold"
                      >
                        <option value="home">Home Feed</option>
                        <option value="post">Post Article</option>
                      </select>
                    </div>
                    {currentAd?.targetPage === "post" ? (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                          Target Category
                        </label>
                        <select
                          value={currentAd?.targetCategory || "All"}
                          onChange={(e) =>
                            setCurrentAd({
                              ...currentAd,
                              targetCategory: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-all text-sm font-bold"
                        >
                          <option value="All">All Categories</option>
                          <option value="Writing">Writing</option>
                          <option value="Finance">Finance</option>
                          <option value="Crypto">Crypto</option>
                          <option value="Web3">Web3</option>
                          <option value="Growth">Growth</option>
                          <option value="Lifestyle">Lifestyle</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                          Creative Type
                        </label>
                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
                          {["image", "code"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() =>
                                setCurrentAd({ ...currentAd, type })
                              }
                              className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all ${
                                currentAd?.type === type
                                  ? "bg-white dark:bg-slate-700 shadow-md text-black dark:text-white"
                                  : "text-slate-500 dark:text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                        Placement Slot
                      </label>
                      <select
                        value={currentAd?.placement || "sidebar"}
                        onChange={(e) =>
                          setCurrentAd({
                            ...currentAd,
                            placement: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-all text-sm font-bold"
                      >
                        {currentAd?.targetPage === "home" ? (
                          <>
                            <option value="top">Header Billboard</option>
                            <option value="sidebar">Right Column Node</option>
                            <option value="bottom">Footer Stripe</option>
                          </>
                        ) : (
                          <>
                            <option value="sidebar">Article Sidebar</option>
                            <option value="inline">Post Body Native</option>
                            <option value="bottom">Post Footer Node</option>
                          </>
                        )}
                      </select>
                    </div>
                    {currentAd?.targetPage === "post" && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                          Creative Type
                        </label>
                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
                          {["image", "code"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() =>
                                setCurrentAd({ ...currentAd, type })
                              }
                              className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all ${
                                currentAd?.type === type
                                  ? "bg-white dark:bg-slate-700 shadow-md text-black dark:text-white"
                                  : "text-slate-500 dark:text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {currentAd?.type === "image" ? (
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                          Creative Poster URL
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={currentAd?.imageUrl || ""}
                            onChange={(e) =>
                              setCurrentAd({
                                ...currentAd,
                                imageUrl: e.target.value,
                              })
                            }
                            placeholder="https://images.unsplash.com/promo-banner.jpg"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-all text-sm font-bold"
                          />
                          <ImageIcon
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300"
                            size={20}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                          Destination URL
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={currentAd?.url || ""}
                            onChange={(e) =>
                              setCurrentAd({
                                ...currentAd,
                                url: e.target.value,
                              })
                            }
                            placeholder="https://example.com/checkout"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-all text-sm font-bold"
                          />
                          <ArrowUpRight
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300"
                            size={20}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                        HTML / Script Code
                      </label>
                      <textarea
                        value={currentAd?.code || ""}
                        onChange={(e) =>
                          setCurrentAd({ ...currentAd, code: e.target.value })
                        }
                        placeholder="<div class='ad-unit'>...</div>"
                        rows={4}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-all text-sm font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-12 flex gap-4">
                  <button
                    disabled={loading}
                    type="submit"
                    className="flex-1 bg-black dark:bg-white text-white dark:text-black py-5 rounded-3xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading
                      ? "Processing..."
                      : currentAd?.id
                        ? "Update Campaign"
                        : "Launch Campaign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-10 py-5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white rounded-3xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RevisionHistory({
  postId,
  onBack,
}: {
  postId: string;
  onBack: () => void;
}) {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "revisions"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (s) => {
      setRevisions(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [postId]);

  const handleRestore = async (rev: any) => {
    if (
      !confirm(
        "Are you sure you want to restore this version? Current state will be saved as a new revision first.",
      )
    )
      return;

    try {
      // Fetch current state to save before restoring
      const currentSnap = await getDoc(doc(db, "posts", postId));
      if (currentSnap.exists()) {
        const currentData = currentSnap.data();
        await addDoc(collection(db, "posts", postId, "revisions"), {
          ...currentData,
          updatedBy: "System (Restore)",
          updatedById: "system",
          createdAt: serverTimestamp(),
        });
      }

      // Perform restore
      const restoreData: any = {
        title: rev.title,
        excerpt: rev.excerpt,
        content: rev.content,
        category: rev.category,
        status: rev.status,
        updatedAt: serverTimestamp(),
      };
      
      if (rev.featuredImage !== undefined) {
        restoreData.featuredImage = rev.featuredImage;
      }
      
      await updateDoc(doc(db, "posts", postId), restoreData);

      onBack();
    } catch (error) {
      console.error("Restore failed:", error);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            Revision <span className="italic">History</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">
            Audit trail for Node ID: {postId}
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-black dark:text-slate-500 dark:hover:text-white"
        >
          Close Audit
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <Activity
            className="mx-auto text-slate-800 dark:text-slate-100 dark:text-slate-800 mb-6"
            size={48}
          />
          <p className="text-slate-700 dark:text-slate-200 dark:text-slate-700 font-serif italic text-xl">
            Accessing archives...
          </p>
        </div>
      ) : revisions.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-[48px]">
          <RotateCcw
            className="mx-auto text-slate-800 dark:text-slate-100 dark:text-slate-800 mb-6"
            size={64}
          />
          <p className="text-slate-500 dark:text-slate-300 dark:text-slate-700 font-serif italic text-xl">
            No previous versions found for this story.
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-600 uppercase font-black tracking-widest mt-4">
            History tracking begins from the first update
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {revisions.map((rev, i) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-slate-900 p-8 border border-slate-100 dark:border-slate-800 rounded-[32px] hover:shadow-xl hover:shadow-black/5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                      v.{revisions.length - i}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white dark:text-white">
                      {rev.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-serif italic mb-4 line-clamp-1">
                    {rev.excerpt}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:text-slate-400">
                        {rev.updatedBy?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {rev.updatedBy}
                      </span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                      {rev.createdAt?.toDate().toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(rev)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all opacity-0 group-hover:opacity-100"
                >
                  <RotateCcw size={12} />
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostCommentModeration({
  postId,
  onBack,
}: {
  postId: string;
  onBack: () => void;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (s) => {
      setComments(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [postId]);

  const updateStatus = async (
    commentId: string,
    status: "approved" | "rejected" | "flagged" | "pending",
  ) => {
    try {
      await updateDoc(doc(db, "posts", postId, "comments", commentId), {
        status,
      });
    } catch (error) {
      console.error("Moderation failed:", error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Permanent deletion. Proceed?")) return;
    await deleteDoc(doc(db, "posts", postId, "comments", commentId));
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            Content <span className="italic">Moderation</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">
            Filter, Approve, or Sanitize Node Responses
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-black dark:text-slate-500 dark:hover:text-white"
        >
          Exit Terminal
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <Activity
            className="mx-auto text-slate-800 dark:text-slate-100 dark:text-slate-800 mb-6"
            size={48}
          />
          <p className="text-slate-700 dark:text-slate-200 dark:text-slate-700 font-serif italic text-xl">
            Buffering interactions...
          </p>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-[48px]">
          <MessageCircle
            className="mx-auto text-slate-800 dark:text-slate-100 dark:text-slate-800 mb-6"
            size={64}
          />
          <p className="text-slate-500 dark:text-slate-300 dark:text-slate-700 font-serif italic text-xl">
            No responses detected in this node.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`p-8 border rounded-[32px] transition-all bg-white dark:bg-slate-900 shadow-sm ${
                c.status === "rejected"
                  ? "border-red-100 dark:border-red-900/30 opacity-60"
                  : c.status === "flagged"
                    ? "border-red-500 border-2 bg-red-50/50 dark:bg-red-900/10"
                    : "border-slate-100 dark:border-slate-800"
              }`}
            >
              {c.status === "flagged" && (
                <div className="mb-4">
                  <span className="bg-red-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full">
                    Flagged for Review
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-50 dark:border-slate-700">
                      {c.authorPhotoURL ? (
                        <img
                          src={c.authorPhotoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircle className="text-slate-700 dark:text-slate-200 dark:text-slate-700" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white dark:text-white">
                        {c.authorName}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                          {c.createdAt?.toDate().toLocaleString()}
                        </span>
                        <span
                          className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            c.status === "approved"
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                              : c.status === "rejected"
                                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                : c.status === "pending" || !c.status
                                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                  : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {c.status || "pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-serif text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>

                <div className="flex flex-col border-l border-slate-100 dark:border-slate-800 pl-8 shrink-0">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3 block">
                    Admin Actions
                  </span>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => updateStatus(c.id, "approved")}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        c.status === "approved"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(c.id, "flagged")}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        c.status === "flagged"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400"
                      }`}
                    >
                      Flag
                    </button>
                    <button
                      onClick={() => updateStatus(c.id, "rejected")}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        c.status === "rejected"
                          ? "bg-red-600 text-white"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                      }`}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostManagement({
  setPage,
  setAdminPostId,
}: {
  setPage: (p: AdminPage) => void;
  setAdminPostId: (id: string | null) => void;
}) {
  const { profile, isAdmin, isAuthor } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<any>(null);
  const [historyPostId, setHistoryPostId] = useState<string | null>(null);
  const [moderatePostId, setModeratePostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "title" | "status"
  >("newest");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "published" | "draft" | "review"
  >("all");
  const [filterCategory, setFilterCategory] =
    useState<string>("All Categories");
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, "categories")), (snap) => {
      setCategories(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "categories"));
    const unsubTags = onSnapshot(query(collection(db, "tags")), (snap) => {
      setTags(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "tags"));
    const unsubProducts = onSnapshot(query(collection(db, "products")), (snap) => {
      setProducts(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "products"));
    
    return () => {
      unsubCats();
      unsubTags();
      unsubProducts();
    };
  }, []);

  const CATEGORIES_LIST = categories.map(c => c.name);

  useEffect(() => {
    if (!profile) return;
    const q =
      profile.role === "admin"
        ? collection(db, "posts")
        : query(collection(db, "posts"), where("authorId", "==", profile.uid));

    return onSnapshot(
      q,
      (s) => setPosts(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        handleFirestoreError(err, OperationType.LIST, "posts");
      },
    );
  }, [profile]);

  const sortedAndFilteredPosts = useMemo(() => {
    let result = [...posts];
    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }
    if (filterCategory !== "All Categories") {
      result = result.filter((p) => p.category === filterCategory);
    }

    result.sort((a, b) => {
      if (sortBy === "newest")
        return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
      if (sortBy === "oldest")
        return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

    return result;
  }, [posts, sortBy, filterStatus, filterCategory]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload?path=posts/featured', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setCurrentPost({ ...currentPost, featuredImage: data.url });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const generateAIImage = async () => {
    if (!process.env.GEMINI_API_KEY) {
      alert("Gemini API Key is not configured in the environment.");
      return;
    }

    setGeneratingVisual(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: `Create a stylized, modern, high-quality editorial blog post cover image representing the category: ${currentPost.category || "Technology"}. Minimal text. Style: cinematic lighting, sleek.`,
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        // Upload the base64 to Local Storage
        const fetchResp = await fetch(imageUrl);
        const blob = await fetchResp.blob();
        
        const formData = new FormData();
        formData.append('file', blob, `ai_gen_${Date.now()}.png`);

        const response = await fetch('/api/upload?path=posts/featured', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        setCurrentPost({ ...currentPost, featuredImage: data.url });
      } else {
        alert("Failed to generate image. Please try again.");
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("AI Generation failed.");
    } finally {
      setGeneratingVisual(false);
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!currentPost) return;
    setLoading(true);
    try {
      if (currentPost.id) {
        // UPDATE Logic
        const original = posts.find((p) => p.id === currentPost.id);
        if (original && isAdmin) {
          await addDoc(collection(db, "posts", currentPost.id, "revisions"), {
            title: original.title || "",
            excerpt: original.excerpt || "",
            content: original.content || "",
            category: original.category || "Technology",
            status: original.status || "draft",
            featuredImage: original.featuredImage || null,
            updatedBy: profile?.displayName || "Admin",
            updatedById: profile?.uid || "system",
            createdAt: serverTimestamp(),
          });
        }

        const { id, ...updateData } = currentPost;
        await updateDoc(doc(db, "posts", id), {
          ...updateData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // CREATE Logic
        await addDoc(collection(db, "posts"), {
          ...currentPost,
          authorId: profile?.uid || "system",
          authorName: profile?.displayName || "Admin",
          featured: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentPost(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you absolutely sure? This action is irreversible."))
      return;
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const toggleFeatured = async (postId: string, current: boolean) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "posts", postId), { featured: !current });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  if (historyPostId) {
    return (
      <RevisionHistory
        postId={historyPostId}
        onBack={() => setHistoryPostId(null)}
      />
    );
  }

  if (moderatePostId) {
    return (
      <PostCommentModeration
        postId={moderatePostId}
        onBack={() => setModeratePostId(null)}
      />
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            Content <span className="italic">Nodes</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mt-2">
            Central Manuscript Management
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {filterStatus !== "all" && (
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">
              Status: {filterStatus}
              <button onClick={() => setFilterStatus("all")}>
                <PlusCircle size={10} className="rotate-45" />
              </button>
            </span>
          )}
          {filterCategory !== "All Categories" && (
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">
              Category: {filterCategory}
              <button onClick={() => setFilterCategory("All Categories")}>
                <PlusCircle size={10} className="rotate-45" />
              </button>
            </span>
          )}
          <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-slate-500 appearance-none cursor-pointer hover:text-black dark:hover:text-white transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title (A-Z)</option>
              <option value="status">Status</option>
            </select>
            <div className="w-[1px] h-4 self-center bg-slate-200 dark:bg-slate-800" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent border-none px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-slate-500 appearance-none cursor-pointer hover:text-black dark:hover:text-white transition-colors"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <div className="w-[1px] h-4 self-center bg-slate-200 dark:bg-slate-800" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent border-none px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-slate-500 appearance-none cursor-pointer hover:text-black dark:hover:text-white transition-colors"
            >
              <option value="All Categories">All Categories</option>
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setCurrentPost({
                title: "",
                excerpt: "",
                content: "",
                category: "Technology",
                status: "draft",
                featuredImage: "",
                readTime: "5 min read",
              });
              setIsEditing(true);
            }}
            className="flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-slate-100 transition-all shadow-xl shadow-black/10"
          >
            <PlusCircle size={14} /> New Manuscript
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {sortedAndFilteredPosts.map((post) => (
          <div
            key={post.id}
            className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[48px] overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col h-full border-b-[6px] border-b-transparent hover:border-b-indigo-600"
          >
            <div className="aspect-[16/10] relative overflow-hidden bg-slate-50 dark:bg-slate-800">
              {post.featuredImage ? (
                <img
                  src={post.featuredImage}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt=""
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700 dark:text-slate-200 dark:text-slate-700">
                  <ImageIcon size={48} />
                </div>
              )}
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <span
                  className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border ${
                    post.status === "published"
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600"
                      : "bg-slate-900/20 border-white/20 text-white"
                  }`}
                >
                  {post.status}
                </span>
                {post.featured && (
                  <div className="bg-amber-400 text-black p-1.5 rounded-full shadow-lg">
                    <Star size={10} fill="currentColor" />
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      setAdminPostId(post.id);
                      setPage("post-detail");
                    }}
                    className="flex-1 bg-white text-black py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    Inspect Node
                  </button>
                  <button
                    onClick={() => setHistoryPostId(post.id)}
                    className="flex-1 bg-white/20 backdrop-blur-md text-white py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-white/40 transition-colors"
                  >
                    Revision History
                  </button>
                  <button
                    onClick={() => {
                      setModeratePostId(post.id);
                    }}
                    className="bg-white/20 backdrop-blur-md text-white p-3 rounded-2xl hover:bg-white/40 transition-colors"
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {post.category}
                </span>
                <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-serif italic">
                  {post.readTime}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white mb-2 leading-tight line-clamp-2">
                {post.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-serif italic line-clamp-2 leading-relaxed mb-6">
                {post.excerpt}
              </p>

              <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <ThumbsUp size={12} />
                    <span className="text-[10px] font-bold">
                      {post.likesCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Eye size={12} />
                    <span className="text-[10px] font-bold">
                      {post.viewsCount || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <button
                      onClick={() => toggleFeatured(post.id, !!post.featured)}
                      className={`p-2 rounded-lg transition-colors ${post.featured ? "text-amber-500 hover:bg-amber-50" : "text-slate-500 dark:text-slate-300 hover:text-amber-500 hover:bg-amber-50"}`}
                      title={
                        post.featured
                          ? "Unmark as Featured"
                          : "Mark as Featured"
                      }
                    >
                      <Star
                        size={14}
                        fill={post.featured ? "currentColor" : "none"}
                      />
                    </button>
                  )}
                  {(isAdmin || isAuthor) && (
                    <button
                      onClick={() => {
                        setCurrentPost(post);
                        setIsEditing(true);
                      }}
                      className="p-2 text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                      title="Edit manuscript"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setHistoryPostId(post.id)}
                    className="p-2 text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                    title="Revision History"
                  >
                    <Layers size={14} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-slate-500 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete manuscript"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {sortedAndFilteredPosts.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[48px]">
            <FileText
              className="mx-auto text-slate-800 dark:text-slate-100 dark:text-slate-800 mb-6"
              size={64}
            />
            <p className="text-slate-500 dark:text-slate-300 dark:text-slate-600 font-serif italic text-xl">
              No manuscripts matching criteria found.
            </p>
            <button
              onClick={() => {
                setFilterStatus("all");
                setSortBy("newest");
              }}
              className="mt-6 text-[10px] font-black uppercase tracking-widest text-indigo-600 underline"
            >
              Reset Cluster Filters
            </button>
          </div>
        )}
      </div>

      {isEditing && currentPost && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[64px] border border-slate-100 dark:border-slate-800 shadow-2xl p-12 md:p-16 relative"
          >
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-12 right-12 text-slate-500 dark:text-slate-300 hover:text-black transition-colors"
            >
              <PlusCircle className="rotate-45" size={32} />
            </button>

            <div className="mb-12 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-300">
                  Manuscript Editor
                </span>
                <h3 className="text-4xl font-serif font-black tracking-tighter text-slate-900 dark:text-white dark:text-white mt-2">
                  {currentPost.id ? "Refine Story" : "Forge New Entry"}
                </h3>
              </div>
              {currentPost.id && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryPostId(currentPost.id);
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Clock size={14} /> Revision History
                </button>
              )}
            </div>

            <form
              onSubmit={handleSave}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2">
                    Headline
                  </label>
                  <input
                    value={currentPost.title}
                    onChange={(e) =>
                      setCurrentPost({ ...currentPost, title: e.target.value })
                    }
                    placeholder="Type a captivating title..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-3xl text-xl font-bold placeholder:text-slate-500 dark:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-4 ring-black/5 dark:text-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                    Excerpt (The Hook)
                  </label>
                  <textarea
                    value={currentPost.excerpt}
                    onChange={(e) =>
                      setCurrentPost({
                        ...currentPost,
                        excerpt: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="What is this story about at its core?"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-3xl text-sm font-medium leading-relaxed outline-none focus:ring-4 ring-black/5 dark:text-white transition-all resize-none"
                  />
                </div>

                {/* SEO Tools Section */}
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Search size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white dark:text-white">
                      SEO Optimization
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Meta Title
                    </label>
                    <input
                      value={currentPost.seoTitle || ""}
                      onChange={(e) =>
                        setCurrentPost({
                          ...currentPost,
                          seoTitle: e.target.value,
                        })
                      }
                      placeholder="Title for search engines..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-xs outline-none focus:ring-2 ring-indigo-500/20 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Meta Description
                    </label>
                    <textarea
                      value={currentPost.seoDescription || ""}
                      onChange={(e) =>
                        setCurrentPost({
                          ...currentPost,
                          seoDescription: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Brief summary for search results..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-xs outline-none focus:ring-2 ring-indigo-500/20 dark:text-white resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Meta Keywords
                    </label>
                    <input
                      value={currentPost.seoKeywords || ""}
                      onChange={(e) =>
                        setCurrentPost({
                          ...currentPost,
                          seoKeywords: e.target.value,
                        })
                      }
                      placeholder="news, technology, guide..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-xs outline-none focus:ring-2 ring-indigo-500/20 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2 flex justify-between items-center">
                      <span>Featured Image</span>
                      <div className="flex gap-3">
                        {!currentPost.featuredImage && (
                          <button
                            type="button"
                            onClick={generateAIImage}
                            disabled={generatingVisual}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors disabled:opacity-50"
                          >
                            {generatingVisual ? "Generating..." : "AI Generate"}
                          </button>
                        )}
                        <label className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                          {uploading ? "Uploading..." : "Upload"}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </label>
                    <input
                      value={currentPost.featuredImage || ""}
                      onChange={(e) =>
                        setCurrentPost({
                          ...currentPost,
                          featuredImage: e.target.value,
                        })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-mono outline-none focus:ring-4 ring-black/5 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                      Read Duration
                    </label>
                    <input
                      value={currentPost.readTime || ""}
                      onChange={(e) =>
                        setCurrentPost({
                          ...currentPost,
                          readTime: e.target.value,
                        })
                      }
                      placeholder="e.g. 8 min read"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-bold outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const currentTags = currentPost.tags || [];
                          if (currentTags.includes(tag.name)) {
                            setCurrentPost({
                              ...currentPost,
                              tags: currentTags.filter((t: string) => t !== tag.name)
                            });
                          } else {
                            setCurrentPost({
                              ...currentPost,
                              tags: [...currentTags, tag.name]
                            });
                          }
                        }}
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                          (currentPost.tags || []).includes(tag.name)
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                    {tags.length === 0 && <span className="text-xs text-slate-500 italic block py-2">No tags available. Add some in Tag Management.</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                    Linked Products
                  </label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {products.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          const currentLinked = currentPost.productIds || [];
                          if (currentLinked.includes(prod.id)) {
                            setCurrentPost({
                              ...currentPost,
                              productIds: currentLinked.filter((id: string) => id !== prod.id)
                            });
                          } else {
                            setCurrentPost({
                              ...currentPost,
                              productIds: [...currentLinked, prod.id]
                            });
                          }
                        }}
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                          (currentPost.productIds || []).includes(prod.id)
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {prod.name}
                      </button>
                    ))}
                    {products.length === 0 && <span className="text-xs text-slate-500 italic block py-2">No products available. Add some in Monetization.</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                      Post Type
                    </label>
                    <select
                      value={currentPost.postType || "Article"}
                      onChange={(e) =>
                        setCurrentPost({
                          ...currentPost,
                          postType: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none dark:text-white"
                    >
                      <option value="Article">Article</option>
                      <option value="Product Review">Product Review</option>
                      <option value="Story">Story</option>
                      <option value="News">News</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                      Category
                    </label>
                    <select
                      value={currentPost.category}
                      onChange={(e) =>
                        setCurrentPost({
                          ...currentPost,
                          category: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none dark:text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                      {categories.length === 0 && <option value="Uncategorized">Uncategorized</option>}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                      Status
                    </label>
                    <select
                      value={currentPost.status}
                      onChange={(e) =>
                        setCurrentPost({
                          ...currentPost,
                          status: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none dark:text-white"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  {currentPost.postType === "Product Review" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                        Review Score (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.5"
                        value={currentPost.reviewScore || ""}
                        onChange={(e) =>
                          setCurrentPost({
                            ...currentPost,
                            reviewScore: parseFloat(e.target.value),
                          })
                        }
                        placeholder="e.g. 4.5"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-bold outline-none dark:text-white"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                    Linked Products (Comma-separated Product IDs)
                  </label>
                  <input
                    value={(currentPost.linkedProducts || []).join(", ")}
                    onChange={(e) =>
                      setCurrentPost({
                        ...currentPost,
                        linkedProducts: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="PROD_ID1, PROD_ID2..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-mono outline-none dark:text-white"
                  />
                  <p className="text-[10px] text-slate-500 italic mt-1 px-2">
                    These products will be displayed below the post's content.
                  </p>
                </div>
              </div>

              <div className="space-y-8 flex flex-col">
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                    Narrative Content
                  </label>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-[40px] overflow-hidden border-none flex-1 flex flex-col min-h-[400px]">
                    <ReactQuill
                      theme="snow"
                      value={currentPost.content}
                      onChange={(val) =>
                        setCurrentPost({ ...currentPost, content: val })
                      }
                      className="bg-white dark:bg-slate-900 flex-1 flex flex-col dark:text-white"
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, 4, 5, 6, false] }],
                          ["bold", "italic", "underline", "strike"],
                          [{ color: [] }, { background: [] }],
                          [{ align: [] }],
                          ["blockquote", "code-block"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["link", "image", "video"],
                          ["clean"],
                        ],
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-black text-white p-6 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 shadow-2xl shadow-black/10"
                  >
                    {loading ? "Processing..." : "Sync Manuscript"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 p-6 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:text-black dark:hover:text-white transition-all"
                  >
                    Abort
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function IntegrationsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gaId, setGaId] = useState("");
  const [adsId, setAdsId] = useState("");
  const [cfToken, setCfToken] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "integrations");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGaId(data.gaMeasurementId || "");
          setAdsId(data.adsPublisherId || "");
          setCfToken(data.cloudflareToken || "");
        }
      } catch (err) {
        console.error("Error fetching integrations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "integrations"), {
        gaMeasurementId: gaId,
        adsPublisherId: adsId,
        cloudflareToken: cfToken,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("Integrations saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to save integrations.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl" />;

  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <h2 className="text-3xl font-serif font-black tracking-tight mb-2">Module <span className="italic">Integrations</span></h2>
        <p className="text-sm text-slate-500 font-medium">Configure third-party services and analytics providers.</p>
      </div>

      <div className="space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-indigo-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Google Analytics</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">Connect your Google Analytics 4 property to track user behavior.</p>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Measurement ID (G-XXXXXXXXXX)</label>
            <input 
              type="text" 
              value={gaId}
              onChange={(e) => setGaId(e.target.value)}
              placeholder="e.g. G-1234567890" 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="text-indigo-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Google Adsense</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">Enter your Google Publisher ID to enable programmatic advertising.</p>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Publisher ID (pub-XXXXXXXXXXXX)</label>
            <input 
              type="text" 
              value={adsId}
              onChange={(e) => setAdsId(e.target.value)}
              placeholder="e.g. pub-1234567890123456" 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-indigo-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cloudflare</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">Connect Cloudflare Web Analytics or Turnstile site key.</p>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Web Analytics Token / Site Key</label>
            <input 
              type="text" 
              value={cfToken}
              onChange={(e) => setCfToken(e.target.value)}
              placeholder="Enter your Cloudflare token" 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-95 active:scale-90 transition-all disabled:opacity-50"
          >
            {saving ? "Saving Configuration..." : "Save Integrations"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApiManagement() {
  const [apis, setApis] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [currentApi, setCurrentApi] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const ensureDigitalProductService = async () => {
      try {
        const q = query(
          collection(db, "api_management"),
          where("name", "==", "Digital Product Service"),
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          await addDoc(collection(db, "api_management"), {
            name: "Digital Product Service",
            method: "POST",
            endpoint: "/api/v1/inventory/products",
            description:
              "Manage digital assets, licenses, and software downloads. Create new products with tiered pricing and affiliate structures.",
            payload: JSON.stringify(
              {
                name: "Prototyper License",
                type: "software",
                price: 199.99,
                currency: "USD",
                features: ["Source Code", "Commercial License"],
                active: true,
              },
              null,
              2,
            ),
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    ensureDigitalProductService();
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "api_management"), (s) => {
      setApis(s.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!currentApi.name?.trim()) throw new Error("API Name is required.");
      if (!currentApi.endpoint?.trim().startsWith("/"))
        throw new Error("RESTful path must start with a forward slash (/).");

      if (currentApi.payload && currentApi.payload.trim() !== "") {
        try {
          JSON.parse(currentApi.payload);
        } catch (jsonErr) {
          throw new Error("Invalid JSON payload format.");
        }
      }

      const data = { ...currentApi, updatedAt: serverTimestamp() };
      if (!("active" in data)) data.active = true;

      if (currentApi.id) {
        const { id, ...updateData } = data;
        await updateDoc(doc(db, "api_management", id), updateData);
      } else {
        await addDoc(collection(db, "api_management"), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      setIsAdding(false);
      setCurrentApi(null);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Failed to save API Configuration",
      );
      if (error && typeof error === "object" && "code" in error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, "api_management");
        } catch (e: any) {
          console.error(e);
          setErrorMsg(
            e.message || "Failed to save API Configuration due to permissions.",
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteApi = async (id: string) => {
    if (!confirm("Revoke access and delete API config?")) return;
    try {
      await deleteDoc(doc(db, "api_management", id));
    } catch (error) {
      try {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `api_management/${id}`,
        );
      } catch (e: any) {
        console.error(e);
        alert("Failed to delete API: " + e.message);
      }
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            API <span className="italic">Control Plane</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">
            RESTful Integration & Node Security
          </p>
        </div>
        <div className="flex items-center gap-4">
          {apis.length === 0 && (
            <button
              onClick={async () => {
                setLoading(true);
                const seedApis = [
                  {
                    name: "Post Management Service",
                    method: "POST",
                    endpoint: "/api/posts",
                    description:
                      "Programmatically create, update, and moderate manuscript nodes.",
                    payload: JSON.stringify(
                      {
                        title: "New Node",
                        content: "<p>...</p>",
                        category: "Tech",
                      },
                      null,
                      2,
                    ),
                    active: true,
                  },
                  {
                    name: "Digital Product Webhook",
                    method: "GET",
                    endpoint: "/api/products",
                    description: "Fetch available managed digital assets.",
                    payload: "{}",
                    active: true,
                  },
                  {
                    name: "Digital Product Service",
                    method: "POST",
                    endpoint: "/api/v1/inventory/products",
                    description:
                      "Manage digital assets, licenses, and software downloads. Create new products with tiered pricing and affiliate structures.",
                    payload: JSON.stringify(
                      {
                        name: "Prototyper License",
                        type: "software",
                        price: 199.99,
                        currency: "USD",
                        features: ["Source Code", "Commercial License"],
                        active: true,
                      },
                      null,
                      2,
                    ),
                    active: true,
                  },
                ];
                for (const a of seedApis) {
                  try {
                    await addDoc(collection(db, "api_management"), {
                      ...a,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }
                setLoading(false);
              }}
              disabled={loading}
              className="flex items-center gap-3 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-sm disabled:opacity-50"
            >
              <Database size={14} /> Seed Nodes
            </button>
          )}
          <button
            onClick={() => {
              setCurrentApi({
                name: "",
                endpoint: "/api/",
                method: "GET",
                description: "",
                payload: "{}",
              });
              setIsAdding(true);
            }}
            className="flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl"
          >
            <Plus size={14} /> Register Node
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {apis.map((api) => (
          <div
            key={api.id}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[48px] hover:shadow-2xl hover:shadow-black/5 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Terminal size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white dark:text-white">
                    {api.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                      {api.method}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {api.endpoint}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentApi(api);
                    setIsAdding(true);
                  }}
                  className="p-2 text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deleteApi(api.id)}
                  className="p-2 text-slate-500 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-serif italic mb-6 line-clamp-2">
              {api.description}
            </p>
            <div className="bg-slate-50 dark:bg-black p-6 rounded-3xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Operational Payload
                </span>
                <button className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-600">
                  Copy JSON
                </button>
              </div>
              <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto scrollbar-hide">
                {api.payload}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[48px] shadow-2xl p-12 overflow-y-auto max-h-[90vh] scrollbar-hide border border-slate-100 dark:border-slate-800"
          >
            <h3 className="text-2xl font-serif font-black mb-8">
              {currentApi.id ? "Modify" : "Instate"}{" "}
              <span className="italic">API Config</span>
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/50">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    API Name
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentApi({
                          ...currentApi,
                          active: !currentApi.active,
                        })
                      }
                      className={`w-10 h-5 rounded-full relative transition-colors ${currentApi.active !== false ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${currentApi.active !== false ? "left-[22px]" : "left-0.5"}`}
                      />
                    </button>
                  </div>
                </div>
                <input
                  required
                  value={currentApi.name}
                  onChange={(e) =>
                    setCurrentApi({ ...currentApi, name: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-indigo-500/10 dark:text-white"
                  placeholder="Digital Product Service"
                />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    HTTP Method
                  </label>
                  <select
                    value={currentApi.method}
                    onChange={(e) =>
                      setCurrentApi({ ...currentApi, method: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-indigo-500/10 dark:text-white cursor-pointer"
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    RESTful Path
                  </label>
                  <input
                    required
                    value={currentApi.endpoint}
                    onChange={(e) =>
                      setCurrentApi({ ...currentApi, endpoint: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl text-sm font-mono outline-none focus:ring-4 ring-indigo-500/10 dark:text-white"
                    placeholder="/api/v1/content"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Description
                </label>
                <textarea
                  required
                  value={currentApi.description}
                  onChange={(e) =>
                    setCurrentApi({
                      ...currentApi,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl text-sm font-medium outline-none focus:ring-4 ring-indigo-500/10 dark:text-white leading-relaxed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2 flex justify-between">
                  Example Payload (JSON)
                  <span className="text-indigo-600 font-black">
                    RESTFUL SCHEMA
                  </span>
                </label>
                <textarea
                  value={currentApi.payload}
                  onChange={(e) =>
                    setCurrentApi({ ...currentApi, payload: e.target.value })
                  }
                  rows={8}
                  className={`w-full bg-slate-950 text-indigo-100/90 border-none p-6 rounded-[24px] text-xs font-mono outline-none focus:ring-4 ring-indigo-500/20 leading-relaxed scrollbar-hide`}
                  placeholder={'{\n  "key": "value"\n}'}
                  spellCheck={false}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-black text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? "Committing..." : "Commit Configuration"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors"
                >
                  Abort
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ApiDocumentation() {
  const [apis, setApis] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(collection(db, "api_management"), (s) => {
      setApis(s.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const apisByCategory = apis.reduce((acc: any, api: any) => {
    let category = "General Webhooks";
    if (api.endpoint) {
      if (api.endpoint.includes("inventory") || api.endpoint.includes("products")) category = "Products";
      else if (api.endpoint.includes("auth") || api.endpoint.includes("users")) category = "Authentication & Security";
      else if (api.endpoint.includes("content") || api.endpoint.includes("posts") || api.endpoint.includes("articles")) category = "Content Management";
      else if (api.endpoint.includes("ads") || api.endpoint.includes("marketing")) category = "Advertising & Marketing";
    }
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(api);
    return acc;
  }, {});

  return (
    <div className="space-y-12">
      <div className="max-w-3xl">
        <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
          API <span className="italic">Documentation</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-3 leading-relaxed">
          A comprehensive guide for integrating with the Chrica Content Mesh.
          Use these endpoints to synchronize product, moderate content, and
          manage advertising placement nodes.
        </p>
      </div>

      {apis.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-16 rounded-[48px] text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Terminal size={48} className="mx-auto text-slate-500 dark:text-slate-300 mb-6" />
          <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white dark:text-white mb-2">
            No Integration Nodes Found
          </h3>
          <p className="text-sm font-serif italic text-slate-500 mb-8 max-w-md mx-auto">
            There are currently no APIs registered. You can configure them
            manually in API Management, or seed demo nodes from the Dashboard.
          </p>
        </div>
      )}

      {apis.length > 0 && (
        <div className="space-y-24">
          {Object.entries(apisByCategory).map(([category, categoryApis]: any) => (
            <div key={category} className="space-y-12">
              <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-100 pb-4 dark:text-white dark:border-slate-800">
                  {category}
              </h3>
              <div className="space-y-20">
                {categoryApis.map((api: any, idx: number) => (
                  <div key={api.id} className="relative">
                    {idx !== categoryApis.length - 1 && (
                      <div className="absolute left-6 top-24 bottom-0 w-[1px] bg-slate-100 dark:bg-slate-800" />
                    )}
                    <div className="flex gap-8">
                      <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shrink-0 text-xs font-black z-10 border-4 border-white dark:border-slate-950">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-8">
                        <div>
                          <h3 className="text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white mb-2">
                            {api.name}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 font-serif italic">
                            {api.description}
                          </p>
                        </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                        Endpoint Endpoint
                      </span>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800">
                        <span className="px-2 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg">
                          {api.method}
                        </span>
                        <code className="text-xs font-mono text-slate-900 dark:text-white dark:text-slate-300">
                          {api.endpoint}
                        </code>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                        Authentication
                      </span>
                      <p className="text-xs text-slate-500 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 font-bold italic">
                        Requires a valid `X-Chrica-Api-Key` header with RBAC
                        permissions for {api.name.toLowerCase()}.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 lg:col-span-2">
                    <div className="flex justify-between items-center px-1 border-b border-slate-100 dark:border-slate-800/50 pb-2 mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white dark:text-white">
                        Runnable Example (fetch)
                      </span>
                      <button
                        onClick={() => {
                          try {
                            const parsedPayload =
                              api.payload && api.payload !== "{}"
                                ? JSON.parse(api.payload)
                                : null;
                            const formattedPayload = parsedPayload
                              ? JSON.stringify(parsedPayload, null, 2).replace(
                                  /\n/g,
                                  "\n  ",
                                )
                              : "";

                            const code = `fetch('https://api.chrica.app${api.endpoint}', {\n  method: '${api.method}',\n  headers: {\n    'Content-Type': 'application/json',\n    'X-Chrica-Api-Key': 'YOUR_API_KEY'\n  }${parsedPayload && api.method !== "GET" ? `,\n  body: JSON.stringify(${formattedPayload})` : ""}\n})\n.then(res => res.json())\n.then(data => console.log(data))\n.catch(err => console.error('Error:', err));`;
                            navigator.clipboard.writeText(code);
                            setCopiedId(api.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          } catch (e) {
                            alert(
                              "Error formatting payload. Check JSON format.",
                            );
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-[9px] font-black uppercase tracking-[0.1em] text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      >
                        {copiedId === api.id ? <CheckCircle size={12} /> : <Terminal size={12} />}
                        {copiedId === api.id ? "Copied" : "Copy Snippet"}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Terminal size={14} className="text-indigo-400" />
                      </div>
                      <pre className="text-xs font-mono text-indigo-100/90 overflow-x-auto scrollbar-hide whitespace-pre-wrap leading-relaxed">
                        {`fetch('https://api.chrica.app${api.endpoint}', {
  method: '${api.method}',
  headers: {
    'Content-Type': 'application/json',
    'X-Chrica-Api-Key': 'YOUR_API_KEY'
  }${
    api.method !== "GET" && api.payload && api.payload !== "{}"
      ? `,\n  body: JSON.stringify(${(() => {
          try {
            return JSON.stringify(JSON.parse(api.payload), null, 2).replace(
              /\\n/g,
              "\\n  ",
            );
          } catch (e) {
            return api.payload;
          }
        })()})`
      : ""
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error('Error:', err));`}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-4 lg:col-span-2">
                    <div className="flex justify-between items-center px-1 border-b border-slate-100 dark:border-slate-800/50 pb-2 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                        Example Payload
                      </span>
                      <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                        application/json
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Code2 size={16} className="text-slate-500 dark:text-slate-400" />
                      </div>
                      <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto scrollbar-hide leading-relaxed">
                        {api.payload}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthorManagement() {
  const [authors, setAuthors] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAuthor, setNewAuthor] = useState({
    displayName: "",
    email: "",
    role: "author",
    photoURL: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(
      query(collection(db, "users")),
      (s) => setAuthors(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.LIST, "users"),
    );
    const unsubRoles = onSnapshot(
      collection(db, "roles"),
      (s) => setRoles(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.LIST, "roles"),
    );
    return () => {
      unsubUsers();
      unsubRoles();
    };
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, "users"), {
        ...newAuthor,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewAuthor({
        displayName: "",
        email: "",
        role: "author",
        photoURL: "",
        bio: "",
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "users");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
            Personnel <span className="italic">Directory</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">
            Authors and Contributors Management
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
        >
          <Plus size={14} /> Onboard Personnel
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[48px] shadow-2xl p-12 border border-slate-100 dark:border-slate-800"
          >
            <h3 className="text-2xl font-serif font-black mb-8">
              Register New <span className="italic">Personnel Node</span>
            </h3>
            <form onSubmit={handleAddAuthor} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Display Name
                  </label>
                  <input
                    required
                    value={newAuthor.displayName}
                    onChange={(e) =>
                      setNewAuthor({
                        ...newAuthor,
                        displayName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-indigo-500/10 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={newAuthor.email}
                    onChange={(e) =>
                      setNewAuthor({ ...newAuthor, email: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-indigo-500/10 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Personnel Role
                </label>
                <select
                  value={newAuthor.role}
                  onChange={(e) =>
                    setNewAuthor({ ...newAuthor, role: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl text-sm font-bold outline-none dark:text-white"
                >
                  <option value="author">Author</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Photo Access Point (URL)
                </label>
                <input
                  value={newAuthor.photoURL}
                  onChange={(e) =>
                    setNewAuthor({ ...newAuthor, photoURL: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-indigo-500/10 dark:text-white"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-black text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                >
                  {saving ? "Onboarding..." : "Confirm Registration"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  Abort
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {authors.map((a) => (
          <div
            key={a.id}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-[48px] hover:shadow-2xl hover:shadow-black/5 transition-all text-center group"
          >
            <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 mx-auto mb-6 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden flex items-center justify-center text-slate-700 dark:text-slate-200 dark:text-slate-700">
              {a.photoURL ? (
                <img
                  src={a.photoURL}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <UserCircle size={80} />
              )}
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white dark:text-white mb-1">
              {a.displayName}
            </h4>

            <div className="mb-6">
              <select
                value={a.role}
                onChange={(e) => updateRole(a.id, e.target.value)}
                className="bg-transparent text-[10px] font-black text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest p-1 border-none outline-none cursor-pointer hover:text-black dark:hover:text-white transition-colors"
              >
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <option key={r.id} value={r.name.toLowerCase()}>
                      {r.name}
                    </option>
                  ))
                ) : (
                  <option value={a.role}>{a.role}</option>
                )}
              </select>
            </div>

            <div className="flex bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl divide-x divide-slate-200 dark:divide-slate-700 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="flex-1 px-4 min-w-[80px]">
                <p className="text-sm font-black text-slate-900 dark:text-white dark:text-white">
                  12
                </p>
                <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  Articles
                </p>
              </div>
              <div className="flex-1 px-4 min-w-[80px]">
                <p className="text-sm font-black text-slate-900 dark:text-white dark:text-white">
                  1.2k
                </p>
                <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  Followers
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileView({
  onBack,
  onStoryClick,
}: {
  onBack: () => void;
  onStoryClick: (story: any) => void;
}) {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.displayName || "");
  const [editPhoto, setEditPhoto] = useState(profile?.photoURL || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  
  const [bookmarkedStories, setBookmarkedStories] = useState<any[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  const [activeTab, setActiveTab] = useState<"stories" | "bookmarks" | "about">(
    profile?.role === "author" || profile?.role === "admin" || profile?.role === "editor" ? "stories" : "bookmarks"
  );

  useEffect(() => {
    if (profile) {
      setEditName(profile.displayName);
      setEditPhoto(profile.photoURL);
      setEditBio(profile.bio || "");

      // Stories
      if (profile.role === "author" || profile.role === "admin" || profile.role === "editor") {
        const q = query(
          collection(db, "posts"),
          where("authorId", "==", profile.uid),
          orderBy("createdAt", "desc"),
        );

        const unsub = onSnapshot(
          q,
          (snap) => {
            setUserStories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoadingStories(false);
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, "posts");
            setLoadingStories(false);
          },
        );
        return () => unsub();
      } else {
        setLoadingStories(false);
      }
    }
  }, [profile]);
  
  useEffect(() => {
    if (profile?.bookmarks && profile.bookmarks.length > 0) {
      setLoadingBookmarks(true);
      const q = query(
        collection(db, "posts"),
        where("__name__", "in", profile.bookmarks.slice(0, 10))
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          setBookmarkedStories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoadingBookmarks(false);
        },
        (err) => {
          console.error("Bookmarks error", err);
          handleFirestoreError(err, OperationType.LIST, "posts");
          setLoadingBookmarks(false);
        }
      );
      return () => unsub();
    } else {
      setBookmarkedStories([]);
      setLoadingBookmarks(false);
    }
  }, [profile?.bookmarks]);

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload?path=users/profiles', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setEditPhoto(data.url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), {
        displayName: editName,
        photoURL: editPhoto,
        bio: editBio,
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-32 pb-40 px-4 md:px-20 transition-colors"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 px-4">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 overflow-hidden">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              ) : (
                <UserCircle size={80} />
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tighter text-slate-900 dark:text-white dark:text-white mb-2">
                {profile?.displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-serif italic">
                <span className="capitalize">{profile?.role}</span>
                <span>·</span>
                <span>1.2k Followers</span>
                {profile?.bio && (
                  <>
                    <span>·</span>
                    <span className="text-slate-500 dark:text-slate-400 not-italic">
                      {profile.bio}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-bold hover:border-black dark:hover:border-white transition-all self-start md:self-center bg-white dark:bg-slate-900"
          >
            Edit profile
          </button>
        </div>

        <div className="mt-12 flex gap-4 border-b border-slate-100 dark:border-slate-800 px-4">
          {(profile?.role === "author" || profile?.role === "admin" || profile?.role === "editor") && (
            <button
              onClick={() => setActiveTab("stories")}
              className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-colors ${
                activeTab === "stories"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              Stories
            </button>
          )}
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-colors ${
              activeTab === "bookmarks"
                ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            Bookmarks
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-colors ${
              activeTab === "about"
                ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            About
          </button>
        </div>

        <div className="mt-10 px-4">
          {activeTab === "stories" && (
            <div>
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900 dark:text-white dark:text-white">
                  Published <span className="italic">Stories</span>
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <FileText size={14} /> {userStories.length} Articles
                </div>
              </div>

              {loadingStories ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400 font-serif italic">
                    Accessing archives...
                  </p>
                </div>
              ) : userStories.length === 0 ? (
                <div className="p-20 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-[40px] bg-slate-50/50 dark:bg-slate-900/30">
                  <p className="text-slate-500 dark:text-slate-300 font-serif italic text-xl">
                    No stories published yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userStories.map((story) => (
                    <div
                      key={story.id}
                      className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[40px] hover:shadow-xl hover:shadow-black/5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer"
                      onClick={() => onStoryClick(story)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {story.postType || story.category || "Article"}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-serif italic">
                            {story.createdAt
                              ?.toDate()
                              .toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white group-hover:text-indigo-600 transition-colors">
                          {story.title}
                        </h3>
                      </div>
                      <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                        View Article{" "}
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "bookmarks" && (
            <div>
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
                  Bookmarked <span className="italic">Stories</span>
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <Bookmark size={14} /> {bookmarkedStories.length} Saved
                </div>
              </div>

              {loadingBookmarks ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400 font-serif italic">
                    Loading bookmarks...
                  </p>
                </div>
              ) : bookmarkedStories.length === 0 ? (
                <div className="p-20 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-[40px] bg-slate-50/50 dark:bg-slate-900/30">
                  <p className="text-slate-500 dark:text-slate-300 font-serif italic text-xl">
                    No bookmarks yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bookmarkedStories.map((story) => (
                    <div
                      key={story.id}
                      className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[40px] hover:shadow-xl hover:shadow-black/5 transition-all flex flex-col justify-between cursor-pointer"
                      onClick={() => onStoryClick(story)}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {story.postType || story.category || "Article"}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {story.title}
                        </h3>
                        <p className="text-sm font-serif italic text-slate-500 dark:text-slate-400 line-clamp-3">
                          {story.excerpt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="max-w-2xl">
               <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900 dark:text-white mb-6">
                  About <span className="italic">Me</span>
               </h2>
               <div className="prose prose-slate dark:prose-invert prose-lg prose-p:font-serif prose-p:text-slate-800 dark:prose-p:text-slate-300">
                 {profile?.bio ? (
                    <p>{profile.bio}</p>
                 ) : (
                    <p className="italic text-slate-400">No bio provided.</p>
                 )}
               </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-16 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-slate-100 dark:border-slate-800"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1">
                    Photo URL or Upload
                  </label>
                  <div className="flex flex-col gap-2 relative">
                    <input
                      type="text"
                      value={editPhoto}
                      onChange={(e) => setEditPhoto(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white pr-12"
                      placeholder="https://..."
                    />
                    <label className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      {uploading ? "..." : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={2000}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white h-24 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-3 rounded-full text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-b border-slate-50 dark:border-slate-800 mb-12 flex items-center gap-8 px-4">
          {["Home", "About"].map((t, i) => (
            <button
              key={t}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors ${i === 0 ? "text-black dark:text-white border-b border-black dark:border-white" : "text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-12">
            {loadingStories ? (
              <div className="space-y-8 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-40 bg-slate-50 dark:bg-slate-900 rounded-[32px]"
                  />
                ))}
              </div>
            ) : userStories.length > 0 ? (
              <div className="space-y-8">
                {userStories.map((story) => (
                  <div
                    key={story.id}
                    className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[32px] hover:shadow-2xl hover:shadow-black/5 transition-all cursor-pointer"
                    onClick={() => {
                      // Note: In this architecture, we usually navigate via setView('story') and setSelectedStory(story)
                      // but ProfileView doesn't have access to these.
                      // It might be better to lift navigation state or use a global store.
                      // For now, let's assume if it's integrated in Root, we can handle it.
                      // But ProfileView is a sub-component.
                      window.dispatchEvent(
                        new CustomEvent("navigate-story", { detail: story }),
                      );
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                        {story.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {story.createdAt
                          ?.toDate()
                          .toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white dark:text-white mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                      {story.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-serif italic line-clamp-2">
                      {story.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-[48px] bg-slate-50/10 dark:bg-slate-900/10">
                <p className="text-slate-500 dark:text-slate-300 dark:text-slate-700 font-serif italic text-xl text-center flex flex-col items-center gap-4">
                  <span className="w-16 h-16 rounded-full border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center opacity-50">
                    <PenSquare size={24} />
                  </span>
                  No stories published yet.
                </p>
                <button className="mt-8 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors">
                  Start your first draft
                </button>
              </div>
            )}
          </div>
          <div>
            <SubscribeModule variant="compact" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function WriteView({ onCancel }: { onCancel: () => void }) {
  const { profile } = useAuth();
  const [currentPost, setCurrentPost] = useState<any>({
    title: "",
    excerpt: "",
    content: "",
    category: "Technology",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    featuredImage: "",
    readTime: "",
    tags: [],
    status: "published",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, "categories")), (snap) => {
      setCategories(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, () => {});
    const unsubTags = onSnapshot(query(collection(db, "tags")), (snap) => {
      setTags(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, () => {});
    const unsubProducts = onSnapshot(query(collection(db, "products")), (snap) => {
      setProducts(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, () => {});
    return () => {
      unsubCats();
      unsubTags();
      unsubProducts();
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload?path=posts/featured', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setCurrentPost({ ...currentPost, featuredImage: data.url });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const generateAIImage = async () => {
    if (!process.env.GEMINI_API_KEY) {
      alert("Gemini API Key is not configured.");
      return;
    }

    setGeneratingVisual(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: `Create a stylized, modern, high-quality editorial blog post cover image representing the category: ${currentPost.category || "Technology"}. Minimal text. Style: cinematic lighting, sleek.`,
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        // Upload the base64 to Local Storage
        const fetchResp = await fetch(imageUrl);
        const blob = await fetchResp.blob();
        
        const formData = new FormData();
        formData.append('file', blob, `ai_gen_${Date.now()}.png`);

        const response = await fetch('/api/upload?path=posts/featured', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        setCurrentPost({ ...currentPost, featuredImage: data.url });
      } else {
        alert("Failed to generate image. Please try again.");
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("AI Generation failed.");
    } finally {
      setGeneratingVisual(false);
    }
  };

  const handlePublish = async (e: any) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "posts"), {
        ...currentPost,
        authorId: profile?.uid,
        authorName: profile?.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onCancel();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-white dark:bg-slate-950 z-[200] overflow-y-auto text-slate-900 dark:text-white dark:text-slate-100"
    >
      <nav className="h-16 px-6 md:px-20 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <span className="text-xl font-serif font-black italic select-none">
            Write Manuscript
          </span>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <button
            onClick={onCancel}
            className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2"
            title="Cancel"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest">Abort</span>
            <PlusCircle className="rotate-45" size={24} />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-12 pb-40">
        <form
          onSubmit={handlePublish}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2">
                Headline
              </label>
              <input
                value={currentPost.title}
                onChange={(e) =>
                  setCurrentPost({ ...currentPost, title: e.target.value })
                }
                placeholder="Type a captivating title..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-3xl text-xl font-bold placeholder:text-slate-500 dark:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-4 ring-black/5 dark:text-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                Excerpt (The Hook)
              </label>
              <textarea
                value={currentPost.excerpt}
                onChange={(e) =>
                  setCurrentPost({
                    ...currentPost,
                    excerpt: e.target.value,
                  })
                }
                rows={4}
                placeholder="What is this story about at its core?"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-3xl text-sm font-medium leading-relaxed outline-none focus:ring-4 ring-black/5 dark:text-white transition-all resize-none"
              />
            </div>

            {/* SEO Tools Section */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Search size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                  SEO Optimization
                </span>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Meta Title
                </label>
                <input
                  value={currentPost.seoTitle || ""}
                  onChange={(e) =>
                    setCurrentPost({
                      ...currentPost,
                      seoTitle: e.target.value,
                    })
                  }
                  placeholder="Title for search engines..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-xs outline-none focus:ring-2 ring-indigo-500/20 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Meta Description
                </label>
                <textarea
                  value={currentPost.seoDescription || ""}
                  onChange={(e) =>
                    setCurrentPost({
                      ...currentPost,
                      seoDescription: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Brief summary for search results..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-xs outline-none focus:ring-2 ring-indigo-500/20 dark:text-white resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Meta Keywords
                </label>
                <input
                  value={currentPost.seoKeywords || ""}
                  onChange={(e) =>
                    setCurrentPost({
                      ...currentPost,
                      seoKeywords: e.target.value,
                    })
                  }
                  placeholder="news, technology, guide..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-xs outline-none focus:ring-2 ring-indigo-500/20 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2 flex justify-between items-center">
                  <span>Featured Image</span>
                  <div className="flex gap-3">
                    {!currentPost.featuredImage && (
                      <button
                        type="button"
                        onClick={generateAIImage}
                        disabled={generatingVisual}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors disabled:opacity-50"
                      >
                        {generatingVisual ? "Generating..." : "AI Generate"}
                      </button>
                    )}
                    <label className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                      {uploading ? "Uploading..." : "Upload"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </label>
                <input
                  value={currentPost.featuredImage || ""}
                  onChange={(e) =>
                    setCurrentPost({
                      ...currentPost,
                      featuredImage: e.target.value,
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-mono outline-none focus:ring-4 ring-black/5 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                  Read Duration
                </label>
                <input
                  value={currentPost.readTime || ""}
                  onChange={(e) =>
                    setCurrentPost({
                      ...currentPost,
                      readTime: e.target.value,
                    })
                  }
                  placeholder="e.g. 5 min"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-bold outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      const currentTags = currentPost.tags || [];
                      if (currentTags.includes(tag.name)) {
                        setCurrentPost({
                          ...currentPost,
                          tags: currentTags.filter((t: string) => t !== tag.name)
                        });
                      } else {
                        setCurrentPost({
                          ...currentPost,
                          tags: [...currentTags, tag.name]
                        });
                      }
                    }}
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                      (currentPost.tags || []).includes(tag.name)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && <span className="text-xs text-slate-500 italic block py-2">No tags available. Add some in Administration.</span>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                Linked Products
              </label>
              <div className="flex flex-wrap gap-2 pt-2">
                {products.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      const currentLinked = currentPost.productIds || [];
                      if (currentLinked.includes(prod.id)) {
                        setCurrentPost({
                          ...currentPost,
                          productIds: currentLinked.filter((id: string) => id !== prod.id)
                        });
                      } else {
                        setCurrentPost({
                          ...currentPost,
                          productIds: [...currentLinked, prod.id]
                        });
                      }
                    }}
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                      (currentPost.productIds || []).includes(prod.id)
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {prod.name}
                  </button>
                ))}
                {products.length === 0 && <span className="text-xs text-slate-500 italic block py-2">No products available. Add some in Monetization.</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                  Post Type
                </label>
                <select
                  value={currentPost.postType || "Article"}
                  onChange={(e) =>
                    setCurrentPost({
                      ...currentPost,
                      postType: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none dark:text-white"
                >
                  <option value="Article">Article</option>
                  <option value="Product Review">Product Review</option>
                  <option value="Story">Story</option>
                  <option value="News">News</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                  Category
                </label>
                <select
                  value={currentPost.category}
                  onChange={(e) =>
                    setCurrentPost({
                      ...currentPost,
                      category: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {categories.length === 0 && <option value="Uncategorized">Uncategorized</option>}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                  Status
                </label>
                <select
                  value={currentPost.status}
                  onChange={(e) =>
                    setCurrentPost({
                      ...currentPost,
                      status: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none dark:text-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {currentPost.postType === "Product Review" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                    Review Score (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={currentPost.reviewScore || ""}
                    onChange={(e) =>
                      setCurrentPost({
                        ...currentPost,
                        reviewScore: parseFloat(e.target.value),
                      })
                    }
                    placeholder="e.g. 4.5"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-6 rounded-2xl text-[10px] font-bold outline-none dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 flex flex-col">
            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2">
                Narrative Content
              </label>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-[40px] overflow-hidden border-none flex-1 flex flex-col min-h-[400px]">
                <ReactQuill
                  theme="snow"
                  value={currentPost.content}
                  onChange={(val) =>
                    setCurrentPost({ ...currentPost, content: val })
                  }
                  className="bg-white dark:bg-slate-900 flex-1 flex flex-col dark:text-white"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ color: [] }, { background: [] }],
                      [{ align: [] }],
                      ["blockquote", "code-block"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link", "image", "video"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black p-6 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-slate-200 transition-all disabled:opacity-50 shadow-2xl shadow-black/10"
              >
                {loading ? "Processing..." : "Publish Manuscript"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function AboutUs({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="min-h-screen bg-white dark:bg-slate-950"
    >
      <nav className="h-16 px-6 md:px-20 flex items-center justify-between border-b border-black/5 dark:border-white/5 sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="text-xl font-serif font-black italic select-none text-slate-900 dark:text-white">
            About Us
          </span>
        </div>
        <button
          onClick={onBack}
          className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Back to Home</span>
          <PlusCircle className="rotate-45" size={20} />
        </button>
      </nav>

      <div className="max-w-4xl mx-auto pt-20 pb-40 px-4 md:px-20">
        <div className="mb-16 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-300 mb-4">
            Our Mission
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter text-slate-900 dark:text-white mb-6">
            Bringing you the <br className="hidden md:block" />
            <span className="italic text-indigo-600 font-black">
              news that matters.
            </span>
          </h1>
          <p className="text-xl text-slate-500 font-serif italic max-w-2xl mx-auto leading-relaxed">
            In a fast-paced world, we are committed to delivering accurate,
            impartial, and in-depth news. Chrica is your trusted source for
            global events, business, technology, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-24">
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
              Trusted by millions daily.
            </h3>
            <p className="text-slate-500 leading-relaxed">
              We provide comprehensive coverage of the most important stories
              shaping our world. Our team of dedicated journalists and
              contributors work tirelessly to bring you the facts.
            </p>
            <p className="text-slate-500 leading-relaxed">
              Whether you are tracking financial markets, technological
              breakthroughs, or global politics, we ensure you stay informed.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-12 rounded-[64px] border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            <div className="space-y-8">
              <div>
                <div className="text-3xl font-serif font-black text-slate-900 dark:text-white">
                  24/7
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                  Global Coverage
                </div>
              </div>
              <div>
                <div className="text-3xl font-serif font-black text-slate-900 dark:text-white">
                  100+
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                  News Categories
                </div>
              </div>
              <div>
                <div className="text-3xl font-serif font-black text-slate-900 dark:text-white">
                  Live
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                  Real-time Updates
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="min-h-screen bg-white dark:bg-slate-950"
    >
      <nav className="h-16 px-6 md:px-20 flex items-center justify-between border-b border-black/5 dark:border-white/5 sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="text-xl font-serif font-black italic select-none text-slate-900 dark:text-white">
            Privacy Policy
          </span>
        </div>
        <button
          onClick={onBack}
          className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Back to Home</span>
          <PlusCircle className="rotate-45" size={20} />
        </button>
      </nav>

      <div className="max-w-3xl mx-auto pt-20 pb-40 px-4 md:px-20 space-y-8 text-slate-800 dark:text-slate-200">
        <h1 className="text-4xl font-serif font-black mb-10 text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="leading-relaxed">Last updated: May 2026</p>
        <p className="leading-relaxed">
          At Chrica, we take your privacy seriously. This privacy policy describes
          how we collect, use, and handle your personal information when you use
          our news application and services.
        </p>
        <h2 className="text-2xl font-serif font-bold mt-8 mb-4">1. Information We Collect</h2>
        <p className="leading-relaxed">
          We collect information to provide better services to all our users. This
          includes information you provide us directly, such as when you create an
          account, and information we get from your use of our services, like your
          reading preferences and device details.
        </p>
        <h2 className="text-2xl font-serif font-bold mt-8 mb-4">2. How We Use Information</h2>
        <p className="leading-relaxed">
          We use the information we collect to provide, maintain, and improve our
          news delivery, to develop new features, and to protect Chrica and our
          users. We also use this information to offer you customized content, like
          giving you more relevant news recommendations.
        </p>
        <h2 className="text-2xl font-serif font-bold mt-8 mb-4">3. Information Security</h2>
        <p className="leading-relaxed">
          We work hard to protect Chrica and our users from unauthorized access to
          or unauthorized alteration, disclosure, or destruction of information we
          hold.
        </p>
      </div>
    </motion.div>
  );
}

function TermsOfService({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="min-h-screen bg-white dark:bg-slate-950"
    >
      <nav className="h-16 px-6 md:px-20 flex items-center justify-between border-b border-black/5 dark:border-white/5 sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="text-xl font-serif font-black italic select-none text-slate-900 dark:text-white">
            Terms of Service
          </span>
        </div>
        <button
          onClick={onBack}
          className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Back to Home</span>
          <PlusCircle className="rotate-45" size={20} />
        </button>
      </nav>

      <div className="max-w-3xl mx-auto pt-20 pb-40 px-4 md:px-20 space-y-8 text-slate-800 dark:text-slate-200">
        <h1 className="text-4xl font-serif font-black mb-10 text-slate-900 dark:text-white">Terms of Service</h1>
        <p className="leading-relaxed">Last updated: May 2026</p>
        <p className="leading-relaxed">
          Welcome to Chrica. By accessing or using our news platform, you agree to be
          bound by these Terms of Service and our Privacy Policy.
        </p>
        <h2 className="text-2xl font-serif font-bold mt-8 mb-4">1. Use of Our Services</h2>
        <p className="leading-relaxed">
          You must follow any policies made available to you within the Services. You
          may not misuse our Services. For example, don't interfere with our Services
          or try to access them using a method other than the interface and the
          instructions that we provide.
        </p>
        <h2 className="text-2xl font-serif font-bold mt-8 mb-4">2. Your Content in our Services</h2>
        <p className="leading-relaxed">
          Some of our Services allow you to upload, submit, store, send or receive
          content (such as comments on news articles). You retain ownership of any
          intellectual property rights that you hold in that content.
        </p>
        <h2 className="text-2xl font-serif font-bold mt-8 mb-4">3. Modifying and Terminating our Services</h2>
        <p className="leading-relaxed">
          We are constantly changing and improving our Services. We may add or remove
          functionalities or features, and we may suspend or stop a Service
          altogether.
        </p>
      </div>
    </motion.div>
  );
}

// --- Root Application View ---

function Root() {
  const [stories, setStories] = useState<any[]>([]);
  const [isStoriesLoading, setIsStoriesLoading] = useState(true);
  const [view, setView] = useState<ViewState>("feed");
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard");
  const [adminPostId, setAdminPostId] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["All"]);
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    setIsStoriesLoading(true);
    const q = query(
      collection(db, "posts"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        console.log("Firestore Fetch Success:", snap.docs.length, "posts found in database:", (db as any)._databaseId?.databaseId || "(default)");
        setStories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setIsStoriesLoading(false);
      },
      (err) => {
        console.error("Firestore Fetch Error:", err.code, err.message);
        handleFirestoreError(err, OperationType.LIST, "posts");
        setIsStoriesLoading(false);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    initGA();

    const handleNavigateStory = (e: any) => {
      setSelectedStory(e.detail);
      setView("story");
    };
    window.addEventListener("navigate-story", handleNavigateStory);

    // Initialize Dummy Data
    const initDummyData = async () => {
      if (!isAdmin) return;

      try {
        // 1. Roles (if empty)
        const roleSnap = await getDocs(collection(db, "roles"));
        if (roleSnap.empty) {
          const defaults = [
            {
              name: "Admin",
              description: "Full system authorization",
              permissions: API_PERMISSIONS.map((p) => p.id),
              type: "system",
              createdAt: serverTimestamp(),
            },
            {
              name: "Author",
              description: "Manuscript creation privileges",
              permissions: ["api:content"],
              type: "system",
              createdAt: serverTimestamp(),
            },
            {
              name: "Guest",
              description: "Read-only access level",
              permissions: [],
              type: "guest",
              createdAt: serverTimestamp(),
            },
          ];
          for (const d of defaults) await addDoc(collection(db, "roles"), d);
        }

        // 2. Posts (if empty)
        const postSnap = await getDocs(collection(db, "posts"));
        if (postSnap.empty) {
          const samplePosts = [
            {
              title: "The Renaissance of Digital Typography",
              excerpt:
                "How modern web engines are finally matching the precision of traditional print media.",
              content:
                "<p>Typography is the silent voice of the internet. For decades, we were limited by a handful of 'web-safe' fonts...</p>",
              authorName: "Julian Vane",
              authorPhotoURL:
                "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100",
              category: "Design",
              status: "published",
              featured: true,
              imageUrl:
                "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1200",
              createdAt: serverTimestamp(),
            },
            {
              title: "Sustainable Finance in the Age of Volatility",
              excerpt:
                "Navigating the complex intersection of environmental responsibility and capital growth.",
              content:
                "<p>Investing with a conscience used to mean sacrificing returns. Not anymore...</p>",
              authorName: "Elena Grace",
              authorPhotoURL:
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
              category: "Finance",
              status: "published",
              featured: true,
              imageUrl:
                "https://images.unsplash.com/photo-1454165833767-02a698d5874c?auto=format&fit=crop&q=80&w=1200",
              createdAt: serverTimestamp(),
            },
            {
              title: "Quantum Computing: Beyond the Hype",
              excerpt:
                "A practical look at when cubits will actually start solving real-world problems.",
              content:
                "<p>We've heard the promises: instant cryptography breaking, drug discovery in seconds...</p>",
              authorName: "Dr. Aris Thorne",
              authorPhotoURL:
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
              category: "Technology",
              status: "published",
              featured: false,
              imageUrl:
                "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200",
              createdAt: serverTimestamp(),
            },
            {
              title: "The Future of Crypto Regulation",
              excerpt:
                "Why legislative clarity might be the best thing to happen to decentralization.",
              content:
                "<p>Crypto was born as a rebellion against centralized finance. Now, it needs a seat at the table...</p>",
              authorName: "Sarah Chen",
              authorPhotoURL:
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100",
              category: "Crypto",
              status: "published",
              featured: true,
              imageUrl:
                "https://images.unsplash.com/photo-1621761191319-c6fb62004009?auto=format&fit=crop&q=80&w=1200",
              createdAt: serverTimestamp(),
            },
            {
              title: "Product-Led Growth Strategies",
              excerpt:
                "How the world's fastest-growing SaaS companies use their product as the main marketing engine.",
              content:
                "<p>PLG is more than just a freemium model. It's a fundamental shift in how we build...</p>",
              authorName: "Marcus Aurelius",
              authorPhotoURL:
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
              category: "Growth",
              status: "published",
              featured: false,
              imageUrl:
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200",
              createdAt: serverTimestamp(),
            },
          ];
          for (const p of samplePosts) await addDoc(collection(db, "posts"), p);
        }

        // 2.5 Products (if empty)
        const productSnap = await getDocs(collection(db, "products"));
        if (productSnap.empty) {
          const sampleProducts = [
            {
              name: "Vintage Manuscript Case",
              description:
                "Handcrafted leather case for your drafts and notes.",
              price: "$120.00",
              type: "real",
              createdAt: serverTimestamp(),
            },
            {
              name: "Digital Ink Pro",
              description: "The ultimate writing tool for modern journalists.",
              price: "Free",
              type: "affiliate",
              affiliateLink: "https://example.com/digital-ink",
              buttonText: "Get Pro Access",
              createdAt: serverTimestamp(),
            },
            {
              name: "Creative Logic Bundle",
              description:
                "A set of templates and guides for content creators.",
              price: "$49.00",
              type: "real",
              createdAt: serverTimestamp(),
            },
          ];
          for (const pr of sampleProducts)
            await addDoc(collection(db, "products"), pr);
        }

        // 3. Ads (if empty)
        const adSnap = await getDocs(collection(db, "ads"));
        if (adSnap.empty) {
          const defaults = [
            {
              name: "Chrica Premium",
              placement: "sidebar",
              type: "image",
              active: true,
              imageUrl:
                "https://images.unsplash.com/photo-1586339949916-3e9457bed643?auto=format&fit=crop&q=80&w=400",
              url: "#",
              impressions: 0,
              clicks: 0,
              createdAt: serverTimestamp(),
            },
            {
              name: "Global Masterclass",
              placement: "inline",
              type: "image",
              active: true,
              imageUrl:
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600",
              url: "#",
              impressions: 0,
              clicks: 0,
              createdAt: serverTimestamp(),
            },
          ];
          for (const a of defaults) await addDoc(collection(db, "ads"), a);
        }

        // 2. Dummy API Keys
        const apiSnap = await getDocs(collection(db, "apis"));
        if (apiSnap.empty) {
          const defaultApis = [
            {
              name: "Gemini 1.5 Pro",
              value: "sk_live_v8" + Math.random().toString(36).substring(7),
              description: "Production reasoning engine",
              createdAt: serverTimestamp(),
            },
            {
              name: "Maps Pipeline",
              value: "pk_maps_32" + Math.random().toString(36).substring(7),
              description: "POI and Geocoding services",
              createdAt: serverTimestamp(),
            },
            {
              name: "Marketing Analytics",
              value: "ai_tr_99" + Math.random().toString(36).substring(7),
              description: "Campaign tracking endpoint",
              createdAt: serverTimestamp(),
            },
          ];
          for (const a of defaultApis) await addDoc(collection(db, "apis"), a);
        }

        // 3. Dummy Guest Account
        const userSnap = await getDocs(
          query(
            collection(db, "users"),
            where("email", "==", "guest@example.com"),
            limit(1),
          ),
        );
        if (userSnap.empty) {
          await addDoc(collection(db, "users"), {
            displayName: "Demo Guest",
            email: "guest@example.com",
            role: "guest",
            photoURL:
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        // We handle this gracefully here as it's a seed script
        console.warn(
          "Dummy data initialization failed (likely permission yet to be granted):",
          error,
        );
      }
    };

    if (isAdmin && !loading) {
      initDummyData();
    }
  }, [isAdmin, loading]);

  const [lastActivity, setLastActivity] = useState(Date.now());
  const EXPIRE_TIME = 2 * 60 * 60 * 1000; // 2 hours

  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);

    const interval = setInterval(() => {
      if (user && Date.now() - lastActivity > EXPIRE_TIME) {
        logoutUser();
        setView("feed");
        alert("Session expired due to inactivity.");
      }
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      clearInterval(interval);
    };
  }, [user, lastActivity]);

  // Redirect on logout
  useEffect(() => {
    if (!user && (view === "write" || view === "profile" || view === "admin")) {
      setView("feed");
    }
  }, [user, view]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl animate-spin" />
      </div>
    );

  return (
    <>
      <Navbar
        onWrite={() => {
          trackEvent("Feature", "Write_Initiated");
          if (user) setView("write");
          else setIsAuthOpen(true);
        }}
        onNavigate={(v) => {
          trackEvent("Navigation", "Menu_Click", v);
          setView(v);
          setSelectedStory(null);
        }}
        onAuth={() => setIsAuthOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.length > 3) trackEvent("Engagement", "Search", q);
        }}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
      />

      <AnimatePresence mode="wait">
        {view === "feed" && stories.length > 0 && (
          <div className="bg-indigo-600 dark:bg-indigo-900 py-2 overflow-hidden whitespace-nowrap border-b border-indigo-500 shadow-sm">
            <motion.div
              animate={{ x: [0, -1000] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-white/90"
            >
              {stories.slice(0, 5).map((s) => (
                <span key={s.id} className="mx-12">
                  Breaking: {s.title} •
                </span>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="min-h-screen text-slate-900 dark:text-white dark:text-slate-100 transition-colors">
        <AnimatePresence mode="wait">
          {view === "feed" && (
            <StoryFeed
              loading={isStoriesLoading}
              stories={stories}
              isAdmin={isAdmin}
              onStoryClick={(s) => {
                trackEvent("Engagement", "Story_Click", s.title);
                setSelectedStory(s);
                setView("story");
              }}
              searchQuery={searchQuery}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              onSearchChange={setSearchQuery}
            />
          )}

          {view === "story" && selectedStory && (
            <ReaderView
              story={selectedStory}
              onBack={() => setView("feed")}
              user={user}
              setIsAuthOpen={setIsAuthOpen}
            />
          )}

          {view === "admin" && isAdmin && (
            <AdminShell
              activePage={adminPage}
              setPage={setAdminPage}
              adminPostId={adminPostId}
              setAdminPostId={setAdminPostId}
              onBackToHome={() => setView("feed")}
            />
          )}

          {view === "products" && <ProductsSection onNavigateToPost={(id) => { const s = stories.find(x => x.id === id); if (s) { setSelectedStory(s); setView("story"); } }} />}

          {view === "profile" && (
            <ProfileView
              onBack={() => setView("feed")}
              onStoryClick={(s) => {
                setSelectedStory(s);
                setView("story");
              }}
            />
          )}

          {view === "about" && <AboutUs onBack={() => setView("feed")} />}
          {view === "privacy" && <PrivacyPolicy onBack={() => setView("feed")} />}
          {view === "terms" && <TermsOfService onBack={() => setView("feed")} />}
        </AnimatePresence>

        {view !== "admin" && view !== "write" && (
          <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 py-16 px-4 md:px-20 mt-20 transition-colors">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
              <div className="space-y-4">
                <div className="text-3xl font-serif font-black tracking-tighter cursor-pointer select-none text-slate-900 dark:text-white dark:text-white">
                  Chrica<span className="text-indigo-600">.</span>
                </div>
                <p className="text-xs text-slate-500 font-serif italic max-w-sm">
                  Elevating human narratives through an advanced digital
                  news delivery system. Crafted for thinkers, creators, and readers.
                </p>
              </div>

              <div className="flex gap-16">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white dark:text-white">
                    Exploration
                  </h4>
                  <div className="flex flex-col gap-2 text-sm text-slate-500">
                    <button
                      onClick={() => setView("feed")}
                      className="text-left hover:text-indigo-600 transition-colors"
                    >
                      Manifest
                    </button>
                    <button
                      onClick={() => setView("products")}
                      className="text-left hover:text-indigo-600 transition-colors"
                    >
                      Digital Product
                    </button>
                    <button
                      onClick={() => setView("about")}
                      className="text-left hover:text-indigo-600 transition-colors"
                    >
                      About Us
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white dark:text-white">
                    Legal & Support
                  </h4>
                  <div className="flex flex-col gap-2 text-sm text-slate-500">
                    <button
                      onClick={() => setView("privacy")}
                      className="text-left hover:text-indigo-600 transition-colors"
                    >
                      Privacy Policy
                    </button>
                    <button
                      onClick={() => setView("terms")}
                      className="text-left hover:text-indigo-600 transition-colors"
                    >
                      Terms of Service
                    </button>
                    <a
                      href="#"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      Creator Help
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              <span>
                &copy; {new Date().getFullYear()} Chrica Engine. All rights
                reserved.
              </span>
              <div className="flex gap-4">
                <a href="#" className="hover:text-indigo-600 transition-colors" title="X">
                  <Twitter size={16} />
                </a>
                <a href="#" className="hover:text-indigo-600 transition-colors" title="Instagram">
                  <Instagram size={16} />
                </a>
                <a href="#" className="hover:text-indigo-600 transition-colors" title="Facebook">
                  <Facebook size={16} />
                </a>
              </div>
            </div>
          </footer>
        )}
      </main>
      <AnimatePresence>
        {view === "write" && <WriteView onCancel={() => setView("feed")} />}
      </AnimatePresence>

      <LoginModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSwitchToSignup={() => { setIsAuthOpen(false); setIsSignupOpen(true); }} 
      />
      <SignupModal 
        isOpen={isSignupOpen} 
        onClose={() => setIsSignupOpen(false)} 
        onSwitchToLogin={() => { setIsSignupOpen(false); setIsAuthOpen(true); }} 
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&family=Inter:wght@400;500;700;900&display=swap');
        
        :root {
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        ::selection {
          background: #indigo-100;
          color: #indigo-900;
        }
      `}</style>
    </>
  );
}

function SubscriptionsManagement() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blastStatus, setBlastStatus] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "in", ["guest", "subscriber"]),
    );
    const unsub = onSnapshot(q, (s) => {
      setSubscribers(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleBlast = async () => {
    setBlastStatus("Sending...");
    setTimeout(() => {
      setBlastStatus(
        `Email blast successfully sent to ${subscribers.length} subscribers!`,
      );
      setTimeout(() => setBlastStatus(null), 3000);
    }, 1000);
  };

  const seedSubscribers = async () => {
    setIsSeeding(true);
    try {
      for (let i = 0; i < 5; i++) {
        const newId = doc(collection(db, "users")).id;
        await setDoc(doc(db, "users", newId), {
          uid: newId,
          email: `sample${i}@example.com`,
          displayName: `Sample User ${i + 1}`,
          role: "subscriber",
          createdAt: serverTimestamp(),
        });
      }
      alert("Subscribers seeded successfully.");
    } catch (e: any) {
      console.error(e);
      alert("Seeding failed: " + e.message);
    }
    setIsSeeding(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-black text-slate-900 dark:text-white dark:text-white">
            Subscriptions <span className="italic">Management</span>
          </h2>
          <p className="text-sm font-serif italic text-slate-500 mt-2">
            Manage nested email blasts and user subscribers.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {blastStatus && (
            <span className="text-xs font-bold text-emerald-600 animate-pulse bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl">
              {blastStatus}
            </span>
          )}
          <button
            onClick={handleBlast}
            disabled={subscribers.length === 0}
            className="px-6 py-3 bg-black dark:bg-white dark:text-black text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-xl disabled:opacity-50"
          >
            <Mail size={16} /> Send Email Blast
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm text-center">
          <h4 className="text-4xl font-black mb-2 text-slate-900 dark:text-white dark:text-white">
            {subscribers.length}
          </h4>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400">
            Total Subscribers
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm text-center">
          <h4 className="text-4xl font-black mb-2 text-indigo-600">68%</h4>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400">
            Open Rate (30d)
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm text-center">
          <h4 className="text-4xl font-black mb-2 text-emerald-600">12%</h4>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400">
            Click Rate (30d)
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white dark:text-white">
            Active Subscribers
          </h3>
          {subscribers.length === 0 && (
            <button
              onClick={seedSubscribers}
              disabled={isSeeding}
              className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSeeding ? "Seeding..." : "Seed Sample Data"}
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
              Loading...
            </div>
          ) : subscribers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm italic font-serif">
              No active subscribers found.
            </div>
          ) : (
            subscribers.map((sub: any) => (
              <div
                key={sub.id}
                className="p-6 px-8 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform">
                    {sub.displayName?.charAt(0) || <User size={18} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white dark:text-white text-sm">
                      {sub.displayName || "Anonymous User"}
                    </h4>
                    <p className="text-xs text-slate-500">{sub.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-emerald-50 dark:border-emerald-900/30 border border-emerald-100 dark:bg-emerald-900/10 text-emerald-600 rounded-full text-[10px] uppercase font-black tracking-widest">
                    Subscribed
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </AuthProvider>
  );
}
