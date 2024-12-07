// components/FormRegister.tsx

import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { RegisterFormData } from "@/types/authentication/auth";
import { register as registerAction } from "@/store/authentication/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import InputTextAuth from "@/components/input/InputTextAuth";

const FormRegister: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const methods = useForm<RegisterFormData>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      lastName: "",
      firstName: "",
      birthDate: "",
      phoneNumber: "",
    },
  });
  const { handleSubmit, watch, setError } = methods;
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(!showPassword);

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    if (registerData.password !== confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Mật khẩu không khớp",
      });
      return;
    }
    dispatch(registerAction(registerData));
  };

  return (
      <FormProvider {...methods}>
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl"
        >
          {/* Hàng đầu tiên: Tên đăng nhập và Email */}
          <div className="grid grid-cols-2 gap-6">
            <InputTextAuth
                name="username"
                label="Tên đăng nhập"
                placeholder="Nhập tên đăng nhập của bạn"
                required
                validation={{
                  required: "Tên đăng nhập là bắt buộc",
                  minLength: {
                    value: 4,
                    message: "Tên đăng nhập phải có ít nhất 4 ký tự",
                  },
                }}
            />
            <InputTextAuth
                name="email"
                label="Email"
                placeholder="Nhập địa chỉ email của bạn"
                type="email"
                required
                validation={{
                  required: "Email là bắt buộc",
                  pattern: {
                    value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Địa chỉ email không hợp lệ",
                  },
                }}
            />
          </div>

          {/* Hàng thứ hai: Mật khẩu và Xác nhận mật khẩu */}
          <div className="grid grid-cols-2 gap-6 mt-4">
            <InputTextAuth
                name="password"
                label="Mật khẩu"
                placeholder="Nhập mật khẩu của bạn"
                type={showPassword ? "text" : "password"}
                isPassword={true}
                showPassword={showPassword}
                toggleShowPassword={toggleShowPassword}
                required
                validation={{
                  required: "Mật khẩu là bắt buộc",
                  minLength: {
                    value: 8,
                    message: "Mật khẩu phải có ít nhất 8 ký tự",
                  },
                }}
            />

            <InputTextAuth
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                placeholder="Xác nhận mật khẩu của bạn"
                type="password"
                isPassword={true}
                showPassword={showPassword}
                toggleShowPassword={toggleShowPassword}
                required
                validation={{
                  required: "Vui lòng xác nhận mật khẩu",
                  validate: (value: string) =>
                      value === watch("password") || "Mật khẩu không khớp",
                }}
            />
          </div>

          {/* Hàng thứ ba: Họ và Tên */}
          <div className="grid grid-cols-2 gap-6 mt-4">
            <InputTextAuth
                name="lastName"
                label="Họ"
                placeholder="Nhập họ của bạn"
                required
                validation={{
                  required: "Họ là bắt buộc",
                  maxLength: {
                    value: 50,
                    message: "Họ không được vượt quá 50 ký tự",
                  },
                }}
            />
            <InputTextAuth
                name="firstName"
                label="Tên"
                placeholder="Nhập tên của bạn"
                required
                validation={{
                  required: "Tên là bắt buộc",
                  maxLength: {
                    value: 50,
                    message: "Tên không được vượt quá 50 ký tự",
                  },
                }}
            />
          </div>

          {/* Ngày sinh */}
          <InputTextAuth
              name="birthDate"
              label="Ngày sinh"
              placeholder="Chọn ngày sinh của bạn"
              type="date"
              required
              validation={{
                required: "Ngày sinh là bắt buộc",
                validate: (value: string) => {
                  const selectedDate = new Date(value);
                  const today = new Date();
                  return (
                      selectedDate <= today || "Ngày sinh không được vượt quá ngày hôm nay"
                  );
                },
              }}
          />

          {/* Số điện thoại */}
          <InputTextAuth
              name="phoneNumber"
              label="Số điện thoại"
              placeholder="Nhập số điện thoại của bạn"
              required
              validation={{
                required: "Số điện thoại là bắt buộc",
                pattern: {
                  value: /^[0-9]{10,11}$/,
                  message: "Số điện thoại không hợp lệ",
                },
              }}
          />

          {/* Nút Submit */}
          <button
              className="w-full py-2 text-white bg-indigo-600 rounded-lg
                      hover:bg-indigo-700 focus:outline-none focus:bg-indigo-700
                      disabled:bg-indigo-400 mt-4"
              type="submit"
              disabled={loading}
          >
            {loading ? "Đang đăng ký..." : "Đăng Ký"}
          </button>

          {/* Hiển thị lỗi với mã lỗi và thông báo */}
          {error && (
              <div className="mt-4 text-center">
                <p className="text-red-500">
                  <span className="font-semibold">Lỗi {error.code}:</span> {error.message}
                </p>
              </div>
          )}
        </form>
      </FormProvider>
  );
};

export default FormRegister;
