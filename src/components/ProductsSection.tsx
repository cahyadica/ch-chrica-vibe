import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";
import { collection, query, orderBy, onSnapshot, where, limit } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, ChevronLeft, ChevronRight, X, ArrowRight } from "lucide-react";

function ImageCarousel({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const [hasError, setHasError] = useState(false);

  if (!images || images.length === 0 || hasError) {
    return (
      <img
        src={`https://image.pollinations.ai/prompt/${encodeURIComponent(
          "minimalist digital product " + name + " sleek abstract"
        )}?width=400&height=400&nologo=true`}
        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        alt={name}
        loading="lazy"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    );
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((v) => (v + 1) % images.length);
    setHasError(false);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((v) => (v - 1 + images.length) % images.length);
    setHasError(false);
  };

  return (
    <div className="relative w-full h-full group/carousel">
      <img
        src={images[idx]}
        alt={`${name} - ${idx + 1}`}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-700"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      {images.length > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1 z-10">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/80 z-10"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/80 z-10"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

function ProductDetailPopup({
  product,
  onClose,
  onPostClick
}: {
  product: any;
  onClose: () => void;
  onPostClick: (postId: string) => void;
}) {
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch posts that mention this product in their productIds array
    const q = query(
      collection(db, "posts"),
      where("productIds", "array-contains", product.id),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      const posts = snap.docs.map(d => ({id: d.id, ...d.data()})).filter((p: any) => p.status === "published");
      setRelatedPosts(posts.slice(0, 3));
    }, (error) => console.error("Error fetching related posts:", error));
    return () => unsub();
  }, [product.id]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-y-auto flex flex-col md:flex-row"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-20"
        >
          <X size={20} className="text-slate-900 dark:text-white" />
        </button>

        <div className="w-full md:w-2/5 aspect-square md:aspect-auto relative bg-slate-100 dark:bg-slate-800">
          <ImageCarousel images={(product.gallery || product.images || []).filter(Boolean)} name={product.name} />
        </div>

        <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
              {product.type || "Digital"}
            </span>
            {product.brand && (
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {product.brand}
              </span>
            )}
          </div>
          <h2 className="text-3xl font-serif font-black text-slate-900 dark:text-white mb-4">
            {product.name}
          </h2>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-8">
            {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : product.currency === 'JPY' ? '¥' : product.currency === 'IDR' ? 'Rp' : product.currency === 'INR' ? '₹' : (product.currency ? product.currency + ' ' : '$')}
            {product.price?.replace('$', '') || "0.00"}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 font-serif leading-relaxed mb-8 flex-1">
            {product.description}
          </p>

          {product.specification && (
            <div className="mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest mb-3 text-slate-900 dark:text-white">Specification</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{product.specification}</p>
            </div>
          )}

          <div className="flex flex-col gap-8 mt-auto pt-8 border-t border-slate-100 dark:border-slate-800">
            {product.type === "affiliate" ? (
              <a
                href={product.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl text-xs font-black uppercase tracking-widest text-center hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {product.buttonText || "Buy Now"}
                <ExternalLink size={16} />
              </a>
            ) : (
              <button className="w-full bg-indigo-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
                Add to Cart
              </button>
            )}

            {relatedPosts.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest mb-4 text-slate-900 dark:text-white">Related Posts</h4>
                <div className="space-y-3">
                  {relatedPosts.map(post => (
                    <div 
                      key={post.id} 
                      onClick={() => { onClose(); onPostClick(post.id); }}
                      className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -mx-2 rounded-xl transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                         <img src={post.featuredImage || post.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(post.title)}?width=200`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">{post.title}</h5>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{post.excerpt}</p>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProductsSection({ 
  onNavigateToPost, 
  productIds 
}: { 
  onNavigateToPost?: (postId: string) => void;
  productIds?: string[];
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    let q;
    if (productIds && productIds.length > 0) {
      q = query(collection(db, "products"), where("__name__", "in", productIds.slice(0, 10)));
    } else {
      q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    }
    
    return onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "products")
    );
  }, [productIds]);

  const filteredProducts = products.filter(p => filterType === "All" || (p.type || "Digital") === filterType);

  return (
    <div className={productIds ? "py-12" : "max-w-7xl mx-auto px-4 md:px-20 pt-32 pb-40"}>
      {!productIds && (
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter text-slate-900 dark:text-white mb-6">
            Premium <span className="italic text-indigo-600">collections.</span>
          </h1>
          <p className="text-lg text-slate-500 font-serif italic max-w-2xl mx-auto leading-relaxed mb-10">
            Exclusive reports, curated goods, and affiliated items.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {["All", "Digital", "Real", "Affiliate"].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                   filterType === t 
                   ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl shadow-slate-900/20" 
                   : "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {productIds && products.length > 0 && (
         <div className="mb-6">
           <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white">Featured Products</h3>
         </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedProduct(p)}
              className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col cursor-pointer"
            >
              <div className="aspect-square overflow-hidden relative bg-slate-50 dark:bg-slate-800">
                <ImageCarousel images={(p.gallery || p.images || []).filter(Boolean)} name={p.name} />
                <div className="absolute top-4 right-4 z-10 pointer-events-none">
                  <span className="bg-white/95 dark:bg-black/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-slate-900 dark:text-white shadow-lg">
                    {p.price ? (
                        <>
                          {p.currency === 'USD' ? '$' : p.currency === 'EUR' ? '€' : p.currency === 'GBP' ? '£' : p.currency === 'JPY' ? '¥' : p.currency === 'IDR' ? 'Rp' : p.currency === 'INR' ? '₹' : (p.currency ? p.currency + ' ' : '$')}
                          {p.price.replace('$', '')}
                        </>
                    ) : "Free"}
                  </span>
                </div>
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <span className="bg-white/95 dark:bg-black/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase text-indigo-600 shadow-lg tracking-widest">
                    {p.type || "Digital"}
                  </span>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {p.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2 leading-relaxed flex-1">
                  {p.description}
                </p>
              </div>
            </motion.div>
          ))}
          {filteredProducts.length === 0 && (
             <div className="col-span-full py-20 text-center text-slate-500 dark:text-slate-400">
               No products found in this category.
             </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailPopup 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onPostClick={(id) => {
               if (onNavigateToPost) onNavigateToPost(id);
               // If there is a way to set current post... 
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
