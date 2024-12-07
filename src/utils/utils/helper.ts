import {ErrorResponseProps} from "@/types/error/error";
import axios from "axios";

// Helper function to extract error details
export const extractError = (error: any): ErrorResponseProps => {
    if (axios.isAxiosError(error) && error.response && error.response.data) {
        const data = error.response.data;
        return {
            code: data.code || -1,
            message: data.message || "Đã xảy ra lỗi không mong muốn.",
        };
    }
    return {
        code: -1,
        message: "Đã xảy ra lỗi không mong muốn.",
    };
};