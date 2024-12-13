import React from "react";
import { useFormContext } from "react-hook-form";
import InputTextForm from "@/components/input/InputTextForm";
import { FormUserData, UserFormProps } from "@/types/component/form/form";

const UserForm: React.FC<UserFormProps> = ({
  isEditing,
  isPasswordUpdated,
  onClose,
  onSubmit,
  onTogglePasswordUpdate,
}) => {
  const methods = useFormContext<FormUserData>();

  return (
    <form
      onSubmit={methods.handleSubmit(onSubmit)}
      className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-50"
    >
      <h3 className="text-lg font-semibold mb-4 ">
        {isEditing ? "Cập nhật người dùng" : "Thêm mới người dùng"}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <InputTextForm
          name="username"
          label="Tên đăng nhập"
          placeholder="Tên đăng nhập"
          required
          validation={{
            minLength: {
              value: 4,
              message: "Tên đăng nhập phải có ít nhất 4 ký tự",
            },
          }}
          disabled={isEditing}
        />
        {isEditing && (
          <div className="flex items-center space-x-2 col-span-2">
            <input
              type="checkbox"
              id="updatePassword"
              checked={isPasswordUpdated}
              onChange={() => {
                methods.setValue("password", "");
                if (onTogglePasswordUpdate) {
                  onTogglePasswordUpdate();
                }
              }}
              className="h-5 w-5"
            />
            <label htmlFor="updatePassword" className="text-sm">
              Cập nhật mật khẩu
            </label>
          </div>
        )}
        {(!isEditing || (isEditing && isPasswordUpdated)) && (
          <InputTextForm
            name="password"
            label="Mật khẩu"
            placeholder="Mật khẩu"
            type="password"
            required={!isEditing || isPasswordUpdated}
            validation={{
              minLength: {
                value: 8,
                message: "Mật khẩu phải có ít nhất 8 ký tự",
              },
            }}
            isPassword
            disabled={false}
          />
        )}
        <InputTextForm
          name="email"
          label="Email"
          placeholder="Email"
          type="email"
          required
          validation={{
            pattern: {
              value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
              message: "Email không hợp lệ",
            },
          }}
        />
        <InputTextForm
          name="firstName"
          label="Tên"
          placeholder="Tên"
          required
          validation={{
            maxLength: {
              value: 50,
              message: "Tên không được vượt quá 50 ký tự",
            },
          }}
        />
        <InputTextForm
          name="lastName"
          label="Họ"
          placeholder="Họ"
          required
          validation={{
            maxLength: {
              value: 50,
              message: "Họ không được vượt quá 50 ký tự",
            },
          }}
        />
        <InputTextForm
          name="phoneNumber"
          label="Số điện thoại"
          placeholder="Số điện thoại"
          required
          validation={{
            pattern: {
              value: /^[0-9]{10,11}$/,
              message: "Số điện thoại không hợp lệ",
            },
          }}
        />
        <InputTextForm
          name="birthDate"
          label="Ngày sinh"
          placeholder="Ngày sinh"
          type="date"
          required
          validation={{
            validate: (value: Date | null) => {
              if (!value) return "Ngày sinh là bắt buộc";
              const today = new Date();
              return (
                value <= today || "Ngày sinh không được vượt quá ngày hôm nay"
              );
            },
          }}
        />
      </div>
      <div className="flex justify-end mt-4 space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-400 hover:text-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          {isEditing ? "Cập nhật" : "Thêm người dùng"}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
