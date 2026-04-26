import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CartProvider } from "@/contexts/CartContext";
import { AdminDataProvider } from "@/contexts/AdminDataContext";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { AnimatePresence } from "framer-motion";

// Public pages
import Home from "@/pages/home";
import ShopDogs from "@/pages/shop-dogs";
import ShopCats from "@/pages/shop-cats";
import ShopSupplies from "@/pages/shop-supplies";
import ProductDetail from "@/pages/product-detail";
import Donate from "@/pages/donate";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import CheckoutSuccess from "@/pages/checkout-success";
import DonateSuccess from "@/pages/donate-success";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import MyOrders from "@/pages/my-orders";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import ShippingInfo from "@/pages/shipping-info";

// Admin pages
import AdminLogin from "@/pages/admin-login";
import AdminSignup from "@/pages/admin-signup";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminDogs from "@/pages/admin-dogs";
import AdminCats from "@/pages/admin-cats";
import AdminSupplies from "@/pages/admin-supplies";
import AdminSettings from "@/pages/admin-settings";
import AdminOrders from "@/pages/admin-orders";
import AdminPages from "@/pages/admin-pages";
import AdminEuthanasia from "@/pages/admin-euthanasia";
import TrackOrder from "@/pages/track";
import EuthanasiaPage from "@/pages/euthanasia";
import EuthanasiaDetail from "@/pages/euthanasia-detail";

const queryClient = new QueryClient();

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Redirect to="/admin/login" />;
  return <Component />;
}

function AppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="pawglobal-theme">
        <CurrencyProvider>
          <AdminDataProvider>
            <CartProvider>
              <AdminAuthProvider>
                <TooltipProvider>
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <AdminAwareLayout />
                  </WouterRouter>
                  <Toaster />
                </TooltipProvider>
              </AdminAuthProvider>
            </CartProvider>
          </AdminDataProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AdminAwareLayout() {
  return (
    <Switch>
      {/* Admin routes skip the public Layout */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/signup" component={AdminSignup} />
      <Route path="/admin/orders">
        {() => <ProtectedAdminRoute component={AdminOrders} />}
      </Route>
      <Route path="/admin/dogs">
        {() => <ProtectedAdminRoute component={AdminDogs} />}
      </Route>
      <Route path="/admin/cats">
        {() => <ProtectedAdminRoute component={AdminCats} />}
      </Route>
      <Route path="/admin/supplies">
        {() => <ProtectedAdminRoute component={AdminSupplies} />}
      </Route>
      <Route path="/admin/pages">
        {() => <ProtectedAdminRoute component={AdminPages} />}
      </Route>
      <Route path="/admin/euthanasia">
        {() => <ProtectedAdminRoute component={AdminEuthanasia} />}
      </Route>
      <Route path="/admin/settings">
        {() => <ProtectedAdminRoute component={AdminSettings} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedAdminRoute component={AdminDashboard} />}
      </Route>

      {/* All public routes use the store Layout */}
      <Route>
        <Layout>
          <AnimatePresence mode="wait">
            <Switch>
              <Route path="/" component={EuthanasiaPage} />
              <Route path="/findpets" component={Home} />
              <Route path="/shop/dogs" component={ShopDogs} />
              <Route path="/shop/cats" component={ShopCats} />
              <Route path="/shop/supplies" component={ShopSupplies} />
              <Route path="/shop/:id" component={ProductDetail} />
              <Route path="/donate/success" component={DonateSuccess} />
              <Route path="/donate" component={Donate} />
              <Route path="/redeem-pledge" component={Donate} />
              <Route path="/cart" component={Cart} />
              <Route path="/checkout/success" component={CheckoutSuccess} />
              <Route path="/checkout" component={Checkout} />
              <Route path="/my-orders" component={MyOrders} />
              <Route path="/track/:trackingNumber" component={TrackOrder} />
              <Route path="/track" component={TrackOrder} />
              <Route path="/euthanasia/:id" component={EuthanasiaDetail} />
              <Route path="/euthanasia">{() => <Redirect to="/" />}</Route>
              <Route path="/about" component={About} />
              <Route path="/contact" component={Contact} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              <Route path="/terms-of-service" component={TermsOfService} />
              <Route path="/shipping-info" component={ShippingInfo} />
              <Route component={NotFound} />
            </Switch>
          </AnimatePresence>
        </Layout>
      </Route>
    </Switch>
  );
}

export default AppShell;
