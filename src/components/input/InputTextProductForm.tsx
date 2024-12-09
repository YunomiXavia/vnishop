import {InputTextProductProps} from "@/types/component/input/input";
import { Controller, useFormContext } from "react-hook-form";
import React from "react";
import { EyeIcon, EyeOffIcon } from "@/constant/icons/Icon";

const InputTextProductForm: React.FC<
    InputTextProductProps & {
    isPassword?: boolean;
    showPassword?: boolean;
    toggleShowPassword?: () => void;
    as?: "select";
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
         as = "input",
         children,
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
                render={({ field, fieldState: { error } }) => (
                    <>
                        {as === "select" ? (
                            <select
                                {...field}
                                id={name}
                                className={`w-full px-4 py-2 border ${
                                    error ? "border-red-500" : "border-gray-300"
                                } rounded-lg focus:outline-none focus:border-indigo-500 pr-10`}
                            >
                                {children}
                            </select>
                        ) : (
                            <input
                                {...field}
                                id={name}
                                type={isPassword && showPassword ? "text" : type}
                                placeholder={placeholder}
                                className={`w-full px-4 py-2 border ${
                                    error ? "border-red-500" : "border-gray-300"
                                } rounded-lg focus:outline-none focus:border-indigo-500 pr-10`}
                                disabled={field.disabled}
                            />
                        )}
                        {isPassword && (
                            <span
                                onClick={toggleShowPassword}
                                className="absolute inset-y-0 right-0 top-1/2 flex items-center pr-3 cursor-pointer"
                            >
                            {showPassword ? EyeOffIcon : EyeIcon}
                          </span>
                        )}
                        {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
                    </>
                )}
            />
        </div>
    );
};

export default InputTextProductForm;
