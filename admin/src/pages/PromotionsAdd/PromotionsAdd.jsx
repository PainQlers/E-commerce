import React, { useState } from 'react'
import './PromotionsAdd.css'
import axios from "axios"
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const promotionsAdd = ({url}) => {

    const navigate = useNavigate();
    const [loading,setLoading] = useState(false);
    const [errors,setErrors] = useState({});
    const [data,setData] = useState({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minOrderAmount: "",
        maxDiscount: "",
        startDate: "",
        endDate: "",
        usageLimit: ""
    })

    const fieldClass = (field) => {
        const base = "rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 p-2!";
        const border = errors[field] ? "border-red-500" : "border-gray-300";
        return `border ${border} ${base}`;
    };

    const onChangeHandler = (event) => {
        const { name, value } = event.target;

        // Clear error on field change
        setErrors((prev) => ({ ...prev, [name]: false }));

        if (name === "discountType") {
        setData((prev) => ({
            ...prev,
            discountType: value,
            maxDiscount: value === "fixed" ? prev.discountValue : prev.maxDiscount,
        }));
        return;
        }

        if (name === "discountValue") {
            let newValue = Number(value);

            // กันค่าติดลบ
            if (newValue < 0) newValue = 0;

            // ถ้าเป็น percentage จำกัดไม่เกิน 100
            if (data.discountType === "percentage" && newValue > 100) {
            newValue = 100;
            }

            setData((prev) => ({
            ...prev,
            discountValue: newValue,
            // 👇 ถ้าเป็น fixed → sync maxDiscount
            maxDiscount:
                data.discountType === "fixed" ? newValue : prev.maxDiscount,
            }));
        } else {
            setData((prev) => ({
            ...prev,
            [name]: value,
            }));
        }
            };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        
        // Validation
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        const empty = (value) => value === undefined || value === null || String(value).trim() === "";
        const newErrors = {};
        if (empty(data.code)) newErrors.code = true;
        if (empty(data.discountType)) newErrors.discountType = true;
        if (empty(data.discountValue)) newErrors.discountValue = true;
        if (empty(data.usageLimit)) newErrors.usageLimit = true;
        if (empty(data.minOrderAmount)) newErrors.minOrderAmount = true;
        if (data.discountType === "percentage" && empty(data.maxDiscount)) newErrors.maxDiscount = true;
        if (empty(data.startDate)) newErrors.startDate = true;
        if (empty(data.endDate)) newErrors.endDate = true;

        setLoading(true);

        const payload = {
            ...data,
            discountValue: Number(data.discountValue),
            minOrderAmount: Number(data.minOrderAmount) || 0,
            maxDiscount: Number(data.maxDiscount) || 0,
            usageLimit: Number(data.usageLimit) || 0
        };

        try {
            const response = await axios.post(`${url}/api/promotion/create`, payload);
            if (response.data.success) {
                setData({
                    code: "",
                    discountType: "percentage",
                    discountValue: "",
                    minOrderAmount: "",
                    maxDiscount: "",
                    startDate: "",
                    endDate: "",
                    usageLimit: ""
                })
                toast.success(response.data.message)
                navigate("/promotionsList");
            }
            else if(data.usageLimit < 0) {
                setErrors({ usageLimit: true});
                toast.error(response.data.message)
                return;
            }
            else if(data.minOrderAmount < 0) {
                setErrors({ minOrderAmount: true});
                toast.error(response.data.message)
                return;
            }
            else if(data.maxDiscount < 0) {
                setErrors({ maxDiscount: true});
                toast.error(response.data.message)
                return;
            }
            else if(data.startDate && data.endDate && end < start) {
                setErrors({ startDate: true, endDate: true });
                toast.error("End date must be after start date");
                return;
            }
            else if(Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                toast.error("Please fill all required fields");
                return;
            }
            else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(response.data.message)
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className='add'>
        <form className='flex-col' onSubmit={onSubmitHandler}>
            <div className="add-field flex-col">
                <p>Promotion Code</p>
                <input
                    onChange={onChangeHandler}
                    value={data.code}
                    type="text"
                    name='code'
                    placeholder='e.g. SPRING10'
                    className={`${fieldClass('code')}`}
                    maxLength={8}
                />
            </div>

            <div className="add-field flex-col">
                <p>Discount Type</p>
                <select
                    onChange={onChangeHandler}
                    value={data.discountType}
                    name="discountType"
                    className={`${fieldClass('discountType')}`}
                >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                </select>
            </div>

            <div className="add-row">
                <div className="add-field flex-col">
                    <p>Discount Value</p>
                    <input
                        onChange={onChangeHandler}
                        value={data.discountValue}
                        type="number"
                        step="0.01"
                        min="0"
                        name='discountValue'
                        placeholder='e.g. 10'
                        className={`${fieldClass('discountValue')}`}
                    />
                </div>
                <div className="add-field flex-col">
                    <p>Usage Limit</p>
                    <input
                        onChange={onChangeHandler}
                        value={data.usageLimit}
                        type="text"
                        maxLength={7}
                        pattern="-?[0-9]*"
                        name='usageLimit'
                        placeholder='e.g. 100'
                        className={`${fieldClass('usageLimit')}`}
                    />
                </div>
            </div>

            <div className="add-row">
                <div className="add-field flex-col">
                    <p>Minimum Order Amount</p>
                    <input
                        onChange={onChangeHandler}
                        value={data.minOrderAmount}
                        type="text"
                        maxLength={7}
                        pattern="-?[0-9]*"
                        name='minOrderAmount'
                        placeholder='e.g. 100'
                        className={`${fieldClass('minOrderAmount')}`}
                    />
                </div>
                <div className="add-field flex-col">
                    {data.discountType === "percentage" && (
                    <>
                        <p>Maximum Discount</p>
                        <input
                        onChange={onChangeHandler}
                        value={data.maxDiscount || ""}
                        type="text"
                        maxLength={7}
                        pattern="-?[0-9]*"
                        name="maxDiscount"
                        placeholder="e.g. 50"
                        className={`${fieldClass('maxDiscount')}`}
                        />
                    </>
                    )}
                </div>
            </div>

            <div className="add-row">
                <div className="add-field flex-col">
                    <p>Start Date</p>
                    <input
                        onChange={onChangeHandler}
                        value={data.startDate}
                        type="datetime-local"
                        name='startDate'
                        className={`${fieldClass('startDate')}`}
                    />
                </div>
                <div className="add-field flex-col">
                    <p>End Date</p>
                    <input
                        onChange={onChangeHandler}
                        value={data.endDate}
                        type="datetime-local"
                        name='endDate'
                        min={data.startDate}
                        className={`${fieldClass('endDate')}`}
                    />
                </div>
            </div>

            <button type='submit' className='add-btn' disabled={loading}>{loading ? "Adding..." : "ADD"}</button>
        </form>
    </div>
  )
}

export default promotionsAdd