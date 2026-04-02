import React from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Route, Routes } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Edit from './pages/Edit/Edit'
import Orders from './pages/Orders/Orders'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PromotionsAdd from './pages/PromotionsAdd/PromotionsAdd';
import PromotionsList from './pages/PromotionsList/PromotionsList';
import PromotionsEdit from './pages/PromotionsEdit/PromotionsEdit';

const App = () => {

  const url = "https://e-commerce-c61q.onrender.com"
  return (
    <div>
      <ToastContainer/>
      <Navbar/>
      <hr />
      <div className="app-content">
        <Sidebar/>
        <Routes>
          <Route path="/" element={<List url={url} />} />
          <Route path="/add" element={<Add url={url}/>}/>
          <Route path="/edit/:id" element={<Edit url={url}/>}/>
          <Route path="/orders" element={<Orders url={url}/>}/>
          <Route path="/promotionsAdd" element={<PromotionsAdd url={url}/>}/>
          <Route path="/promotionsList" element={<PromotionsList url={url}/>}/>
          <Route path="/promotionsEdit/:id" element={<PromotionsEdit url={url}/>}/>
        </Routes>
      </div>
    </div>
  )
}

export default App