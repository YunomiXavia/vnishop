"use client";

import InputTextAuth from "@/components/input/InputTextAuth";
import { verifyPasswordResetToken } from "@/store/authentication/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Notification from "@/components/notification/Notification";

const FormForgotPasswordVerity: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, messageVerify, error } = useAppSelector(
    (state) => state.auth
  );

  const methods = useForm<{ email: string; token: string }>({
    defaultValues: {
      email: "",
      token: "",
    },
  });

  const { handleSubmit } = methods;
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const onSubmit = (data: { email: string; token: string }) => {
    dispatch(verifyPasswordResetToken(data));
  };

  useEffect(() => {
    if (messageVerify) {
      setNotification({
        message:
          "Mã token đã được xác minh. Bạn có thể đặt lại mật khẩu của mình.",
        type: "success",
      });
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    }
    if (error) {
      setNotification({
        message: `Lỗi ${error.code}: ${error.message}`,
        type: "error",
      });
    }
  }, [messageVerify, error, router]);

  return (
    <>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-8 rounded-lg shadow-md"
        >
          <InputTextAuth
            name="email"
            label="Email"
            placeholder="Nhập email của bạn"
            required
            validation={{
              required: "Email là bắt buộc",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Vui lòng nhập email hợp lệ",
              },
            }}
          />
          <InputTextAuth
            name="token"
            label="Mã Token Đặt Lại Mật Khẩu"
            placeholder="Nhập mã token đặt lại mật khẩu của bạn"
            required
            validation={{
              required: "Mã token là bắt buộc",
              minLength: {
                value: 8,
                message: "Mã token phải có ít nhất 8 ký tự",
              },
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-4 text-white bg-indigo-600 rounded-lg
                hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
          >
            {loading ? "Đang xác minh..." : "Xác minh Mã Token"}
          </button>
        </form>
      </FormProvider>
      {notification && (
        <div className="fixed top-4 right-4 z-50 transition-opacity">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        </div>
      )}
    </>
  );
};

export default FormForgotPasswordVerity;
