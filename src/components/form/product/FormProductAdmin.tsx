"use client";

import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createProduct,
  deleteProduct,
  deleteProducts,
  getProducts,
  updateProduct,
} from "@/store/product/productSlice";
import { Product } from "@/types/product/product";
import Notification from "@/components/notification/Notification";
import { FaPen, FaFileExcel, FaTrash, FaUserPlus } from "react-icons/fa";
import { getCategories } from "@/store/category/categorySlice";
import Pagination from "@/components/pagination/Pagination";
import Chart from "@/components/chart/Chart";
import { barChartOptions } from "@/types/component/chart/chart";
import { formatCurrencyVND } from "@/utils/utils/utils";
import { FormProvider, useForm } from "react-hook-form";
import { FormCreateProductData, FormUpdateProductData } from "@/types/component/form/form";
import InputTextProductForm from "@/components/input/InputTextProductForm";
import {extractError} from "@/utils/utils/helper";
import {BASE_URL} from "@/types/api/api";
import Image from "next/image";

const FormProductAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading: productLoading, error: productError, currentPage, totalPages, totalElements, pageSize } = useAppSelector((state) => state.products);
  const { categories } = useAppSelector((state) => state.categories);

  const [showFormCreate, setShowFormCreate] = useState(false);
  const [showFormUpdate, setShowFormUpdate] = useState(false);

  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [stockFilter, setStockFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [subscriptionDurationFilter, setSubscriptionDurationFilter] = useState<number | null>(null);

  const createFormMethods = useForm<FormCreateProductData>({
    defaultValues: {
      productName: "",
      price: 0,
      description: "",
      stock: 0,
      subscriptionDuration: 0,
      category: "",
      image: undefined,
    },
  });

  const updateFormMethods = useForm<FormUpdateProductData>({
    defaultValues: {
      productName: "",
      price: 0,
      description: "",
      stock: 0,
      subscriptionDuration: 0,
      category: "",
      image: undefined,
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const onCreateSubmit = async (data: FormCreateProductData) => {
    try {
      const imageFile = data.image && data.image[0] ? data.image[0] : null;
      if (imageFile) {
        if (!["image/jpeg", "image/jpg", "image/png"].includes(imageFile.type)) {
          setNotification({ message: "Chỉ cho phép định dạng jpg/jpeg/png", type: "error" });
          return;
        }
        if (imageFile.size > 2 * 1024 * 1024) {
          setNotification({ message: "Dung lượng ảnh tối đa 2MB", type: "error" });
          return;
        }
      }

      const formData = new FormData();
      formData.append("productName", data.productName);
      formData.append("price", data.price.toString());
      formData.append("description", data.description);
      formData.append("stock", data.stock.toString());
      formData.append("subscriptionDuration", data.subscriptionDuration.toString());
      formData.append("category", data.category);
      if (imageFile) formData.append("image", imageFile);

      const resultAction = await dispatch(createProduct(formData));
      if (createProduct.fulfilled.match(resultAction)) {
        setNotification({ message: "Tạo sản phẩm mới thành công!", type: "success" });
        setShowFormCreate(false);
        await dispatch(getProducts({ page: currentPage, size: pageSize }));
      } else if (createProduct.rejected.match(resultAction) && resultAction.payload) {
        const error = resultAction.payload;
        setNotification({ message: `Lỗi ${error.code}: ${error.message}`, type: "error" });
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Đã xảy ra lỗi không mong muốn: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const onUpdateSubmit = async (data: FormUpdateProductData) => {
    if (!currentProductId) return;
    try {
      const imageFile = data.image && data.image[0] ? data.image[0] : null;
      if (imageFile) {
        if (!["image/jpeg", "image/jpg", "image/png"].includes(imageFile.type)) {
          setNotification({ message: "Chỉ cho phép định dạng jpg/jpeg/png", type: "error" });
          return;
        }
        if (imageFile.size > 2 * 1024 * 1024) {
          setNotification({ message: "Dung lượng ảnh tối đa 2MB", type: "error" });
          return;
        }
      }

      const formData = new FormData();
      formData.append("productName", data.productName);
      formData.append("price", data.price.toString());
      formData.append("description", data.description);
      formData.append("stock", data.stock.toString());
      formData.append("subscriptionDuration", data.subscriptionDuration.toString());
      formData.append("category", data.category);
      if (imageFile) formData.append("image", imageFile);

      const resultAction = await dispatch(updateProduct({ id: currentProductId, formData }));
      if (updateProduct.fulfilled.match(resultAction)) {
        setNotification({ message: "Cập nhật sản phẩm thành công!", type: "success" });
        setShowFormUpdate(false);
        await dispatch(getProducts({ page: currentPage, size: pageSize }));
      } else if (updateProduct.rejected.match(resultAction) && resultAction.payload) {
        const error = resultAction.payload;
        setNotification({ message: `Lỗi ${error.code}: ${error.message}`, type: "error" });
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Đã xảy ra lỗi không mong muốn: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleEditClick = (product: Product) => {
    setCurrentProductId(product.id);
    updateFormMethods.reset({
      productName: product.productName,
      price: product.price,
      description: product.description,
      stock: product.stock,
      subscriptionDuration: product.subscriptionDuration,
      category: product.category,
      image: undefined,
    });
    setShowFormUpdate(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const resultAction = await dispatch(deleteProduct(productId));
      if (deleteProduct.fulfilled.match(resultAction)) {
        setNotification({ message: "Xóa sản phẩm thành công!", type: "success" });
      } else if (deleteProduct.rejected.match(resultAction) && resultAction.payload) {
        const error = resultAction.payload;
        setNotification({ message: `Lỗi ${error.code}: ${error.message}`, type: "error" });
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Đã xảy ra lỗi không mong muốn: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleDeleteProducts = async (productIds: string[]) => {
    try {
      const resultAction = await dispatch(deleteProducts(productIds));
      if (deleteProducts.fulfilled.match(resultAction)) {
        setNotification({ message: "Xóa các sản phẩm thành công!", type: "success" });
      } else if (deleteProducts.rejected.match(resultAction) && resultAction.payload) {
        const error = resultAction.payload;
        setNotification({ message: `Lỗi ${error.code}: ${error.message}`, type: "error" });
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Đã xảy ra lỗi không mong muốn: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleShowConfirmPopup = () => {
    setShowConfirmPopup(true);
  };

  const handleBulkDelete = () => {
    handleDeleteProducts(selectedProducts);
    setSelectedProducts([]);
    setShowConfirmPopup(false);
  };

  const handleRowSelect = (productId: string) => {
    setSelectedProducts((prevProducts) =>
        prevProducts.includes(productId) ? prevProducts.filter((id) => id !== productId) : [...prevProducts, productId]
    );
  };

  const handleExportToExcel = () => {
    try {
      const excelData = products.map((product, index) => ({
        STT: index + 1,
        ID: product.id,
        ["Tên"]: product.productName,
        ["Giá (VND)"]: product.price,
        ["Mô tả"]: product.description,
        ["Kho"]: product.stock,
        ["Thời lượng"]: product.subscriptionDuration,
        ["Danh mục"]: product.category,
        ["Mã SP"]: product.productCode,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Sản phẩm");

      XLSX.writeFile(workbook, "SanPham.xlsx");

      setNotification({ message: "Xuất dữ liệu thành công!", type: "success" });
    } catch (error) {
      setNotification({
        message: "Xuất dữ liệu thất bại: " + error,
        type: "error",
      });
    }
  };

  const handleExportStatisticsToExcel = () => {
    try {
      const totalProducts = products.length;
      const totalValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
      const inStockCount = products.filter((product) => product.stock > 0).length;
      const outOfStockCount = totalProducts - inStockCount;
      const averageSubscriptionDuration =
          products.length > 0
              ? products.reduce((sum, product) => sum + product.subscriptionDuration, 0) / totalProducts
              : 0;

      const overviewData = [
        { ["Chỉ số"]: "Tổng SP", ["Giá trị"]: totalProducts },
        { ["Chỉ số"]: "Tổng tiền (VND)", ["Giá trị"]: totalValue.toLocaleString() },
        { ["Chỉ số"]: "Còn hàng", ["Giá trị"]: inStockCount },
        { ["Chỉ số"]: "Hết hàng", ["Giá trị"]: outOfStockCount },
        {
          ["Chỉ số"]: "Thời lượng TB",
          ["Giá trị"]: averageSubscriptionDuration.toFixed(2),
        },
      ];

      const categoryDistribution = products.reduce((acc: { [key: string]: number }, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {});

      const categoryData = Object.keys(categoryDistribution).map((category) => ({
        ["Danh mục"]: category,
        ["SL SP"]: categoryDistribution[category],
      }));

      const topSubscriptionProducts = [...products]
          .sort((a, b) => b.subscriptionDuration - a.subscriptionDuration)
          .slice(0, 5);

      const topSubscriptionProductsData = topSubscriptionProducts.map((product) => ({
        ["Tên"]: product.productName,
        ["Thời lượng"]: product.subscriptionDuration,
      }));

      const workbook = XLSX.utils.book_new();

      const overviewWorksheet = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewWorksheet, "Tổng quan");

      const categoryWorksheet = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categoryWorksheet, "Danh mục");

      const topSubscriptionWorksheet = XLSX.utils.json_to_sheet(topSubscriptionProductsData);
      XLSX.utils.book_append_sheet(workbook, topSubscriptionWorksheet, "Top Đăng ký");

      XLSX.writeFile(workbook, "ThongKe_SanPham.xlsx");

      setNotification({ message: "Xuất dữ liệu thống kê thành công!", type: "success" });
    } catch (error) {
      setNotification({
        message: "Xuất dữ liệu thống kê thất bại: " + error,
        type: "error",
      });
    }
  };

  useEffect(() => {
    dispatch(getProducts({ page: currentPage, size: pageSize }));
    dispatch(getCategories());
  }, [dispatch, currentPage, pageSize]);

  // Sửa logic lọc: stock > stockFilter (nếu stockFilter có), subscriptionDuration > subscriptionDurationFilter (nếu có)
  const filteredProducts = products.filter((product) => {
    let condition = true;
    if (stockFilter !== null && stockFilter !== undefined && !Number.isNaN(stockFilter)) {
      condition = condition && product.stock > stockFilter;
    }
    if (categoryFilter && categoryFilter.trim() !== "") {
      condition = condition && product.category === categoryFilter;
    }
    if (subscriptionDurationFilter !== null && subscriptionDurationFilter !== undefined && !Number.isNaN(subscriptionDurationFilter)) {
      condition = condition && product.subscriptionDuration > subscriptionDurationFilter;
    }
    return condition;
  });

  const totalFilteredProducts = filteredProducts.length;
  const totalValue = filteredProducts.reduce((sum, product) => sum + product.price * product.stock, 0);
  const inStockCount = filteredProducts.filter((product) => product.stock > 0).length;
  const outOfStockCount = totalFilteredProducts - inStockCount;
  const averageSubscriptionDuration =
      filteredProducts.length > 0
          ? filteredProducts.reduce((sum, product) => sum + product.subscriptionDuration, 0) / totalFilteredProducts
          : 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowFormCreate(false);
      }
    };
    if (showFormCreate) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showFormCreate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowFormUpdate(false);
      }
    };
    if (showFormUpdate) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showFormUpdate]);

  if (productLoading) return <p>Đang tải sản phẩm...</p>;
  if (productError) return <p>Lỗi {productError.code}: {productError.message}</p>;

  const stockChartData = {
    labels: ["Còn hàng", "Hết hàng"],
    datasets: [
      {
        data: [inStockCount, outOfStockCount],
        backgroundColor: ["#4caf50", "#f44336"],
        hoverBackgroundColor: ["#66bb6a", "#e57373"],
      },
    ],
  };

  const categoryDistribution = filteredProducts.reduce((acc: { [key: string]: number }, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = {
    labels: Object.keys(categoryDistribution),
    datasets: [
      {
        label: "SL SP",
        data: Object.values(categoryDistribution),
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
      },
    ],
  };

  const topSubscriptionProducts = [...filteredProducts]
      .sort((a, b) => b.subscriptionDuration - a.subscriptionDuration)
      .slice(0, 5);

  const topSubscriptionData = {
    labels: topSubscriptionProducts.map((product) => product.productName),
    datasets: [
      {
        label: "Thời lượng",
        data: topSubscriptionProducts.map((product) => product.subscriptionDuration),
        backgroundColor: "#ff9800",
        hoverBackgroundColor: "#ffb74d",
      },
    ],
  };

  return (
      <div className="p-4">
        {notification && (
            <div className="fixed top-4 right-4 z-50 transition-opacity">
              <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
            </div>
        )}

        <div className="p-4 mx-auto ">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-semibold text-indigo-700">QL Sản Phẩm</h2>
            <div className="flex space-x-2">
              <button
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportStatisticsToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất TK
              </button>
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
                    createFormMethods.reset({
                      productName: "",
                      price: 0,
                      description: "",
                      stock: 0,
                      subscriptionDuration: 0,
                      category: "",
                      image: undefined,
                    });
                    setShowFormCreate(true);
                    setShowFormUpdate(false);
                  }}
              >
                <FaUserPlus className="mr-2" />
                Thêm
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleShowConfirmPopup}
                  disabled={selectedProducts.length === 0}
              >
                <FaTrash className="mr-2" />
                Xóa
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-4 justify-end items-center">
            <div>
              <label className="block text-gray-700">Kho {">"}</label>
              <input
                  type="number"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  value={stockFilter ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStockFilter(val ? Number(val) : null);
                  }}
                  placeholder="Nhập số"
              />
            </div>

            <div>
              <label className="block text-gray-700">Danh mục:</label>
              <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Tất cả</option>
                {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700">Thời lượng {">"}</label>
              <input
                  type="number"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  value={subscriptionDurationFilter ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSubscriptionDurationFilter(val ? Number(val) : null);
                  }}
                  placeholder="Nhập số"
              />
            </div>
          </div>
        </div>

        {showConfirmPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm transition-opacity duration-300 ease-out">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300 ease-out scale-95">
                <h3 className="mb-6 text-lg font-semibold text-gray-800 text-center">
                  Bạn có chắc chắn muốn xóa {selectedProducts.length} sản phẩm đã chọn?
                </h3>
                <div className="flex justify-center space-x-4">
                  <button
                      onClick={() => setShowConfirmPopup(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition duration-200 ease-in-out transform hover:scale-105"
                  >
                    Hủy
                  </button>
                  <button
                      onClick={handleBulkDelete}
                      className="px-6 py-2 bg-red-300 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200 ease-in-out transform hover:scale-105"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
        )}

        {showFormCreate && (
            <>
              <div className="fixed inset-0 bg-black opacity-50 z-40 backdrop-blur-sm" onClick={() => setShowFormCreate(false)}></div>
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <FormProvider {...createFormMethods}>
                  <form
                      onSubmit={createFormMethods.handleSubmit(onCreateSubmit)}
                      className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-50"
                      ref={formRef}
                  >
                    <h3 className="text-lg font-semibold mb-4">Thêm SP</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-gray-700 mb-2 font-semibold">Ảnh</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                          <input
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              {...createFormMethods.register("image")}
                              className="block w-full text-sm text-gray-900 cursor-pointer bg-gray-50 focus:outline-none"
                          />
                          <p className="text-xs text-gray-500">.jpg/.jpeg/.png, max 2MB</p>
                        </div>
                      </div>
                      <InputTextProductForm
                          name="productName"
                          label="Tên"
                          placeholder="Tên sản phẩm"
                          required
                          validation={{
                            minLength: { value: 4, message: "≥4 ký tự" },
                          }}
                      />
                      <InputTextProductForm
                          name="price"
                          label="Giá"
                          placeholder="VND"
                          type="number"
                          required
                          validation={{
                            min: { value: 0, message: "≥0" },
                          }}
                      />
                      <InputTextProductForm
                          name="description"
                          label="Mô tả"
                          placeholder="Mô tả"
                          required
                      />
                      <InputTextProductForm
                          name="stock"
                          label="Kho"
                          placeholder="Số lượng"
                          type="number"
                          required
                          validation={{
                            min: { value: 0, message: "≥0" },
                          }}
                      />
                      <InputTextProductForm
                          name="subscriptionDuration"
                          label="Thời lượng"
                          placeholder="Ngày"
                          type="number"
                          required
                          validation={{
                            min: { value: 1, message: "≥1" },
                          }}
                      />
                      <InputTextProductForm
                          name="category"
                          label="Danh mục"
                          placeholder="Chọn"
                          as="select"
                          required
                      >
                        <option value="" disabled>Chọn</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                        ))}
                      </InputTextProductForm>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <button
                          type="button"
                          onClick={() => setShowFormCreate(false)}
                          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-400 hover:text-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105"
                      >
                        Hủy
                      </button>
                      <button
                          type="submit"
                          className="px-6 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                      >
                        Tạo
                      </button>
                    </div>
                  </form>
                </FormProvider>
              </div>
            </>
        )}

        {showFormUpdate && (
            <>
              <div className="fixed inset-0 bg-black opacity-50 z-40 backdrop-blur-sm" onClick={() => setShowFormUpdate(false)}></div>
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <FormProvider {...updateFormMethods}>
                  <form
                      onSubmit={updateFormMethods.handleSubmit(onUpdateSubmit)}
                      className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-50"
                      ref={formRef}
                  >
                    <h3 className="text-lg font-semibold mb-4">Cập nhật SP</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-gray-700 mb-2 font-semibold">Ảnh (cập nhật)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                          <input
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              {...updateFormMethods.register("image")}
                              className="block w-full text-sm text-gray-900 cursor-pointer bg-gray-50 focus:outline-none"
                          />
                          <p className="text-xs text-gray-500">Để trống nếu không đổi</p>
                        </div>
                      </div>
                      <InputTextProductForm
                          name="productName"
                          label="Tên"
                          placeholder="Tên sản phẩm"
                          required
                          validation={{
                            minLength: { value: 4, message: "≥4 ký tự" },
                          }}
                      />
                      <InputTextProductForm
                          name="price"
                          label="Giá"
                          placeholder="VND"
                          type="number"
                          required
                          validation={{
                            min: { value: 0, message: "≥0" },
                          }}
                      />
                      <InputTextProductForm
                          name="description"
                          label="Mô tả"
                          placeholder="Mô tả"
                          required
                      />
                      <InputTextProductForm
                          name="stock"
                          label="Kho"
                          placeholder="Số lượng"
                          type="number"
                          required
                          validation={{
                            min: { value: 0, message: "≥0" },
                          }}
                      />
                      <InputTextProductForm
                          name="subscriptionDuration"
                          label="Thời lượng"
                          placeholder="Ngày"
                          type="number"
                          required
                          validation={{
                            min: { value: 1, message: "≥1" },
                          }}
                      />
                      <InputTextProductForm
                          name="category"
                          label="Danh mục"
                          placeholder="Chọn"
                          as="select"
                          required
                      >
                        <option value="" disabled>Chọn</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                        ))}
                      </InputTextProductForm>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <button
                          type="button"
                          onClick={() => setShowFormUpdate(false)}
                          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-400 hover:text-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105"
                      >
                        Hủy
                      </button>
                      <button
                          type="submit"
                          className="px-6 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                      >
                        Cập nhật
                      </button>
                    </div>
                  </form>
                </FormProvider>
              </div>
            </>
        )}

        {products.length > 0 && (
            <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
              <table className="min-w-full bg-white border rounded-lg shadow-sm">
                <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-4 py-2 text-center">#</th>
                  <th className="px-4 py-2 text-center">Ảnh</th>
                  <th className="px-4 py-2 text-center">Tên</th>
                  <th className="px-4 py-2 text-center">Giá</th>
                  <th className="px-4 py-2 text-center">Mô tả</th>
                  <th className="px-4 py-2 text-center">Kho</th>
                  <th className="px-4 py-2 text-center">Danh mục</th>
                  <th className="px-4 py-2 text-center">Mã SP</th>
                  <th className="px-4 py-2 text-center">Thời lượng</th>
                  <th className="px-4 py-2 text-center">Sửa</th>
                  <th className="px-4 py-2 text-center">Xóa</th>
                </tr>
                </thead>

                <tbody>
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => {
                      const tinyImageName = product.originalImageName ? product.originalImageName.replace("original_", "tiny_") : "";
                      const tinyImageUrl = tinyImageName ? `${BASE_URL}/products/${product.productCode}/tiny/${tinyImageName}` : "";

                      return (
                          <tr
                              key={product.id}
                              className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${selectedProducts.includes(product.id) ? "bg-indigo-100" : "hover:bg-gray-50"}`}
                              onClick={() => handleRowSelect(product.id)}
                          >
                            <td className="border px-4 py-2 text-center">{(currentPage * pageSize) + (index + 1)}</td>
                            <td className="border px-4 py-2 text-center">
                              {tinyImageUrl ? (
                                  <div className="flex justify-center">
                                    <Image
                                        src={tinyImageUrl}
                                        alt={product.productName}
                                        width={40}
                                        height={40}
                                        className="rounded"
                                    />
                                  </div>
                              ) : (
                                  "No Image"
                              )}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              <span className="text-indigo-600 font-medium">{product.productName}</span>
                            </td>
                            <td className="border px-4 py-2 text-center">{formatCurrencyVND(product.price)}</td>
                            <td className="border px-4 py-2 text-center">{product.description}</td>
                            <td className="border px-4 py-2 text-center">{product.stock}</td>
                            <td className="border px-4 py-2 text-center">{product.category}</td>
                            <td className="border px-4 py-2 text-center">{product.productCode}</td>
                            <td className="border px-4 py-2 text-center">{product.subscriptionDuration} ngày</td>
                            <td className="border px-4 py-2 text-center space-x-2">
                              <button
                                  className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(product);
                                  }}
                              >
                                <FaPen/>
                              </button>
                            </td>
                            <td className="border px-4 py-2 text-center space-x-2">
                              <button
                                  className="text-red-600 hover:text-red-800 transition transform hover:scale-110"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProduct(product.id);
                                  }}
                              >
                                <FaTrash/>
                              </button>
                            </td>
                          </tr>
                      );
                    })
                ) : (
                    <tr>
                      <td colSpan={11} className="text-center py-4">
                        Không có sản phẩm
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Trang {currentPage + 1} / {totalPages}, Tổng {totalElements} SP
          </p>

          <Pagination
              currentPage={currentPage + 1}
              totalPages={totalPages}
              onPageChange={(newPage) => dispatch(getProducts({page: newPage - 1, size: pageSize}))}
          />
        </div>

        <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
          <h3 className="text-lg font-semibold text-center mb-4">Tổng quan</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 text-center">
            <div>
              <p className="text-xl font-bold">{totalFilteredProducts}</p>
              <p>Tổng SP</p>
            </div>
            <div>
              <p className="text-xl font-bold">{totalValue.toLocaleString()}</p>
              <p>Tổng tiền</p>
            </div>
            <div>
              <p className="text-xl font-bold">{inStockCount}</p>
              <p>Còn hàng</p>
            </div>
            <div>
              <p className="text-xl font-bold">{outOfStockCount}</p>
              <p>Hết hàng</p>
            </div>
            <div>
              <p className="text-xl font-bold">{averageSubscriptionDuration.toFixed(2)}</p>
              <p>Thời lượng TB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 mt-8 mx-auto max-w-8xl px-4">
          <Chart
              type="pie"
              data={stockChartData}
              options={{maintainAspectRatio: false}}
              title="Hàng"
          />

          <Chart
              type="bar"
              data={categoryChartData}
              options={barChartOptions}
              title="Danh mục"
          />

          <Chart
              type="bar"
              data={topSubscriptionData}
              options={{
                ...barChartOptions,
                indexAxis: "y",
              }}
              title="Top ĐK"
          />
        </div>
      </div>
  );
};

export default FormProductAdmin;
