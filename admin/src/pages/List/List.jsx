import React, { useEffect, useState } from 'react'
import './List.css'
import axios from "axios"
import {toast} from "react-toastify"
import PropTypes from 'prop-types'
import { SquarePen, X } from 'lucide-react';
import { NavLink } from 'react-router-dom'

const List = ({url}) => {
  List.propTypes = {
    url: PropTypes.string.isRequired
  }

  const [list,setList] = useState([]);

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    if (response.data.success) {
      setList(response.data.data);
    }
    else
    {
      toast.error("Error")
    }
  }

  const removeFood = async(foodId) => {
    const response = await axios.post(`${url}/api/food/remove`,{id:foodId})
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message);
    }
    else{
      toast.error("Error");
    }
  }

  useEffect(()=>{
    fetchList();
  }, [])

  return (
    <div className='list add flex-col'>
      <div className="list-header">
        <p>All Foods List</p>
        <NavLink to='/add'>
          <p className="add-button bg-[#ff6347] text-orange-100 transition-transform duration-200 hover:scale-105">Add Items</p>
        </NavLink>
      </div>
      <div className="list-table">
        <div className="list-table-format">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {list.map((item,index)=>{
            return (
              <div key={index} className='list-table-format'>
                <img src={`${url}/images/`+item.image} alt="" />
                <p>{item.name}</p>
                <p>{item.category}</p>
                <p>${item.price}</p>
                <div className='flex gap-3'>
                  <NavLink to ={`/edit/${item._id}`}>
                    <SquarePen size={14} className='cursor'/>
                  </NavLink>
                  <p onClick={()=>removeFood(item._id)} className='cursor'><X size={14} /></p>
                </div>
              </div>
            )
        })}
      </div>
    </div>
  )
}

export default List