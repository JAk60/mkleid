// app/admin/(protected)/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react"

interface Stats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  recentOrders: any[]
  lowStockProducts: any[]
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockProducts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdminData()
    loadStats()
  }, [])

  const loadAdminData = () => {
    const adminData = localStorage.getItem("admin_user")
    if (adminData) {
      setAdmin(JSON.parse(adminData))
    }
  }

  const loadStats = async () => {
    try {
      // TODO: Implement actual API calls to fetch stats
      // For now, using dummy data
      setStats({
        totalProducts: 125,
        totalOrders: 456,
        totalCustomers: 892,
        totalRevenue: 45678,
        recentOrders: [
          { id: "ORD-001", customer: "John Doe", amount: 299, status: "pending" },
          { id: "ORD-002", customer: "Jane Smith", amount: 450, status: "completed" },
          { id: "ORD-003", customer: "Bob Wilson", amount: 199, status: "processing" },
        ],
        lowStockProducts: [
          { name: "Premium T-Shirt", stock: 3 },
          { name: "Classic Jeans", stock: 5 },
          { name: "Cotton Hoodie", stock: 2 },
        ]
      })
    } catch (error) {
      console.error("Failed to load stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500",
      change: "+12%",
      isPositive: true
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-green-500",
      change: "+23%",
      isPositive: true
    },
    {
      title: "Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "bg-purple-500",
      change: "+8%",
      isPositive: true
    },
    {
      title: "Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-orange-500",
      change: "+15%",
      isPositive: true
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {admin?.name}! 👋</h1>
        <p className="text-white/80">Here's what's happening with your store today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Orders
            </h2>
            <button className="text-sm text-primary hover:text-primary/80">View All</button>
          </div>
          
          <div className="space-y-4">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">{order.id}</p>
                  <p className="text-sm text-gray-400">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">₹{order.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Low Stock Alert
            </h2>
            <button className="text-sm text-primary hover:text-primary/80">View All</button>
          </div>
          
          <div className="space-y-4">
            {stats.lowStockProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div>
                  <p className="font-medium text-white">{product.name}</p>
                  <p className="text-sm text-gray-400">Urgent restock needed</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-400">{product.stock}</p>
                  <p className="text-xs text-gray-400">items left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-primary hover:bg-primary/90 rounded-lg transition-colors text-left">
            <Package className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">Add Product</h3>
            <p className="text-sm text-white/70">Create a new product</p>
          </button>
          
          <button className="p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-left">
            <ShoppingCart className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">View Orders</h3>
            <p className="text-sm text-white/70">Manage all orders</p>
          </button>
          
          <button className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-left">
            <Users className="w-8 h-8 text-white mb-2" />
            <h3 className="font-semibold text-white">View Customers</h3>
            <p className="text-sm text-white/70">Manage customers</p>
          </button>
        </div>
      </div>
    </div>
  )
}