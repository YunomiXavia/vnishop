"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import * as XLSX from "xlsx";
import Notification from "@/components/notification/Notification";
import { FaPen, FaFileExcel, FaTrash, FaPlus } from "react-icons/fa";
import Pagination from "@/components/pagination/Pagination";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/store/category/categorySlice";
import { extractError } from "@/utils/utils/helper";
import { Category } from "@/types/category/category";

const FormCategoryAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categories, loading, error } = useAppSelector(
    (state) => state.categories
  );

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    null
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(categories.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const paginatedCategories = categories.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const formRef = useRef<HTMLFormElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentCategoryId) {
        await dispatch(
          updateCategory({
            id: currentCategoryId,
            categoryData: formData,
          })
        );
        setNotification({
          message: "Cập nhật danh mục thành công!",
          type: "success",
        });
      } else {
        await dispatch(createCategory(formData));
        setNotification({
          message: "Tạo danh mục thành công",
          type: "success",
        });
      }
      setShowForm(false);
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: isEditing
          ? `Cập nhật danh mục thất bại: ${err.code}: ${err.message}`
          : `Tạo danh mục thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleEditClick = (category: Category) => {
    setIsEditing(true);
    setCurrentCategoryId(category.id);
    setFormData({
      name: category.name || "",
      description: category.description || "",
    });
    setShowForm(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await dispatch(deleteCategory(categoryId));
      setNotification({
        message: "Xóa danh mục thành công!",
        type: "success",
      });
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xóa danh mục thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleRowSelect = (categoryId: string) => {
    setSelectedCategories((prevCategories) => {
      if (prevCategories.includes(categoryId)) {
        return prevCategories.filter((id) => id !== categoryId);
      } else {
        return [...prevCategories, categoryId];
      }
    });
  };

  const handleExportToExcel = () => {
    try {
      const excelData = categories.map((category, index) => ({
        Index: index + 1,
        ID: category.id,
        Category: category.name,
        Description: category.description,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Danh mục");

      XLSX.writeFile(workbook, "DanhMuc.xlsx");

      setNotification({ message: "Xuất dữ liệu thành công!", type: "success" });
    } catch (error) {
      setNotification({
        message: `Xuất dữ liệu thất bại: ${error}`,
        type: "error",
      });
    }
  };

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowForm(false);
      }
    };

    if (showForm) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showForm]);

  useEffect(() => {
    if (error) {
      setNotification({
        message: `Lỗi ${error.code}: ${error.message}`,
        type: "error",
      });
    }
  }, [error]);

  if (loading) return <p>Đang tải danh mục...</p>;
  return (
    <div className="p-4">
      {notification && (
        <div className="fixed top-4 right-4 z-50 transition-opacity">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      {showForm && (
        <>
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setShowForm(false)}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-50"
              ref={formRef}
            >
              <h3 className="text-lg font-semibold mb-4">
                {isEditing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Nhập tên danh mục"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  required
                />
                <input
                  type="text"
                  name="description"
                  placeholder="Nhập mô tả"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  required
                />
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-400 hover:text-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      <div className="p-4 mx-auto ">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-semibold text-indigo-700">
            Quản lý danh mục
          </h2>
          <div className="flex space-x-2">
            <button
              className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleExportToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất Excel
            </button>
            <button
              className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: "",
                  description: "",
                });
                setShowForm(true);
              }}
            >
              <FaPlus className="mr-2" />
              Thêm mới
            </button>
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
          <table className="min-w-full bg-white border rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2 text-center">STT</th>
                <th className="px-4 py-2 text-center">Tên</th>
                <th className="px-4 py-2 text-center">Mô tả</th>
                <th className="px-4 py-2 text-center">Sửa</th>
                <th className="px-4 py-2 text-center">Xóa</th>
              </tr>
            </thead>

            <tbody>
              {paginatedCategories.map((category, index) => (
                <tr
                  key={category.id}
                  className={`hover:bg-gray-50 transition ease-in-out
                            duration-200 cursor-pointer ${
                              selectedCategories.includes(category.id)
                                ? "bg-indigo-100"
                                : "hover:bg-gray-50"
                            }  `}
                  onClick={() => handleRowSelect(category.id)}
                >
                  <td className="border px-4 py-2 text-center">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {category.name}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {category.description}
                  </td>
                  <td className="border px-4 py-2 text-center space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110"
                      onClick={() => handleEditClick(category)}
                    >
                      <FaPen />
                    </button>
                  </td>
                  <td className="border px-4 py-2 text-center space-x-2">
                    <button
                      className="text-red-600 hover:text-red-800 transition transform hover:scale-110"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Đang hiển thị từ {(currentPage - 1) * rowsPerPage + 1} đến{" "}
          {Math.min(currentPage * rowsPerPage, categories.length)}, tổng số{" "}
          {categories.length} mục
        </p>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default FormCategoryAdmin;
