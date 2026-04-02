import { useContext, useState } from 'react'
import './Cart.css'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'

export const Cart = () => {

    const {cartItems,food_list,removeFromCart, getTotalCartAmount,url, promoCode, discountAmount, finalAmount, applyPromoCode, clearPromoCode} = useContext(StoreContext)
    const [promoInput, setPromoInput] = useState("");
    const [promoMessage, setPromoMessage] = useState("");

    const navigate = useNavigate();

    const handlePromoSubmit = async () => {
        if (!promoInput.trim()) return;
        
        const result = await applyPromoCode(promoInput.trim());
        if (result.success) {
            setPromoMessage("Promotion applied successfully!");
            setPromoInput("");
        } else {
            setPromoMessage(result.message);
        }
    };

    const handleClearPromo = () => {
        clearPromoCode();
        setPromoMessage("");
        setPromoInput("");
    };

  return (
    <div className='cart'>
        <div className="cart-items">
          <div className="cart-items-title">
            <p>Items</p>
            <p>Title</p>
            <p>Price</p>
            <p>Quantity</p>
            <p>Total</p>
            <p>Remove</p>
          </div>
          <br />
          <hr />
          {food_list.map((items,index)=>{
              if(cartItems?.[items?._id]>0)
              {
                return (
                <div key={items._id || index}>
                  <div className='cart-items-title cart-items-item'>
                    <img src={url+"/images/"+items.image} alt="" />
                    <p>{items.name}</p>
                    <p>${items.price}</p>
                    <p>{cartItems[items._id]}</p>
                    <p>${items.price*cartItems[items._id]}</p>
                    <p onClick={()=>removeFromCart(items._id)} className='cross'>x</p>
                  </div>
                  <hr />
                </div>
                )
              }
          })}

        </div>
        <div className="cart-bottom">
          <div className="cart-total">
            <h2>Cart Totals</h2>
            <div>
              <div className="cart-total-details">
                <p>Subtotal</p>
                <p>${getTotalCartAmount()}</p>
              </div>
              <hr />
              <div className="cart-total-details">
                <p>Delivery Fee</p>
                <p>${getTotalCartAmount()===0?0:2}</p>
              </div>
              {discountAmount > 0 && (
                <>
                  <hr />
                  <div className="cart-total-details">
                    <p>Discount ({promoCode})</p>
                    <p>-${discountAmount.toFixed(2)}</p>
                  </div>
                </>
              )}
              <hr />
              <div className="cart-total-details">
                <b>Total</b>
                <b>${finalAmount > 0 ? finalAmount.toFixed(2) : (getTotalCartAmount()===0?0:getTotalCartAmount()+2).toFixed(2)}</b>
              </div>
            </div>
            <button onClick={()=>navigate('/order')}>PROCEED TO CHECKOUT</button>
          </div>
          <div className="cart-promocode">
            <div>
              <p>If you have a promo code, Enter it here</p>
              <div className="cart-promocode-input">
                <input 
                  type="text" 
                  placeholder='Promotion Code'
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  disabled={!!promoCode}
                />
                <button onClick={handlePromoSubmit} disabled={!!promoCode}>Submit</button>
              </div>
              {promoMessage && <p className={promoCode ? "success" : "error"}>{promoMessage}</p>}
              {promoCode && (
                <button onClick={handleClearPromo} className="clear-promo">Clear Promo Code</button>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}
