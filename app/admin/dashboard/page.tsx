// app/admin/dashboard/page.tsx
// ADD THIS IMPORT at the top
import ProductsManagement from '@/components/admin/ProductsManagement';

// Then in your renderContent() function, add this case:

case 'products':
  return <ProductsManagement />;

// Example of the updated renderContent function:
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
    case 'products':
      return <ProductsManagement />;

    case 'debug':
      return (
        // ... your existing debug code
      );

    case 'dashboard':
      return (
        // ... your existing dashboard code
      );

    case 'quota':
      return (
        // ... your existing quota code
      );

    default:
      return <div>Select a menu item</div>;
  }
};