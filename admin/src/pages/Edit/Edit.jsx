import React, { useEffect, useState } from 'react'
import './Edit.css'
import { assets } from '../../assets/assets'
import axios from "axios"
import { toast } from 'react-toastify'
import { useNavigate, useParams } from 'react-router-dom'

const Edit = ({url}) => {

    const { id } = useParams();
    const navigate = useNavigate();
    const [loading,setLoading] = useState(true);
    const [data,setData] = useState({
        name:"",
        description:"",
        price:"",
        category:"Salad",
        image: ""
    })
    const [preview, setPreview] = useState(assets.upload_area);

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data=>({...data,[name]:value}))
    }

    useEffect(() => {
      if (!id) return;
      setLoading(true);
      axios
        .get(`${url}/api/promotion/update?id=${encodeURIComponent(id)}`)
        .then((res) => {
          if (res.data.success) {
            setData(res.data.data);
            setPreview(`${url}/images/${res.data.data.image}`);
          } else {
            toast.error("ไม่พบข้อมูล");
          }
        })
        .catch(() => {
          toast.error("ไม่สามารถโหลดข้อมูลได้");
        })
        .finally(() => setLoading(false));
    }, [id, url]);

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (!data.name || !data.description || !data.price) {
            toast.error("Please fill all fields");
            return;
        }

        setLoading(true);

        const payload = {
            id,
            name: data.name,
            category: data.category,
            price: data.price,
            description: data.description,
        };

        try {
            const response = await axios.put(`${url}/api/food/edit`, payload);
            if (response.data.success) {
                toast.success("แก้ไขเรียบร้อย");
                navigate("/");
            } else {
                toast.error(response.data.message || "แก้ไขไม่สำเร็จ");
            }
        } catch (error) {
            toast.error("Error: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    }

  if (loading) {
    return <div className='add'>กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className='add'>
        <form className='flex-col' onSubmit={onSubmitHandler}>
            <div className="add-img-upload flex-col">
                <p>Upload Image</p>
                <label htmlFor="image">
                    <img src={preview} alt="" />
                </label>
                <input
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setImage(file);
                    setPreview(URL.createObjectURL(file));
                  }}
                  type="file"
                  id="image"
                  hidden
                />
            </div>
            <div className="add-product-name flex-col">
                <p>Product name</p>
                <input onChange={onChangeHandler} value={data.name} type="text" name='name' placeholder='Type here'/>
            </div>
            <div className="add-product-description flex-col">
                <p>Product description</p>
                <textarea onChange={onChangeHandler} value={data.description} name="description" rows="6" placeholder='Write content here' required></textarea>
            </div>
            <div className="add-category-price">
                <div className="add-category flex-col">
                    <p>Product category</p>
                    <select onChange={onChangeHandler} name="category">
                        <option value="Salad">Salad</option>
                        <option value="Rolls">Rolls</option>
                        <option value="Deserts">Deserts</option>
                        <option value="Sandwich">Sandwich</option>
                        <option value="Cake">Cake</option>
                        <option value="Pure Veg">Pure Veg</option>
                        <option value="Pasta">Pasta</option>
                        <option value="Noodles">Noodles</option>
                    </select>
                </div>
                <div className="add-price flex-col">
                    <p>Product price</p>
                    <input onChange={onChangeHandler} value={data.price} type="number" name='price' placeholder='$20' />
                </div>
            </div>
            <button type='submit' className='add-btn' disabled={loading}>{loading ? "Updating..." : "Update"}</button>
        </form>
    </div>
  )
}

export default Edit