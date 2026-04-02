import React, { useEffect, useState } from 'react'
import './PromotionsList.css'
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

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/promotion/get`);
    if (response.data.success) {
      setList(response.data.data);
    }
    else
    {
      toast.error("Error")
    }
  }

  const removeFood = async(promotionId) => {
    const response = await axios.delete(`${url}/api/promotion/delete/${promotionId}`)
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
    <div className='promotions-list list add flex-col'>
      <div className="list-header">
        <p>All Promotions</p>
        <NavLink to='/promotionsAdd'>
          <p className="add-button bg-[#ff6347] text-orange-100 transition-transform duration-200 hover:scale-105">Add Promotions</p>
        </NavLink>
      </div>
      <div className="list-table">
        <div className="list-table-format title p-4">
          <b>Code</b>
          <b>Type</b>
          <b>Discount Value</b>
          <b>Minimum Amount</b>
          <b>Maximum Discount</b>
          <b>Usage Limit</b>
          <b>From</b>
          <b>To</b>
          <b>Actions</b>
        </div>
        {list.map((item) => {
            return (
              <div key={item._id} className='list-table-format p-4'>
                <p className='hover:underline cursor-pointer'>{item.code}</p>
                <p>{item.discountType}</p>
                <p>{item.discountValue}{item.discountType === "percentage" && (
                  <>
                  %
                  </>
                )}
                {item.discountType === "fixed" && (
                  <>
                  $
                  </>
                )}
                </p>
                <p>{item.minOrderAmount}$</p>
                <p>{item.maxDiscount}$</p>
                <p>{item.usageLimit}</p>
                <p>{formatDateTime(item.startDate)}</p>
                <p>{formatDateTime(item.endDate)}</p>
                <div className='flex gap-3'>
                  <NavLink to ={`/promotionsEdit/${item._id}`}>
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