import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Save, Search, Upload } from "lucide-react";

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  sizes: string[];
  colors: string[];
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

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterGender, setFilterGender] = useState<"all" | "Male" | "Female">(
    "all"
  );
  const [filterCategory, setFilterCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [colorInput, setColorInput] = useState("");
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
      return;
    }

    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => setCloudinaryLoaded(true);
    document.body.appendChild(script);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/products");
      const data = await response.json();
      setProducts(data || []);
    } catch (error) {
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
    setColorInput("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setColorInput("");
  };

  const handleCloudinaryUpload = () => {
    if (!cloudinaryLoaded || !(window as any).cloudinary) {
      alert("Cloudinary is still loading. Please try again in a moment.");
      return;
    }

    setUploading(true);

    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: "demo", // Replace with your cloud name
        uploadPreset: "ml_default", // Replace with your upload preset
        sources: ["local", "url", "camera"],
        folder: "products",
        multiple: false,
        maxImageFileSize: 2000000,
        clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
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
          }
        }
      },
      (error: any, result: any) => {
        if (error) {
          console.error("Upload error:", error);
          alert("Upload failed. Please try again.");
          setUploading(false);
          return;
        }

        if (result?.event === "success") {
          setFormData((prev) => ({ 
            ...prev, 
            image_url: result.info.secure_url 
          }));
          setUploading(false);
          widget.close();
        }
      }
    );

    widget.open();
  };

  const handleAddColor = () => {
    if (!colorInput.trim()) return;
    let color = colorInput.trim();

    if (!color.startsWith("#")) color = "#" + color;

    const regex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
    if (!regex.test(color)) return alert("Invalid hex color");

    if (color.length === 4) {
      color =
        "#" +
        color[1] +
        color[1] +
        color[2] +
        color[2] +
        color[3] +
        color[3];
    }

    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, color.toUpperCase()],
    }));

    setColorInput("");
  };

  const removeColor = (c: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((x) => x !== c),
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
    if (!formData.sizes.length) return alert("Select at least one size");
    if (!formData.colors.length) return alert("Add at least one color");

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

      alert(editingProduct ? "Updated!" : "Created!");

      await fetchProducts();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      alert("Deleted!");
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
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

  // PAGINATION CALC
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
      <div className="flex justify-center items-center h-72">Loading...</div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products Management</h1>

        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* LIST VIEW */}
      <div className="space-y-4">
        {currentItems.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg border p-4 flex gap-4 hover:shadow-md transition"
          >
            <img
              src={product.image_url}
              alt={product.name}
              className="w-24 h-24 rounded object-cover"
            />

            <div className="flex-1">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-gray-600">{product.description}</p>
              <p className="font-bold mt-2">₹{product.price}</p>

              <p className="text-sm text-gray-500 mt-1">
                {product.sizes.join(", ")}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleOpenModal(product)}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
              >
                <Edit size={18} />
              </button>

              <button
                onClick={() => handleDelete(product.id!)}
                className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-40 hover:bg-gray-100 transition"
          >
            Prev
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
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center sticky top-0 bg-white pb-4 border-b">
              <h2 className="text-2xl font-bold">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={handleCloseModal} className="hover:bg-gray-100 p-2 rounded-full transition">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 mt-6">
              {/* NAME */}
              <div>
                <label className="block font-medium mb-1">Product Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <option>Male</option>
                    <option>Female</option>
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
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PRICE + STOCK */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Price *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* IMAGE */}
              <div>
                <label className="block font-medium mb-1">Product Image *</label>

                <button
                  onClick={handleCloudinaryUpload}
                  disabled={uploading || !cloudinaryLoaded}
                  className="w-full border-2 border-dashed rounded-lg p-6 text-center mt-2 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={32} className="mx-auto mb-2 text-blue-600" />
                  <p className="font-medium text-gray-700">
                    {uploading ? "Uploading..." : "Click to Upload Image"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG, JPEG or WEBP (Max 2MB)
                  </p>
                </button>

                <div className="relative mt-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    Or paste URL:
                  </span>
                  <input
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    className="w-full border px-4 py-2 pl-28 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {formData.image_url && (
                  <div className="mt-3 relative">
                    <img
                      src={formData.image_url}
                      className="w-full h-48 object-cover rounded-lg border"
                      alt="Preview"
                    />
                  </div>
                )}
              </div>

              {/* SIZES */}
              <div>
                <label className="block font-medium mb-2">Sizes *</label>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map((s) => (
                    <button
                      key={s}
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
                <div className="flex gap-2">
                  <input
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    className="border px-4 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter hex color (e.g., #FF5733 or FF5733)"
                  />

                  <button
                    onClick={handleAddColor}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.colors.map((c) => (
                    <div
                      key={c}
                      className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition"
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: c }}
                      />
                      <span className="font-mono text-sm">{c}</span>
                      <button
                        onClick={() => removeColor(c)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex gap-4 pt-4 border-t mt-6">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-100 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}