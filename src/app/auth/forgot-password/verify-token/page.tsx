"use client";

import FormForgotPasswordVerity from "@/components/form/auth/FormForgotPasswordVerity";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

const PasswordVerify = () => {
  const [loaded, setLoaded] = useState(false);

  // Trigger transition on page load
  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div
      className={`flex items-center justify-center min-h-screen px-4 transition-opacity duration-1000 ${
        loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div
        className={`w-full max-w-lg bg-white p-8 rounded-lg shadow-lg transform transition-transform duration-1000 ${
          loaded ? "translate-y-0 scale-100" : "translate-y-10 scale-95"
        }`}
      >
        {/* Page Header */}
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Verify Password Reset Token
        </h1>

        {/* Password Verify Form */}
        <FormForgotPasswordVerity />

        {/* Go Back Section */}
        <div className="mt-6 flex items-center justify-center text-gray-600">
          <FaArrowLeft className="mr-2" />
          <Link href="/auth/login" className="text-indigo-500 hover:underline">
            Go Back to Login Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordVerify;
