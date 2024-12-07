"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { useAppSelector } from "@/store/hooks";
import FormLogin from "@/components/form/auth/FormLogin";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.role);
  const [loaded, setLoaded] = useState(false);

  // Redirect if the user is already logged in
  useEffect(() => {
    if (token && role) {
      switch (role) {
        case "ROLE_Admin":
          router.push("/admin");
          break;
        case "ROLE_Collaborator":
          router.push("/collaborator");
          break;
        case "ROLE_User":
          router.push("/user");
          break;
        default:
          router.push("/");
      }
    }
  }, [token, role, router]);

  // Trigger transition on page load
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
        className={`w-full max-w-fit bg-white rounded-lg shadow-lg p-6 transform transition-transform duration-1000 ${
          loaded ? "translate-y-0 scale-100" : "translate-y-10 scale-95"
        }`}
      >
        {/* Page Header */}
        <h1 className="text-3xl font-semibold text-center mb-8 text-gray-800">
          Login
        </h1>
        {/* Login Form */}
        <FormLogin />

        {/* Go Back Section */}
        <div className="mt-6 flex flex-col items-center text-gray-600">
          <div className="flex items-center">
            <FaArrowLeft className="mr-2" />
            <Link href="/" className="text-indigo-500 hover:underline mr-4">
              Go back to Home Page
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="/auth/register"
              className="text-indigo-500 hover:underline ml-4"
            >
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
