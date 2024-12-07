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

const FormProductAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading: productLoading, error: productError } = useAppSelector((state) => state.products);
  const { categories } = useAppSelector((state) => state.categories);

  const [showFormCreate, setShowFormCreate] = useState(false);
  const [showFormUpdate, setShowFormUpdate] = useState(false);

  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(
      null
  );

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(products.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const [stockFilter, setStockFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [subscriptionDurationFilter, setSubscriptionDurationFilter] = useState<number | null>(null);

  const createFormMethods = useForm<FormCreateProductData>({
    defaultValues: {
      productName: "",
      price: 0,
      description: "",
      stock: 0,
      subscriptionDuration: 0,
      category: "",
    },
  });

  const updateFormMethods = useForm<FormUpdateProductData>({
    defaultValues: {
      productName: "",
      price: 0,
      description: "",
      stock: 0,
      subscriptionDuration: 0,
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const onCreateSubmit = async (data: FormCreateProductData) => {
    try {
      const resultAction = await dispatch(createProduct(data));
      if (createProduct.fulfilled.match(resultAction)) {
        setNotification({ message: "Tạo sản phẩm mới thành công!", type: "success" });
        setShowFormCreate(false);
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
      const resultAction = await dispatch(updateProduct({ id: currentProductId, productData: data }));
      if (updateProduct.fulfilled.match(resultAction)) {
        setNotification({ message: "Cập nhật sản phẩm thành công!", type: "success" });
        setShowFormUpdate(false);
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
        ["Tên sản phẩm"]: product.productName,
        ["Giá (VND)"]: product.price,
        ["Mô tả"]: product.description,
        ["Tồn kho"]: product.stock,
        ["Thời lượng đăng ký (ngày)"]: product.subscriptionDuration,
        ["Danh mục"]: product.category,
        ["Mã sản phẩm"]: product.productCode,
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
        { ["Chỉ số"]: "Tổng số sản phẩm", ["Giá trị"]: totalProducts },
        { ["Chỉ số"]: "Tổng giá trị (VND)", ["Giá trị"]: totalValue.toLocaleString() },
        { ["Chỉ số"]: "Còn hàng", ["Giá trị"]: inStockCount },
        { ["Chỉ số"]: "Hết hàng", ["Giá trị"]: outOfStockCount },
        {
          ["Chỉ số"]: "Thời lượng đăng ký trung bình (ngày)",
          ["Giá trị"]: averageSubscriptionDuration.toFixed(2),
        },
      ];

      const categoryDistribution = products.reduce((acc: { [key: string]: number }, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {});

      const categoryData = Object.keys(categoryDistribution).map((category) => ({
        ["Danh mục"]: category,
        ["Số lượng sản phẩm"]: categoryDistribution[category],
      }));

      const topSubscriptionProducts = [...products]
          .sort((a, b) => b.subscriptionDuration - a.subscriptionDuration)
          .slice(0, 5);

      const topSubscriptionProductsData = topSubscriptionProducts.map((product) => ({
        ["Tên sản phẩm"]: product.productName,
        ["Thời lượng đăng ký (ngày)"]: product.subscriptionDuration,
      }));

      const workbook = XLSX.utils.book_new();

      const overviewWorksheet = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewWorksheet, "Thống kê tổng quan");

      const categoryWorksheet = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categoryWorksheet, "Phân phối danh mục");

      const topSubscriptionWorksheet = XLSX.utils.json_to_sheet(topSubscriptionProductsData);
      XLSX.utils.book_append_sheet(workbook, topSubscriptionWorksheet, "Top sản phẩm đăng ký");

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
    dispatch(getProducts());
    dispatch(getCategories());
  }, [dispatch]);

  const filteredProducts = products.filter((product) => {
    const stockCondition = stockFilter ? product.stock <= stockFilter : true;
    const categoryCondition = categoryFilter ? product.category === categoryFilter : true;
    const subscriptionCondition = subscriptionDurationFilter
        ? product.subscriptionDuration >= subscriptionDurationFilter
        : true;
    return stockCondition && categoryCondition && subscriptionCondition;
  });

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowFormCreate(false);
      }
    };
    if (showFormCreate) document.addEventListener("click", handleClickOutside);
    else document.removeEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showFormCreate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowFormUpdate(false);
      }
    };
    if (showFormUpdate) document.addEventListener("click", handleClickOutside);
    else document.removeEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showFormUpdate]);

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const inStockCount = products.filter((product) => product.stock > 0).length;
  const outOfStockCount = totalProducts - inStockCount;
  const averageSubscriptionDuration =
      products.length > 0
          ? products.reduce((sum, product) => sum + product.subscriptionDuration, 0) / totalProducts
          : 0;

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

  const categoryDistribution = products.reduce((acc: { [key: string]: number }, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = {
    labels: Object.keys(categoryDistribution),
    datasets: [
      {
        label: "Số lượng sản phẩm",
        data: Object.values(categoryDistribution),
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
      },
    ],
  };

  const topSubscriptionProducts = [...products]
      .sort((a, b) => b.subscriptionDuration - a.subscriptionDuration)
      .slice(0, 5);

  const topSubscriptionData = {
    labels: topSubscriptionProducts.map((product) => product.productName),
    datasets: [
      {
        label: "Thời lượng đăng ký (ngày)",
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
            <h2 className="text-2xl font-semibold text-indigo-700">Quản lý Sản Phẩm</h2>
            <div className="flex space-x-2">
              <button
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportStatisticsToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất dữ liệu thống kê sang excel
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất sang excel
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
                    });
                    setShowFormCreate(true);
                    setShowFormUpdate(false);
                  }}
              >
                <FaUserPlus className="mr-2" />
                Thêm sản phẩm mới
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleShowConfirmPopup}
                  disabled={selectedProducts.length === 0}
              >
                <FaTrash className="mr-2" />
                Xóa sản phẩm
              </button>
            </div>
          </div>

          <div className="flex space-x-4 mb-4 justify-end items-center">
            <div>
              <label className="block text-gray-700">Lọc theo tồn kho:</label>
              <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  value={stockFilter || ""}
                  onChange={(e) => setStockFilter(e.target.value ? +e.target.value : null)}
              >
                <option value="">Lọc theo tồn kho</option>
                <option value="10">Tồn kho {"<"}= 10</option>
                <option value="50">Tồn kho {"<"}= 50</option>
                <option value="100">Tồn kho {"<"}= 100</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700">Lọc theo danh mục:</label>
              <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  value={categoryFilter || ""}
                  onChange={(e) => setCategoryFilter(e.target.value || null)}
              >
                <option value="">Lọc theo danh mục</option>
                {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700">Lọc theo thời lượng đăng ký:</label>
              <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  value={subscriptionDurationFilter || ""}
                  onChange={(e) => setSubscriptionDurationFilter(e.target.value ? +e.target.value : null)}
              >
                <option value="">Lọc theo thời lượng</option>
                <option value="30">Thời lượng {">"}= 30 ngày</option>
                <option value="60">Thời lượng {">"}= 60 ngày</option>
                <option value="90">Thời lượng {">"}= 90 ngày</option>
              </select>
            </div>
          </div>
        </div>

        {showConfirmPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm transition-opacity duration-300 ease-out">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300 ease-out scale-95">
                <h3 className="mb-6 text-lg font-semibold text-gray-800 text-center">
                  Bạn có chắc chắn muốn xóa {selectedProducts.length} sản phẩm đã chọn không?
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
                    <h3 className="text-lg font-semibold mb-4">Thêm Sản Phẩm Mới</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InputTextProductForm
                          name="productName"
                          label="Tên sản phẩm"
                          placeholder="Tên sản phẩm"
                          required
                          validation={{
                            minLength: { value: 4, message: "Tên sản phẩm phải có ít nhất 4 ký tự" },
                          }}
                      />
                      <InputTextProductForm
                          name="price"
                          label="Giá sản phẩm (VND)"
                          placeholder="Nhập giá sản phẩm"
                          type="number"
                          required
                          validation={{
                            min: { value: 0, message: "Giá phải lớn hơn hoặc bằng 0" },
                          }}
                      />
                      <InputTextProductForm
                          name="description"
                          label="Mô tả"
                          placeholder="Nhập mô tả sản phẩm"
                          required
                      />
                      <InputTextProductForm
                          name="stock"
                          label="Tồn kho"
                          placeholder="Nhập số lượng tồn kho"
                          type="number"
                          required
                          validation={{
                            min: { value: 0, message: "Tồn kho phải lớn hơn hoặc bằng 0" },
                          }}
                      />
                      <InputTextProductForm
                          name="subscriptionDuration"
                          label="Số ngày đăng ký"
                          placeholder="Nhập số ngày đăng ký"
                          type="number"
                          required
                          validation={{
                            min: { value: 1, message: "Thời lượng đăng ký phải lớn hơn hoặc bằng 1" },
                          }}
                      />
                      <InputTextProductForm
                          name="category"
                          label="Danh mục"
                          placeholder="Chọn danh mục"
                          as="select"
                          required
                      >
                        <option value="" disabled>
                          Chọn danh mục
                        </option>
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
                        Tạo mới
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
                    <h3 className="text-lg font-semibold mb-4">Cập Nhật Sản Phẩm</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InputTextProductForm
                          name="productName"
                          label="Tên sản phẩm"
                          placeholder="Nhập tên sản phẩm"
                          required
                          validation={{
                            minLength: { value: 4, message: "Tên sản phẩm phải có ít nhất 4 ký tự" },
                          }}
                      />
                      <InputTextProductForm
                          name="price"
                          label="Giá sản phẩm (VND)"
                          placeholder="Nhập giá sản phẩm"
                          type="number"
                          required
                          validation={{
                            min: { value: 0, message: "Giá phải lớn hơn hoặc bằng 0" },
                          }}
                      />
                      <InputTextProductForm
                          name="description"
                          label="Mô tả"
                          placeholder="Nhập mô tả sản phẩm"
                          required
                      />
                      <InputTextProductForm
                          name="stock"
                          label="Tồn kho"
                          placeholder="Nhập số lượng tồn kho"
                          type="number"
                          required
                          validation={{
                            min: { value: 0, message: "Tồn kho phải lớn hơn hoặc bằng 0" },
                          }}
                      />
                      <InputTextProductForm
                          name="subscriptionDuration"
                          label="Số ngày đăng ký"
                          placeholder="Nhập số ngày đăng ký"
                          type="number"
                          required
                          validation={{
                            min: { value: 1, message: "Thời lượng đăng ký phải lớn hơn hoặc bằng 1" },
                          }}
                      />
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
                  <th className="px-4 py-2 text-center">STT</th>
                  <th className="px-4 py-2 text-center">Tên Sản Phẩm</th>
                  <th className="px-4 py-2 text-center">Giá (VND)</th>
                  <th className="px-4 py-2 text-center">Mô Tả</th>
                  <th className="px-4 py-2 text-center">Tồn Kho</th>
                  <th className="px-4 py-2 text-center">Danh Mục</th>
                  <th className="px-4 py-2 text-center">Mã Sản Phẩm</th>
                  <th className="px-4 py-2 text-center">Thời Lượng Đăng Ký (ngày)</th>
                  <th className="px-4 py-2 text-center">Chỉnh Sửa</th>
                  <th className="px-4 py-2 text-center">Xóa</th>
                </tr>
                </thead>

                <tbody>
                {filteredProducts.length > 0 ? (
                    paginatedProducts.map((product, index) => (
                        <tr
                            key={product.id}
                            className={`hover:bg-gray-50 transition ease-in-out 
                        duration-200 cursor-pointer ${
                                selectedProducts.includes(product.id) ? "bg-indigo-100" : "hover:bg-gray-50"
                            }`}
                            onClick={() => handleRowSelect(product.id)}
                        >
                          <td className="border px-4 py-2 text-center">{(currentPage - 1) * rowsPerPage + index + 1}</td>
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
                              <FaPen />
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
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-4">
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
            Đang hiển thị từ {Math.min((currentPage - 1) * rowsPerPage + 1, products.length)} đến{" "}
            {Math.min(currentPage * rowsPerPage, products.length)} trong tổng số {products.length} mục
          </p>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>

        <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
          <h3 className="text-lg font-semibold text-center mb-4">Thống kê tổng quan</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 text-center">
            <div>
              <p className="text-xl font-bold">{totalProducts}</p>
              <p>Tổng sản phẩm</p>
            </div>
            <div>
              <p className="text-xl font-bold">{totalValue.toLocaleString()}</p>
              <p>Tổng tiền (VND)</p>
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
              <p>Thời lượng đăng ký trung bình (ngày)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 mt-8 mx-auto max-w-8xl px-4">
          <Chart
              type="pie"
              data={stockChartData}
              options={{ maintainAspectRatio: false }}
              title="Tình trạng hàng (Còn hàng và hết hàng)"
          />
          <Chart
              type="bar"
              data={categoryChartData}
              options={barChartOptions}
              title="Phân phối sản phẩm theo danh mục"
          />
          <Chart
              type="bar"
              data={topSubscriptionData}
              options={{
                ...barChartOptions,
                indexAxis: "y",
              }}
              title="5 sản phẩm hàng đầu theo thời lượng đăng ký"
          />
        </div>
      </div>
  );
};

export default FormProductAdmin;
