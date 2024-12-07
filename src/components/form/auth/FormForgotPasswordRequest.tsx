"use client";

import InputTextAuth from "@/components/input/InputTextAuth";
import Notification from "@/components/notification/Notification";
import { requestPasswordReset } from "@/store/authentication/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

const FormForgotPasswordRequest: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, messageRequest, error } = useAppSelector(
      (state) => state.auth
  );

  const methods = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });

  const { handleSubmit } = methods;
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const onSubmit = (data: { email: string }) => {
    dispatch(requestPasswordReset(data.email));
  };

  useEffect(() => {
    if (messageRequest) {
      setNotification({
        message: "Yêu cầu đặt lại mật khẩu đã được gửi. Kiểm tra email của bạn để nhận hướng dẫn.",
        type: "success",
      });
      setTimeout(() => {
        router.push("/auth/forgot-password/verify-token");
      }, 3000);
    }
    if (error) {
      setNotification({
        message: `Lỗi ${error.code}: ${error.message}`,
        type: "error",
      });
    }
  }, [messageRequest, error, router]);

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
                placeholder="Nhập địa chỉ email của bạn"
                required
                validation={{
                  required: "Email là bắt buộc",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Vui lòng nhập email hợp lệ",
                  },
                }}
            />
            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 mt-4 text-white bg-indigo-600 rounded-lg
                hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
            >
              {loading ? "Đang yêu cầu..." : "Yêu cầu đặt lại mật khẩu"}
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

export default FormForgotPasswordRequest;
