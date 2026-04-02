import React from 'react'
import './Navbar.css'
import {assets} from '../../assets/assets'

const Navbar = () => {
  return (
    <div className='navbar'>
      <a href='https://e-commerce-eight-tawny-74.vercel.app/'>
        <img className='object-fill!' src={assets.logo} alt=""/>
      </a>
        <img className='profile' src={assets.profile_image} alt="" />
    </div>
  )
}

export default Navbar