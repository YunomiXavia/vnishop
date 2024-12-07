"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { useAppSelector } from "@/store/hooks";
import FormRegister from "@/components/form/auth/FormRegister";

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const [loaded, setLoaded] = useState(false);

  // Redirect if the user is already logged in
  useEffect(() => {
    if (token) {
      router.push("/");
    }
  }, [token, router]);

  // Trigger appearance animation
  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 transition-opacity duration-1000 ${
        loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div
        className={`w-full max-w-fit bg-white rounded-lg shadow-lg p-8 transform transition-transform duration-1000 ${
          loaded ? "translate-y-0 scale-100" : "translate-y-10 scale-95"
        }`}
      >
        {/* Page Header */}
        <h1
          className="text-3xl font-semibold
            text-center mb-8 text-gray-800"
        >
          Register
        </h1>
        {/* Register Form */}
        <FormRegister />

        {/* Go Back Section */}
        <div className="mt-6 flex items-center justify-center text-gray-600">
          <FaArrowLeft className="mr-2" />
          <Link href="/auth/login" className="text-indigo-500 hover:underline">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
