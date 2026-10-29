import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CatalogView from '../views/CatalogView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import ManageJerseyView from '../views/ManageJerseyView.vue';
import AboutView from '../views/AboutView.vue';
import CheckoutView from '../views/CheckoutView.vue';
import AdminOrdersView from '../views/AdminOrdersView.vue';
import UserOrdersView from '../views/UserOrdersView.vue';

const routes = [
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
    component: CheckoutView
  },
  {
    path: '/mis-pedidos',
    name: 'UserOrders',
    component: UserOrdersView
  },
  {
    path: '/admin/camisetas',
    name: 'CreateJersey',
    component: ManageJerseyView
  },
  {
    path: '/admin/editar/:id',
    name: 'EditJersey',
    component: ManageJerseyView
  },
  {
    path: '/admin/pedidos',
    name: 'AdminOrders',
    component: AdminOrdersView
  },
  {
    path: '/acerca-de',
    name: 'About',
    component: AboutView
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

export default router;
