
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import UserAuth from './pages/UserAuth';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminEditAccount from './pages/AdminEditAccount';
import UserDashboard from './pages/UserDashboard';
import ListAccount from './pages/ListAccount';
import RefundPolicy from './pages/RefundPolicy';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import LoadingScreen from './components/LoadingScreen';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/account/:id" element={<ProductDetails />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<UserAuth />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/list-account" element={<ListAccount />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/edit/:id" element={<AdminEditAccount />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
