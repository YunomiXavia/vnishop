import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { LoginFormData } from "@/types/authentication/auth";
import { login } from "@/store/authentication/authSlice";
import InputTextAuth from "@/components/input/InputTextAuth";
import Link from "next/link";

const FormLogin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const methods = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const { handleSubmit } = methods;
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(!showPassword);

  const onSubmit = (data: LoginFormData) => {
    dispatch(login(data));
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md"
      >
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
        <div className="flex items-center justify-between mb-6">
          <Link
            className="text-sm text-indigo-600 hover:underline"
            href="/auth/forgot-password"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/*TODO refactor button*/}
        <button
          className="w-full py-2 text-white bg-indigo-600 rounded-lg
                      hover:bg-indigo-700 focus:outline-none focus:bg-indigo-700
                      disabled:bg-indigo-400"
          type="submit"
          disabled={loading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
        </button>

        {error && (
          <div className="mt-4 text-center">
            <p className="text-red-500">
              <span className="font-semibold">Lỗi {error.code}:</span>{" "}
              {error.message}
            </p>
          </div>
        )}
      </form>
    </FormProvider>
  );
};

export default FormLogin;
