/*
 * @Author: KingWin
 * @Date: 2021-01-29 10:35:29
 * @LastEditTime: 2021-02-05 16:45:53
 * @Description: 
 */
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home')
  }
]

const router = new VueRouter({
  // mode: 'history', // 打包页面空白问题
  base: process.env.BASE_URL,
  routes
})

export default router
