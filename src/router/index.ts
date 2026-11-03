import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CatalogView from '../views/CatalogView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import ManageJerseyView from '../views/ManageJerseyView.vue';
import AboutView from '../views/AboutView.vue';
import CheckoutView from '../views/CheckoutView.vue';
import AdminOrdersView from '../views/AdminOrdersView.vue';
import AdminMessagesView from '../views/AdminMessagesView.vue';
import UserOrdersView from '../views/UserOrdersView.vue';
import SizeGuideView from '../views/SizeGuideView.vue';
import { isAdmin, isAuthenticated, openLoginModal } from '../store/useAuth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/catalogo',
    name: 'Catalog',
    component: CatalogView
  },
  {
    path: '/camiseta/:id',
    name: 'ProductDetail',
    component: ProductDetailView
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: CheckoutView,
    meta: { requiresAuth: true, loginMessage: 'Iniciá sesión para finalizar tu compra. Tu carrito queda guardado.' }
  },
  {
    path: '/mis-pedidos',
    name: 'UserOrders',
    component: UserOrdersView,
    meta: { requiresAuth: true, loginMessage: 'Iniciá sesión para ver tus pedidos.' }
  },
  {
    path: '/admin/camisetas',
    name: 'CreateJersey',
    component: ManageJerseyView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/editar/:id',
    name: 'EditJersey',
    component: ManageJerseyView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/pedidos',
    name: 'AdminOrders',
    component: AdminOrdersView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/mensajes',
    name: 'AdminMessages',
    component: AdminMessagesView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/acerca-de',
    name: 'About',
    component: AboutView
  },
  {
    path: '/guia-de-talles',
    name: 'SizeGuide',
    component: SizeGuideView
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

// Guard global: corre antes de cada cambio de ruta y mira el meta de la ruta destino.
// Si el usuario no tiene permiso, lo manda al Inicio y le abre el modal de login.
router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !isAdmin.value) {
    openLoginModal('Esta sección es solo para administradores.');
    return '/';
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    openLoginModal(String(to.meta.loginMessage ?? ''));
    return '/';
  }
});

export default router;
