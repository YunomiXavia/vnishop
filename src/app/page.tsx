"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [decodedToken, setDecodedToken] = useState<any | null>(null);
  const router = useRouter();

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Trigger animations on page load and check token/role
  useEffect(() => {
    setLoaded(true);
    const token = Cookies.get("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setDecodedToken(decoded);
      } catch (err) {
        console.error("Invalid token:", err);
        setDecodedToken(null);
      }
    }
  }, []);

  // Handle navigation based on role or login page
  const handleAccessSystem = () => {
    if (!decodedToken) {
      router.push("/auth/login");
      return;
    }

    switch (decodedToken.role) {
      case "ROLE_Admin":
        router.push("/admin");
        break;
      case "ROLE_User":
        router.push("/user");
        break;
      case "ROLE_Collaborator":
        router.push("/collaborator");
        break;
      default:
        router.push("/auth/login");
    }
  };

  return (
    <div className="relative">
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-indigo-800 shadow-lg" : "bg-indigo-900"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6 text-white">
          <button
            className="text-lg font-semibold hover:underline transition duration-300"
            onClick={() => router.push("#")}
          >
            Quản lý hệ thống
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="h-screen relative flex items-center justify-center text-white">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-sm"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1709884735626-63e92727d8b6?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          }}
        ></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-indigo-800 opacity-60"></div>

        {/* Content */}
        <div
          className={`relative z-10 text-center transition-opacity duration-1000 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
            Web Quản lý Vinshop
          </h1>
          <p className="text-lg md:text-xl mt-4 text-gray-200">
            Trang quản lý Web bán hàng Vinshop
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={handleAccessSystem}
              className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-lg font-semibold text-lg transition shadow-md"
            >
              TRUY CẬP HỆ THỐNG
            </button>
            {!decodedToken && (
              <Link
                href="/auth/login"
                className="bg-gray-600 hover:bg-gray-700 px-8 py-3 rounded-lg font-semibold text-lg transition shadow-md"
              >
                ĐĂNG NHẬP
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className=" text-center py-4">
        <div className="text-gray-400">
          <p className="text-sm">Yunomi Xavia © 2024</p>
          <p className="text-sm">
            Quản lý hệ thống{" "}
            <a
              href="#"
              className="text-indigo-400 hover:underline hover:text-indigo-300 transition"
            >
              Vinshop
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
