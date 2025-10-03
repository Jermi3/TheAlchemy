import React from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { useCart } from './hooks/useCart';
import Header from './components/Header';
import SubNav from './components/SubNav';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import FloatingCartButton from './components/FloatingCartButton';
import AdminDashboard from './components/AdminDashboard';
import OrderTracker from './components/OrderTracker';
import Footer from './components/Footer';
import { useMenu } from './hooks/useMenu';

function MainApp() {
  const cart = useCart();
  const { menuItems } = useMenu();
  const [currentView, setCurrentView] = React.useState<'menu' | 'cart' | 'checkout' | 'track'>('menu');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchParams] = useSearchParams();
  const [tableNumber, setTableNumber] = React.useState<string | null>(null);
  const [lastOrderCode, setLastOrderCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    const detectedTable = searchParams.get('table') || searchParams.get('tableNumber');
    setTableNumber(detectedTable);
  }, [searchParams]);

  const handleViewChange = (view: 'menu' | 'cart' | 'checkout' | 'track') => {
    if (view !== 'track') {
      setLastOrderCode(null);
    }
    setCurrentView(view);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const goToTrack = (code?: string | null) => {
    setLastOrderCode(code ?? null);
    setCurrentView('track');
  };

  // Filter menu items based on selected category
  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-alchemy-night font-inter text-alchemy-cream flex flex-col">
      <Header 
        cartItemsCount={cart.getTotalItems()}
        onCartClick={() => handleViewChange('cart')}
        onMenuClick={() => handleViewChange('menu')}
        onTrackOrder={() => goToTrack()}
      />
      {currentView === 'menu' && (
        <SubNav selectedCategory={selectedCategory} onCategoryClick={handleCategoryClick} />
      )}
      
      <main className="flex-1">
        {currentView === 'menu' && (
          <Menu 
            menuItems={filteredMenuItems}
            addToCart={cart.addToCart}
            cartItems={cart.cartItems}
            updateQuantity={cart.updateQuantity}
            canAddToCart={cart.canAddToCart}
            onTrackOrder={() => goToTrack()}
          />
        )}
        
        {currentView === 'cart' && (
          <Cart 
            cartItems={cart.cartItems}
            updateQuantity={cart.updateQuantity}
            removeFromCart={cart.removeFromCart}
            clearCart={cart.clearCart}
            getTotalPrice={cart.getTotalPrice}
            onContinueShopping={() => handleViewChange('menu')}
            onCheckout={() => handleViewChange('checkout')}
          />
        )}
        
        {currentView === 'checkout' && (
          <Checkout 
            cartItems={cart.cartItems}
            totalPrice={cart.getTotalPrice()}
            onBack={() => handleViewChange('cart')}
            tableNumber={tableNumber}
            onOrderComplete={(code) => {
              cart.clearCart();
              goToTrack(code);
            }}
          />
        )}

        {currentView === 'track' && (
          <OrderTracker onBack={() => handleViewChange('menu')} initialCode={lastOrderCode} />
        )}
      </main>

      {currentView === 'menu' && (
        <FloatingCartButton 
          itemCount={cart.getTotalItems()}
          onCartClick={() => handleViewChange('cart')}
        />
      )}

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
