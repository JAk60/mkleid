'use client';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Upload,
  Database,
  Settings,
  LogOut,
  Menu,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState([]);
  
  // State for real data
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockProducts: [],
    recentOrders: []
  });
  
  const [quotaData, setQuotaData] = useState({
    supabase: {
      rows: { used: 0, limit: 500000 },
      storage: { used: 0, limit: 500 }
    },
    cloudinary: {
      images: { used: 0, limit: 25000 },
      storage: { used: 0, limit: 25 },
      bandwidth: { used: 0, limit: 25 }
    }
  });
  
  const [products, setProducts] = useState([]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'quota', label: 'Quota Monitor', icon: Database },
    { id: 'debug', label: 'Debug Info', icon: AlertCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      console.log('Fetching stats from /api/admin/stats');
      const response = await fetch('/api/admin/stats');
      console.log('Stats response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Stats API failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Stats data received:', data);
      
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setErrors(prev => [...prev, `Stats Error: ${error.message}`]);
    }
  };

  // Fetch Supabase quota
  const fetchSupabaseQuota = async () => {
    try {
      console.log('Fetching Supabase quota from /api/admin/supabase-usage');
      const response = await fetch('/api/admin/supabase-usage');
      console.log('Supabase response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Supabase API failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Supabase data received:', data);
      
      if (data.success) {
        setQuotaData(prev => ({
          ...prev,
          supabase: data.data
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch Supabase usage');
      }
    } catch (error) {
      console.error('Failed to fetch Supabase quota:', error);
      setErrors(prev => [...prev, `Supabase Quota Error: ${error.message}`]);
    }
  };

  // Fetch Cloudinary quota
  const fetchCloudinaryQuota = async () => {
    try {
      console.log('Fetching Cloudinary quota from /api/admin/cloudinary-usage');
      const response = await fetch('/api/admin/cloudinary-usage');
      console.log('Cloudinary response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Cloudinary API failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Cloudinary data received:', data);
      
      if (data.success) {
        setQuotaData(prev => ({
          ...prev,
          cloudinary: data.data
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch Cloudinary usage');
      }
    } catch (error) {
      console.error('Failed to fetch Cloudinary quota:', error);
      setErrors(prev => [...prev, `Cloudinary Quota Error: ${error.message}`]);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      console.log('Fetching products');
      const response = await fetch('/api/products');
      console.log('Products response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Products API failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Products data received:', data);
      setProducts(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setErrors(prev => [...prev, `Products Error: ${error.message}`]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setErrors([]);
      
      console.log('Starting data load...');
      await Promise.all([
        fetchStats(),
        fetchSupabaseQuota(),
        fetchCloudinaryQuota(),
        fetchProducts()
      ]);
      
      console.log('Data load complete');
      setLoading(false);
    };
    
    loadData();
  }, []);

  const ProgressBar = ({ value, max, showWarnings = true }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const isWarning = percentage > 80;
    const isDanger = percentage > 90;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {typeof value === 'number' && value < 1 
              ? value.toFixed(2) 
              : Math.round(value).toLocaleString()} / {max.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            {showWarnings && isDanger && (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            {showWarnings && !isDanger && !isWarning && (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
            <span className={`font-semibold ${
              isDanger ? 'text-red-600' : 
              isWarning ? 'text-orange-600' : 
              'text-green-600'
            }`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all ${
              isDanger ? 'bg-red-600' : 
              isWarning ? 'bg-orange-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard data...</p>
            <p className="text-sm text-gray-500 mt-2">Check console for details</p>
          </div>
        </div>
      );
    }

    switch (activeMenu) {
      case 'debug':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Debug Information</h1>
            
            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-red-900 mb-4">Errors Detected</h2>
                <ul className="space-y-2">
                  {errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-800 font-mono">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errors.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-green-900 mb-4">✅ All Systems Operational</h2>
                <p className="text-green-800">No errors detected. All APIs are responding correctly.</p>
              </div>
            )}

            {/* API Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">API Endpoints Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Stats API</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    stats.totalProducts > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stats.totalProducts > 0 ? 'Working' : 'Failed'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Supabase Usage API</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    quotaData.supabase ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {quotaData.supabase ? 'Working' : 'Failed'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Cloudinary Usage API</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    quotaData.cloudinary ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {quotaData.cloudinary ? 'Working' : 'Failed'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Products API</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    products.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {products.length > 0 ? 'Working' : 'Failed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Environment Check */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Environment Variables</h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span>NEXT_PUBLIC_SUPABASE_URL</span>
                  <span className={typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                    {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</span>
                  <span className={typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'text-green-600' : 'text-red-600'}>
                    {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Data Preview */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Current Data</h2>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
{JSON.stringify({ stats, quotaData, productsCount: products.length }, null, 2)}
              </pre>
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Troubleshooting Steps</h2>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Check if all API routes exist in <code className="bg-blue-100 px-2 py-1 rounded">app/api/admin/</code></li>
                <li>Verify environment variables in <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code></li>
                <li>Check browser console (F12) for detailed error messages</li>
                <li>Restart your dev server: <code className="bg-blue-100 px-2 py-1 rounded">npm run dev</code></li>
                <li>Check if Supabase and Cloudinary credentials are correct</li>
              </ol>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
              <button
                onClick={() => {
                  setErrors([]);
                  fetchStats();
                  fetchSupabaseQuota();
                  fetchCloudinaryQuota();
                  fetchProducts();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Show errors if any */}
            {errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Some data failed to load. Check the Debug tab for details.
                </p>
              </div>
            )}
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.lowStockProducts?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'quota':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Quota Monitor</h1>
              <button
                onClick={() => {
                  setRefreshing(true);
                  Promise.all([fetchSupabaseQuota(), fetchCloudinaryQuota()]).finally(() => setRefreshing(false));
                }}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Supabase */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-8 h-8 text-green-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Supabase Usage</h2>
                  <p className="text-sm text-gray-600">Free Tier Limits</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Database Rows</h3>
                  <ProgressBar 
                    value={quotaData.supabase.rows.used} 
                    max={quotaData.supabase.rows.limit}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Storage (MB)</h3>
                  <ProgressBar 
                    value={quotaData.supabase.storage.used} 
                    max={quotaData.supabase.storage.limit}
                  />
                </div>
              </div>
            </div>

            {/* Cloudinary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Upload className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Cloudinary Usage</h2>
                  <p className="text-sm text-gray-600">Free Tier Limits</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Total Images</h3>
                  <ProgressBar 
                    value={quotaData.cloudinary.images.used} 
                    max={quotaData.cloudinary.images.limit}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Storage (GB)</h3>
                  <ProgressBar 
                    value={quotaData.cloudinary.storage.used} 
                    max={quotaData.cloudinary.storage.limit}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Bandwidth (GB)</h3>
                  <ProgressBar 
                    value={quotaData.cloudinary.bandwidth.used} 
                    max={quotaData.cloudinary.bandwidth.limit}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeMenu === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && <span>{item.label}</span>}
                    {item.id === 'debug' && errors.length > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {errors.length}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;