// components/InputTextForm.tsx
import { InputTextProps } from "@/types/component/input/input";
import { Controller, useFormContext } from "react-hook-form";
import React from "react";
import { EyeIcon, EyeOffIcon } from "@/constant/icons/Icon";

const InputTextForm: React.FC<
    InputTextProps & {
    isPassword?: boolean;
    showPassword?: boolean;
    toggleShowPassword?: () => void;
}
> = ({
         name,
         label,
         placeholder,
         type = "text",
         required = false,
         validation = {},
         isPassword = false,
         showPassword = false,
         toggleShowPassword,
     }) => {
    const { control } = useFormContext();

    return (
        <div className="mb-4 relative">
            <label className="block text-gray-700 mb-2" htmlFor={name}>
                {label}
            </label>
            <Controller
                name={name}
                control={control}
                rules={{
                    required: required ? `${label} là bắt buộc` : false,
                    ...validation,
                }}
                render={({ field, fieldState: { error } }) => {
                    let inputValue = field.value;
                    if (type === "date" && field.value instanceof Date) {
                        inputValue = field.value.toISOString().slice(0, 10);
                    } else if (type === "date" && typeof field.value === "string") {
                        inputValue = field.value;
                    }

                    return (
                        <>
                            <input
                                id={name}
                                {...field}
                                type={isPassword && showPassword ? "text" : type}
                                placeholder={placeholder}
                                value={inputValue || ""}
                                onChange={(e) => {
                                    let value = e.target.value;
                                    if (type === "date") {
                                        value = e.target.value ? new Date(e.target.value) : null;
                                    }
                                    field.onChange(value);
                                }}
                                className={`w-full px-4 py-2 border ${
                                    error ? "border-red-500" : "border-gray-300"
                                } rounded-lg focus:outline-none focus:border-indigo-500 pr-10`}
                                disabled={field.disabled} // Sử dụng prop disabled
                            />
                            {isPassword && (
                                <span
                                    onClick={toggleShowPassword}
                                    className="absolute inset-y-0 right-0 top-1/2 flex items-center pr-3 cursor-pointer"
                                >
                  {showPassword ? EyeOffIcon : EyeIcon}
                </span>
                            )}
                            {error && (
                                <p className="text-red-500 text-sm mt-1">{error.message}</p>
                            )}
                        </>
                    );
                }}
            />
        </div>
    );
};

export default InputTextForm;
