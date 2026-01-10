import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Save, Search, Upload, Image as ImageIcon } from "lucide-react";

interface ColorOption {
  name: string;
  hex: string;
}

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  sizes: string[];
  colors: ColorOption[];
  stock: number;
  gender: "Male" | "Female";
}

const CATEGORIES = {
  Male: ["Oversized tshirt", "Jersey", "Sweatshirt", "Shirts", "Sweatpants"],
  Female: [
    "Baby tees",
    "Jersey",
    "Oversized tshirt",
    "Shirts",
    "Sweatshirts",
    "Sweatpants",
    "Flared pants",
  ],
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// Common color presets
const COLOR_PRESETS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Maroon', hex: '#991B1B' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Beige', hex: '#D4B5A0' },
  { name: 'Brown', hex: '#78350F' },
];

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterGender, setFilterGender] = useState<"all" | "Male" | "Female">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [colorNameInput, setColorNameInput] = useState("");
  const [colorHexInput, setColorHexInput] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [cloudinaryLoaded, setCloudinaryLoaded] = useState(false);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<Product>({
    name: "",
    description: "",
    price: 0,
    image_url: "",
    category: "",
    sizes: [],
    colors: [],
    stock: 0,
    gender: "Male",
  });

  useEffect(() => {
    fetchProducts();
    loadCloudinaryScript();
  }, []);

  const loadCloudinaryScript = () => {
    if ((window as any).cloudinary) {
      setCloudinaryLoaded(true);
      console.log("✅ Cloudinary already loaded");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => {
      setCloudinaryLoaded(true);
      console.log("✅ Cloudinary widget loaded successfully");
    };
    script.onerror = () => {
      console.error("❌ Failed to load Cloudinary widget");
      alert("Failed to load Cloudinary. Please refresh the page.");
    };
    document.body.appendChild(script);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/products");
      const data = await response.json();
      setProducts(data || []);
    } catch (error) {
      console.error("Failed to load products:", error);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        image_url: "",
        category: "",
        sizes: [],
        colors: [],
        stock: 0,
        gender: "Male",
      });
    }
    setColorNameInput("");
    setColorHexInput("");
    setShowPresets(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setColorNameInput("");
    setColorHexInput("");
    setShowPresets(false);
  };

  const handleCloudinaryUpload = () => {
    if (!cloudinaryLoaded || !(window as any).cloudinary) {
      alert("Cloudinary is still loading. Please try again in a moment.");
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env.local file");
      console.error("Missing Cloudinary config:", { cloudName, uploadPreset });
      return;
    }

    console.log("🚀 Opening Cloudinary widget with config:", { cloudName, uploadPreset });
    setUploading(true);

    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ["local", "url", "camera"],
        folder: "products",
        multiple: false,
        maxFiles: 1,
        maxFileSize: 2000000,
        clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
        resourceType: "image",
        cropping: true,
        croppingAspectRatio: 1,
        showSkipCropButton: false,
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#2563EB",
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#2563EB",
            action: "#2563EB",
            inactiveTabIcon: "#9CA3AF",
            error: "#EF4444",
            inProgress: "#2563EB",
            complete: "#10B981",
            sourceBg: "#F3F4F6"
          },
          fonts: {
            default: null,
            "'Inter', sans-serif": {
              url: "https://fonts.googleapis.com/css?family=Inter",
              active: true
            }
          }
        }
      },
      (error: any, result: any) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          alert("Upload failed: " + (error.message || "Unknown error"));
          setUploading(false);
          return;
        }

        console.log("📸 Cloudinary event:", result?.event);

        if (result?.event === "success") {
          console.log("✅ Upload successful:", result.info.secure_url);
          setFormData((prev) => ({ 
            ...prev, 
            image_url: result.info.secure_url 
          }));
          setUploading(false);
          widget.close();
        }
        
        if (result?.event === "close") {
          console.log("🔒 Widget closed");
          setUploading(false);
        }

        if (result?.event === "abort") {
          console.log("⚠️ Upload aborted");
          setUploading(false);
        }
      }
    );

    widget.open();
  };

  const addPresetColor = (preset: ColorOption) => {
    if (formData.colors.some(c => c.hex === preset.hex)) {
      alert("This color is already added");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, preset],
    }));
  };

  const handleAddCustomColor = () => {
    if (!colorNameInput.trim() || !colorHexInput.trim()) {
      alert("Please enter both color name and hex code");
      return;
    }

    let hex = colorHexInput.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;

    const regex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
    if (!regex.test(hex)) {
      alert("Invalid hex color. Use format: #FF0000 or FF0000");
      return;
    }

    if (hex.length === 4) {
      hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }

    if (formData.colors.some(c => c.hex === hex.toUpperCase())) {
      alert("This color is already added");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: colorNameInput.trim(), hex: hex.toUpperCase() }],
    }));

    setColorNameInput("");
    setColorHexInput("");
  };

  const removeColor = (hex: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((x) => x.hex !== hex),
    }));
  };

  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      alert("Product name is required");
      return;
    }
    if (formData.price <= 0) {
      alert("Price must be greater than 0");
      return;
    }
    if (!formData.category) {
      alert("Please select a category");
      return;
    }
    if (!formData.sizes.length) {
      alert("Select at least one size");
      return;
    }
    if (!formData.colors.length) {
      alert("Add at least one color");
      return;
    }
    if (formData.stock < 0) {
      alert("Stock cannot be negative");
      return;
    }
    if (!formData.image_url.trim()) {
      alert("Please upload a product image");
      return;
    }

    try {
      setSubmitting(true);

      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingProduct ? { id: editingProduct.id, ...formData } : formData
        ),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      alert(editingProduct ? "Product updated successfully!" : "Product created successfully!");

      await fetchProducts();
      handleCloseModal();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      alert("Product deleted successfully!");
      fetchProducts();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // FILTERING
  const filteredProducts = products.filter((p) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s);
    const matchesGender = filterGender === "all" || p.gender === filterGender;
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;

    return matchesSearch && matchesGender && matchesCategory;
  });

  // PAGINATION
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirst, indexOfLast);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-1">{filteredProducts.length} products found</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search products..."
              className="w-full px-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterGender}
            onChange={(e) => {
              setFilterGender(e.target.value as any);
              setFilterCategory("all");
              setCurrentPage(1);
            }}
            className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {(
              filterGender === "all"
                ? Array.from(new Set([...CATEGORIES.Male, ...CATEGORIES.Female]))
                : CATEGORIES[filterGender]
            ).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PRODUCTS LIST */}
      <div className="space-y-4">
        {currentItems.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or add a new product</p>
          </div>
        ) : (
          currentItems.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg border p-4 flex gap-4 hover:shadow-md transition"
            >
              <img
                src={product.image_url}
                alt={product.name}
                className="w-24 h-24 rounded object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image';
                }}
              />

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id!)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  <span className="font-bold text-blue-600 text-lg">₹{product.price.toLocaleString()}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.gender === 'Male' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-pink-100 text-pink-800'
                  }`}>
                    {product.gender}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                    {product.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.stock > 10 
                      ? 'bg-green-100 text-green-800'
                      : product.stock > 0
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Stock: {product.stock}
                  </span>
                  <span className="text-sm text-gray-500">
                    Sizes: {product.sizes.join(", ")}
                  </span>
                  <div className="flex gap-2 items-center">
                    {product.colors.slice(0, 5).map((color, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: color.hex }}
                          title={`${color.name} (${color.hex})`}
                        />
                        <span className="text-xs text-gray-600 mt-1">{color.name}</span>
                      </div>
                    ))}
                    {product.colors.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                        +{product.colors.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-40 hover:bg-gray-100 transition"
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i + 1)}
              className={`px-4 py-2 border rounded transition ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-40 hover:bg-gray-100 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button 
                onClick={handleCloseModal} 
                className="hover:bg-gray-100 p-2 rounded-full transition"
                disabled={submitting || uploading}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* NAME */}
              <div>
                <label className="block font-medium mb-1">Product Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Premium Cotton T-Shirt"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your product..."
                />
              </div>

              {/* GENDER + CATEGORY */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as "Male" | "Female",
                        category: "",
                      })
                    }
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES[formData.gender].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PRICE + STOCK */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD */}
              <div>
                <label className="block font-medium mb-2">Product Image *</label>

                {!cloudinaryLoaded ? (
                  <div className="w-full border-2 border-dashed rounded-lg p-6 text-center bg-gray-50">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading Cloudinary...</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCloudinaryUpload}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={32} className="mx-auto mb-2 text-blue-600" />
                    <p className="font-medium text-gray-700">
                      {uploading ? "Uploading..." : "Click to Upload Image"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG, JPEG or WEBP (Max 2MB)
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Cloudinary upload widget will open
                    </p>
                  </button>
                )}

                {formData.image_url && (
                  <div className="mt-4 relative">
                    <img
                      src={formData.image_url}
                      className="w-full h-64 object-cover rounded-lg border"
                      alt="Product preview"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="mt-3">
                  <input
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Or paste image URL here..."
                  />
                </div>
              </div>

              {/* SIZES */}
              <div>
                <label className="block font-medium mb-2">Available Sizes *</label>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`px-4 py-2 border rounded-lg transition ${
                        formData.sizes.includes(s)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* COLORS */}
              <div>
                <label className="block font-medium mb-2">Colors *</label>
                
                {/* Quick Presets */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                  >
                    {showPresets ? '▼ Hide' : '▶ Show'} Quick Color Presets
                  </button>
                  
                  {showPresets && (
                    <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg border">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => addPresetColor(preset)}
                          disabled={formData.colors.some(c => c.hex === preset.hex)}
                          className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <div
                            className="w-10 h-10 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className="text-xs font-medium text-gray-700">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Color Input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={colorNameInput}
                    onChange={(e) => setColorNameInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomColor()}
                    className="flex-1 border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Color name (e.g., Sky Blue)"
                  />
                  <input
                    value={colorHexInput}
                    onChange={(e) => setColorHexInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomColor()}
                    className="w-32 border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="#FF5733"
                  />
                  {colorHexInput && (
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                      style={{ 
                        backgroundColor: colorHexInput.startsWith('#') 
                          ? colorHexInput 
                          : '#' + colorHexInput 
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Colors */}
                {formData.colors.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {formData.colors.map((color) => (
                      <div
                        key={color.hex}
                        className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition border"
                      >
                        <div
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">
                            {color.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {color.hex}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeColor(color.hex)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.colors.length === 0 && (
                  <div className="text-center py-6 text-gray-400 border-2 border-dashed rounded-lg">
                    No colors added yet. Use presets or add custom colors.
                  </div>
                )}
              </div>

              {/* SUBMIT */}
              <div className="flex gap-4 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting || uploading}
                  className="flex-1 bg-gray-100 py-3 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || uploading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingProduct ? "Update Product" : "Create Product"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}