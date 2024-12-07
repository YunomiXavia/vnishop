"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import { getMyInfo, updateMyInfo } from "@/store/user/userSlice";
import Image from "next/image";
import Notification from "@/components/notification/Notification";
import InputTextAuth from "@/components/input/InputTextAuth";
import { FormProvider, useForm } from "react-hook-form";
import { ProfileFormData } from "@/types/user/profile";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

const FormProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector((state) => state.users);
  const user = users[0] || {};
  const router = useRouter();

  // Avatar State
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar || "https://via.placeholder.com/150"
  );

  // Methods for Form
  const methods = useForm<ProfileFormData>();
  const { handleSubmit, watch, setError, reset } = methods;

  // Show Password State and Method
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(!showPassword);

  // Notification
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Handle Avatar Change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle Form Submit
  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }

    if (data.email !== data.confirmEmail) {
      setError("confirmEmail", { message: "Emails do not match" });
      return;
    }

    try {
      await dispatch(updateMyInfo(data)).unwrap();
      setNotification({
        message: "Profile Updated",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Failed to Update Profile: " + error,
        type: "error",
      });
    }
  });

  useEffect(() => {
    dispatch(getMyInfo());
  }, [dispatch]);

  // Reset form values once user data is loaded
  useEffect(() => {
    if (user) {
      reset({
        email: user.email || "",
        confirmEmail: user.email || "",
        lastName: user.lastName || "",
        firstName: user.firstName || "",
        birthDate: user.birthDate || new Date(),
        password: "",
        confirmPassword: "",
      });
    }
  }, [user, reset]);

  const role = Cookies.get("token")
    ? JSON.parse(atob(Cookies.get("token")!.split(".")[1])).role
    : null;

  const redirectUrl =
    role === "ROLE_Admin"
      ? "/admin"
      : role === "ROLE_Collaborator"
      ? "/collaborator"
      : "/user";

  return (
    <FormProvider {...methods}>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-4xl p-8">
          <div className="flex flex-col lg:flex-row">
            {/*Sidebar with Avatar and Info*/}
            <div
              className="flex flex-col items-center justify-center
                        border-r border-gray-200 pr-5"
            >
              <div className="relative mb-4">
                <Image
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover"
                  width={32}
                  height={32}
                />
                <label
                  className="absolute bottom-0 right-0 bg-indigo-500
                                    text-white p-2 rounded-full cursor-pointer"
                >
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  Tải lên
                </label>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {user?.username || "User Name"}
              </h2>
              <p className="text-gray-600">@{user?.role || "username"}</p>
              <p className="text-gray-500 text-sm mt-2">
                Member Since:{" "}
                {user?.dateJoined
                  ? new Date(user.dateJoined).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Unknown"}
              </p>
            </div>

            {/*Edit Profile Form*/}
            <main className="lg:w-2/3 w-full pl-5">
              <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                Chỉnh sửa hồ sơ
              </h1>
              {notification && (
                <Notification
                  message={notification.message}
                  type={notification.type}
                  onClose={() => setNotification(null)}
                />
              )}
              <form
                className="bg-white p-6 rounded-lg shadow"
                onSubmit={onSubmit}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputTextAuth
                    name="firstName"
                    label="First Name"
                    placeholder="First Name"
                    validation={{ required: "First name is required" }}
                  />
                  <InputTextAuth
                    name="lastName"
                    label="Last Name"
                    placeholder="Last Name"
                    validation={{ required: "Last name is required" }}
                  />
                  <InputTextAuth
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    isPassword
                    showPassword={showPassword}
                    toggleShowPassword={toggleShowPassword}
                    validation={{
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    }}
                  />
                  <InputTextAuth
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm Password"
                    type="password"
                    validation={{
                      required: "Please confirm your password",
                      validate: (value: string) =>
                        value === watch("password") || "Passwords do not match",
                    }}
                  />
                  <InputTextAuth
                    name="email"
                    label="Email"
                    placeholder="Email"
                    type="email"
                    validation={{
                      required: "Email is required",
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "Email is invalid",
                      },
                    }}
                  />
                  <InputTextAuth
                    name="confirmEmail"
                    label="Confirm Email"
                    placeholder="Confirm Email"
                    type="email"
                    validation={{
                      required: "Please confirm your email",
                      validate: (value: string) =>
                        value === watch("email") || "Emails do not match",
                    }}
                  />
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="role">
                      Vai trò
                    </label>
                    <input
                      type="text"
                      name="role"
                      id="role"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg
                                            focus:outline-none focus:border-indigo-500 pr-10"
                      value={user?.role || ""}
                      readOnly
                    />
                  </div>
                  <InputTextAuth
                    name="birthDate"
                    label="Birth Date"
                    placeholder="Enter your birth date"
                    type="date"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-500 text-white py-2 rounded-md mt-6
                                    hover:bg-indigo-600 transition duration-200"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Update Profile"}
                </button>
              </form>
            </main>
          </div>
        </div>

        {/* Go Back to Dashboard Button */}
        <button
          onClick={() => router.push(redirectUrl)}
          className="absolute bottom-4 left-4 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg flex items-center transition duration-200"
        >
          <FaArrowLeft className="mr-2" />
          Quay lại trang chủ
        </button>
      </div>
    </FormProvider>
  );
};

export default FormProfile;
