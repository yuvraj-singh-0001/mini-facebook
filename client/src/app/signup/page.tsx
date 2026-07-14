"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Eye, EyeOff, User, Camera } from "lucide-react";
import { API_URL } from "@/config/api";

export default function Signup() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear - i - 1);
  
  const [step, setStep] = useState<"form" | "upload">("form");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailOrPhone: "",
    password: "",
    dobDay: "1",
    dobMonth: "1",
    dobYear: "2010",
    gender: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    emailOrPhone: "",
    password: "",
    gender: "",
  });

  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === "firstName" || name === "lastName") {
      newValue = toTitleCase(value);
    }

    if (name === "emailOrPhone") {
      if (newValue.startsWith("+91")) newValue = newValue.substring(3).trim();
      if (/^\d/.test(newValue)) {
        newValue = newValue.replace(/\D/g, '').slice(0, 10);
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let errorMsg = "";

    if (!value) {
      errorMsg = "This field is required";
    } else {
      if (name === "emailOrPhone") {
        if (/^\d/.test(value)) {
          if (value.length < 10) {
            errorMsg = "Please enter 10 digit number";
          }
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errorMsg = "Please enter a valid email address";
          }
        }
      }
    }
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    
    let hasError = false;
    const newErrors = { ...errors };
    
    (["firstName", "lastName", "emailOrPhone", "password", "gender"] as const).forEach(field => {
      if (!formData[field]) {
        newErrors[field] = "This field is required";
        hasError = true;
      }
    });

    if (formData.emailOrPhone) {
      if (/^\d/.test(formData.emailOrPhone)) {
        if (formData.emailOrPhone.length < 10) {
          newErrors.emailOrPhone = "Please enter 10 digit number";
          hasError = true;
        }
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.emailOrPhone)) {
          newErrors.emailOrPhone = "Please enter a valid email address";
          hasError = true;
        }
      }
    }

    setErrors(newErrors);
    if (hasError) return;
    
    const selectedDate = new Date(parseInt(formData.dobYear), parseInt(formData.dobMonth) - 1, parseInt(formData.dobDay));
    const today = new Date();
    let age = today.getFullYear() - selectedDate.getFullYear();
    const m = today.getMonth() - selectedDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
      age--;
    }

    if (age < 1 || age > 16) {
      setApiError("You must be between 1 and 16 years old to create an account.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Move to upload step instead of redirecting
      setStep("upload");
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!profileImage) return;
    setLoading(true);
    setApiError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/auth/profile-picture`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: profileImage })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (err: any) {
      setApiError(err.message);
      setLoading(false);
    }
  };

  const handleSkip = () => {
    window.location.href = "/";
  };

  const isPhoneInput = formData.emailOrPhone.length > 0 && /^\d/.test(formData.emailOrPhone);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 font-sans relative overflow-x-hidden">

      <div className="flex flex-col md:flex-row items-center w-full max-w-[900px] justify-between gap-8 md:gap-12 my-4 md:my-0">
        
        {/* Left Side: Logo & Text */}
        <div className="hidden md:flex flex-col w-full md:w-1/2 pr-2 text-center md:text-left z-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#1877f2] mb-4 tracking-tight">Vaaknow</h1>
          <p className="text-lg lg:text-2xl text-[#1c1e21] leading-snug">
            A safe, moderated social platform for students (ages 6–16) to connect with Birdies and share clean Chirps & Reels.
          </p>
        </div>

        {/* Right Side: Form / Upload Container */}
        <div className="w-full max-w-[480px] relative">
          
          {/* Step 1: Signup Form */}
          <div className={`w-full bg-white p-6 md:p-8 rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-500 ease-in-out ${step === "form" ? "opacity-100 scale-100 relative z-10" : "opacity-0 scale-95 absolute pointer-events-none"}`}>
            {/* Header */}
            <div className="text-center mb-5 md:mb-3 border-b border-gray-200 pb-3 md:pb-2">
              <h1 className="text-3xl font-bold text-[#1877f2] mb-2 tracking-tight md:hidden">Vaaknow</h1>
              <h2 className="text-[24px] font-semibold text-[#1c1e21]">Create a new account</h2>
              <p className="text-[15px] text-[#606770] mt-1 md:mt-0">It's quick and easy.</p>
            </div>

            <div className="w-full">
              {apiError && step === "form" && <div className="mb-4 p-3 bg-red-100 text-red-600 text-[14px] rounded border border-red-200 text-center">{apiError}</div>}
              
              <form onSubmit={handleSignup} className="flex flex-col gap-4 md:gap-2.5">
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1 md:mb-0.5">
                      <label className="block text-[13px] md:text-[12px] font-medium text-gray-700">First Name</label>
                      {errors.firstName && <span className="text-[11px] text-red-500 leading-tight ml-1">{errors.firstName}</span>}
                    </div>
                    <input 
                      type="text" 
                      name="firstName"
                      placeholder="First name" 
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 md:py-1.5 text-[15px] md:text-[14px] border ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-[#ccd0d5] bg-[#f5f6f7]'} rounded-[5px] focus:outline-none focus:border-[#1877f2] focus:bg-white text-[#1c1e21] transition-colors`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1 md:mb-0.5">
                      <label className="block text-[13px] md:text-[12px] font-medium text-gray-700">Surname</label>
                      {errors.lastName && <span className="text-[11px] text-red-500 leading-tight ml-1">{errors.lastName}</span>}
                    </div>
                    <input 
                      type="text" 
                      name="lastName"
                      placeholder="Surname" 
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 md:py-1.5 text-[15px] md:text-[14px] border ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-[#ccd0d5] bg-[#f5f6f7]'} rounded-[5px] focus:outline-none focus:border-[#1877f2] focus:bg-white text-[#1c1e21] transition-colors`}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1 md:mb-0.5">
                    <label className="block text-[13px] md:text-[12px] font-medium text-gray-700">Mobile number or email address</label>
                    {errors.emailOrPhone && <span className="text-[11px] text-red-500 leading-tight ml-1 text-right">{errors.emailOrPhone}</span>}
                  </div>
                  <div className="relative flex items-center">
                    {isPhoneInput && (
                      <span className="absolute left-3 text-[#1c1e21] text-[15px] font-medium pointer-events-none">
                        +91
                      </span>
                    )}
                    <input 
                      type="text" 
                      name="emailOrPhone"
                      placeholder="Mobile number or email address" 
                      value={formData.emailOrPhone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full ${isPhoneInput ? 'pl-11 pr-3' : 'px-3'} py-2 md:py-1.5 text-[15px] md:text-[14px] border ${errors.emailOrPhone ? 'border-red-500 bg-red-50' : 'border-[#ccd0d5] bg-[#f5f6f7]'} rounded-[5px] focus:outline-none focus:border-[#1877f2] focus:bg-white text-[#1c1e21] transition-colors`}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1 md:mb-0.5">
                    <label className="block text-[13px] md:text-[12px] font-medium text-gray-700">New password</label>
                    {errors.password && <span className="text-[11px] text-red-500 leading-tight ml-1">{errors.password}</span>}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      placeholder="New password" 
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 md:py-1.5 pr-10 text-[15px] md:text-[14px] border ${errors.password ? 'border-red-500 bg-red-50' : 'border-[#ccd0d5] bg-[#f5f6f7]'} rounded-[5px] focus:outline-none focus:border-[#1877f2] focus:bg-white text-[#1c1e21] transition-colors`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[13px] md:text-[12px] font-medium text-gray-700 flex items-center gap-1 mb-1 md:mb-0.5">Date of birth</span>
                  <div className="flex gap-3 md:gap-2">
                    <select name="dobDay" value={formData.dobDay} onChange={handleChange} className="flex-1 h-[40px] md:h-[34px] px-2 border border-[#ccd0d5] rounded-[5px] bg-white text-[#1c1e21] text-[15px] md:text-[14px] focus:outline-none focus:border-[#1877f2]">
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select name="dobMonth" value={formData.dobMonth} onChange={handleChange} className="flex-1 h-[40px] md:h-[34px] px-2 border border-[#ccd0d5] rounded-[5px] bg-white text-[#1c1e21] text-[15px] md:text-[14px] focus:outline-none focus:border-[#1877f2]">
                      {months.map((month, index) => (
                        <option key={month} value={index + 1}>{month}</option>
                      ))}
                    </select>
                    <select name="dobYear" value={formData.dobYear} onChange={handleChange} className="flex-1 h-[40px] md:h-[34px] px-2 border border-[#ccd0d5] rounded-[5px] bg-white text-[#1c1e21] text-[15px] md:text-[14px] focus:outline-none focus:border-[#1877f2]">
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1 md:mb-0.5">
                    <span className="text-[13px] md:text-[12px] font-medium text-gray-700 flex items-center gap-1">Gender</span>
                    {errors.gender && <span className="text-[11px] text-red-500 leading-tight ml-1">{errors.gender}</span>}
                  </div>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    className={`w-full h-[40px] md:h-[34px] px-2 border ${errors.gender ? 'border-red-500 bg-red-50' : 'border-[#ccd0d5] bg-white'} rounded-[5px] text-[#1c1e21] text-[15px] md:text-[14px] focus:outline-none focus:border-[#1877f2] transition-colors`}
                  >
                    <option value="" disabled>Select your gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <p className="text-[12px] md:text-[11px] text-[#777] mt-1 mb-1 leading-relaxed md:leading-tight text-center md:text-left">
                  By clicking Sign Up, you agree to our <a href="#" className="text-[#1877f2] hover:underline">Terms</a>, <a href="#" className="text-[#1877f2] hover:underline">Privacy Policy</a> and <a href="#" className="text-[#1877f2] hover:underline">Cookies Policy</a>.
                </p>

                <div className="flex justify-center mt-1">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-[85%] bg-[#00a400] hover:bg-[#008c00] disabled:opacity-50 text-white font-bold text-[18px] md:text-[17px] py-2 md:py-1.5 rounded-[6px] transition-colors"
                  >
                    {loading ? "Signing up..." : "Sign Up"}
                  </button>
                </div>
                
                <div className="text-center mt-3 pt-3 border-t border-gray-200">
                  <Link href="/login" title="Log in to Vaaknow" className="text-[#1877f2] hover:underline text-[15px] font-semibold">
                    Already have an account? Log in
                  </Link>
                </div>
                
              </form>
            </div>
          </div>

          {/* Step 2: Upload Profile Picture */}
          <div className={`w-full bg-white p-6 md:p-8 rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-500 ease-in-out ${step === "upload" ? "opacity-100 scale-100 relative z-10" : "opacity-0 scale-95 absolute top-0 pointer-events-none"}`}>
            <div className="text-center mb-6">
              <h2 className="text-[26px] font-bold text-[#1c1e21]">Add a Profile Picture</h2>
              <p className="text-[15px] text-[#606770] mt-2">Add a photo so your friends can easily find you.</p>
            </div>

            {apiError && step === "upload" && <div className="mb-4 p-3 bg-red-100 text-red-600 text-[14px] rounded border border-red-200 text-center">{apiError}</div>}

            <div className="flex flex-col items-center justify-center gap-6 mt-4">
              <div className="relative">
                <div className="w-[160px] h-[160px] rounded-full overflow-hidden border-4 border-white shadow-[0_0_0_2px_#1877f2] flex items-center justify-center bg-[#f0f2f5] relative group">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={80} className="text-[#ccd0d5]" />
                  )}
                  
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={32} className="text-white mb-1" />
                    <span className="text-white text-[13px] font-medium">Change</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                
                {!profileImage && (
                  <label className="absolute bottom-1 right-1 bg-[#1877f2] hover:bg-[#166fe5] p-3 rounded-full cursor-pointer shadow-md transition-colors">
                    <Camera size={20} className="text-white" />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
              
              <div className="w-full flex flex-col gap-3 mt-6">
                <button 
                  onClick={handleUploadSubmit} 
                  disabled={!profileImage || loading} 
                  className="w-full bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-50 text-white font-bold text-[17px] py-2.5 rounded-[6px] transition-colors"
                >
                  {loading ? "Saving..." : "Save Profile Picture"}
                </button>
                <button 
                  onClick={handleSkip} 
                  disabled={loading} 
                  className="w-full bg-transparent hover:bg-gray-100 text-[#606770] font-semibold text-[16px] py-2.5 rounded-[6px] transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
