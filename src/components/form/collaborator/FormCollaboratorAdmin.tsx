"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createCollaborator,
  deleteCollaborator,
  deleteCollaborators,
  getCollaborators,
  updateCollaboratorCommissionRate,
} from "@/store/collaborator/collaboratorSlice";
import Notification from "@/components/notification/Notification";
import { FaPen, FaFileExcel, FaTrash, FaUserPlus } from "react-icons/fa";
import { Collaborator } from "@/types/collaborator/collaborator";
import * as XLSX from "xlsx";
import Pagination from "@/components/pagination/Pagination";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import Chart from "@/components/chart/Chart";
import { barChartOptions } from "@/types/component/chart/chart";
import FormOrder from "@/components/form/order/FormOrder";
import { formatCurrencyVND, formatPhoneNumber } from "@/utils/utils/utils";
import { FormProvider, useForm } from "react-hook-form";
import { FormCollaboratorData } from "@/types/component/form/form";
import InputTextForm from "@/components/input/InputTextForm";
import {extractError} from "@/utils/utils/helper";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
);

const FormCollaboratorAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { collaborators, loading, error } = useAppSelector(
      (state) => state.collaborators
  );
  const [showForm, setShowForm] = useState(false);
  const [showFormCommission, setShowFormCommission] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [currentCollaboratorId, setCurrentCollaboratorId] = useState<
      string | null
  >(null);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(
      []
  );
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<
      string | null
  >(null);

  const [commissionRateFilter, setCommissionRateFilter] = useState<
      number | null
  >(null);
  const [totalOrdersFilter, setTotalOrdersFilter] = useState<number | null>(
      null
  );
  const [commissionEarnedFilter, setCommissionEarnedFilter] = useState<
      number | null
  >(null);
  const [surveyHandledFilter, setSurveyHandledFilter] = useState<number | null>(
      null
  );

  const methods = useForm<FormCollaboratorData>({
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      birthDate: null,
      commissionRate: 0,
    },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = methods;

  const formRef = useRef<HTMLFormElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5; // Số dòng hiển thị trên mỗi trang
  const totalPages = Math.ceil(collaborators.length / rowsPerPage);

  const paginatedCollaborators = collaborators
      .filter((collaborator) => {
        if (
            commissionRateFilter !== null &&
            collaborator.commissionRate <= commissionRateFilter
        )
          return false;
        if (
            totalOrdersFilter !== null &&
            (collaborator.totalOrdersHandled ?? 0) < totalOrdersFilter
        )
          return false;
        if (
            commissionEarnedFilter !== null &&
            (collaborator.totalCommissionEarned ?? 0) < commissionEarnedFilter
        )
          return false;
        return !(
            surveyHandledFilter !== null &&
            (collaborator.totalSurveyHandled ?? 0) < surveyHandledFilter
        );
      })
      .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle Delete Collaborator
  const handleDeleteCollaborator = async (userId: string) => {
    try {
      const resultAction = await dispatch(deleteCollaborator(userId));
      if (deleteCollaborator.fulfilled.match(resultAction)) {
        setNotification({
          message: "Xóa cộng tác viên thành công!",
          type: "success",
        });
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xóa cộng tác viên thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  // Handle Delete Collaborators
  const handleDeleteCollaborators = async (userIds: string[]) => {
    try {
      const resultAction = await dispatch(deleteCollaborators(userIds));
      if (deleteCollaborators.fulfilled.match(resultAction)) {
        setNotification({
          message: "Xóa các cộng tác viên thành công!",
          type: "success",
        });
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xóa các cộng tác viên thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  // Handle Submit
  const onSubmit = async (data: FormCollaboratorData) => {
    try {
      if (isEditing && currentCollaboratorId) {
        // Cập nhật tỉ lệ hoa hồng cho cộng tác viên
        const resultAction = await dispatch(
            updateCollaboratorCommissionRate({
              id: currentCollaboratorId,
              commissionRate: data.commissionRate,
            })
        );
        if (updateCollaboratorCommissionRate.fulfilled.match(resultAction)) {
          setNotification({
            message: "Cập nhật tỉ lệ hoa hồng thành công!",
            type: "success",
          });
          setShowFormCommission(false);
        }
      } else {
        // Tạo mới cộng tác viên
        const resultAction = await dispatch(
            createCollaborator({
              user: {
                username: data.username,
                email: data.email,
                password: data.password,
                lastName: data.lastName,
                firstName: data.firstName,
                phoneNumber: data.phoneNumber,
                birthDate: data.birthDate,
              },
              commissionRate: data.commissionRate,
            })
        );
        if (createCollaborator.fulfilled.match(resultAction)) {
          setNotification({
            message: "Tạo cộng tác viên mới thành công!",
            type: "success",
          });
          setShowForm(false);
        }
      }
      reset();
      setIsEditing(false);
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: isEditing
            ? `Cập nhật cộng tác viên thất bại: ${err.code}: ${err.message}`
            : `Tạo cộng tác viên thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  // Handle Show Confirm Popup
  const handleShowConfirmPopup = () => {
    setShowConfirmPopup(true);
  };

  // Handle Bulk Delete
  const handleBulkDelete = () => {
    handleDeleteCollaborators(selectedCollaborators);
    setSelectedCollaborators([]);
    setShowConfirmPopup(false);
  };

  // Handle Row Select
  const handleRowSelect = (collaboratorUserId: string) => {
    setSelectedCollaborators((prevCollaborators) => {
      if (prevCollaborators.includes(collaboratorUserId)) {
        return prevCollaborators.filter((id) => id !== collaboratorUserId);
      }
      return [...prevCollaborators, collaboratorUserId];
    });
    setSelectedCollaboratorId(collaboratorUserId);
  };

  const handleRowSelectCollaborator = (collaboratorId: string) => {
    setSelectedCollaboratorId(collaboratorId);
  };

  // Handle Click Edit Commission Collaborator
  const handleEditClick = (collaborator: Collaborator) => {
    setIsEditing(true);
    setCurrentCollaboratorId(collaborator.id);
    setValue("commissionRate", collaborator.commissionRate);
    setShowFormCommission(true);
    setShowForm(false);
  };

  // Handle Export to Excel
  const handleExportToExcel = () => {
    try {
      const excelData = collaborators.map((collaborator, index) => ({
        "STT": index + 1,
        "ID": collaborator.id,
        ["Tên đăng nhập"]: collaborator.user.username,
        ["Email"]: collaborator.user.email,
        ["Họ"]: collaborator.user.lastName,
        ["Tên"]: collaborator.user.firstName,
        ["Số điện thoại"]: collaborator.user.phoneNumber,
        ["Ngày sinh"]: collaborator.user.birthDate
            ? new Date(collaborator.user.birthDate).toLocaleDateString()
            : "N/A",
        ["Tỉ lệ hoa hồng"]: collaborator.commissionRate,
        ["Mã giới thiệu"]: collaborator.referralCode,
        ["Tổng đơn hàng đã xử lý"]: collaborator.totalOrdersHandled,
        ["Tổng khảo sát đã xử lý"]: collaborator.totalSurveyHandled,
        ["Tổng hoa hồng đã nhận"]: collaborator.totalCommissionEarned,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Cộng tác viên");

      XLSX.writeFile(workbook, "CongTacVien.xlsx");

      setNotification({
        message: "Xuất dữ liệu thành công!",
        type: "success",
      });
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xuất dữ liệu thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleExportStatisticsToExcel = () => {
    try {
      // Chuẩn bị dữ liệu thống kê
      const statisticsData = collaborators.map((collaborator, index) => ({
        "STT": index + 1,
        ["Tên đăng nhập"]: collaborator.user.username,
        ["Tổng chi tiêu (VND)"]: collaborator.user.totalSpent,
        ["Tỉ lệ hoa hồng"]: collaborator.commissionRate,
        ["Tổng đơn đã xử lý"]: collaborator.totalOrdersHandled,
        ["Tổng câu hỏi đã giải quyết"]: collaborator.totalSurveyHandled,
        ["Tổng hoa hồng đã nhận (VND)"]: collaborator.totalCommissionEarned,
      }));

      // Tạo file Excel
      const worksheet = XLSX.utils.json_to_sheet(statisticsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Thống kê");

      // Xuất file
      XLSX.writeFile(workbook, "ThongKe_CongTacVien.xlsx");

      // Hiển thị thông báo
      setNotification({
        message: "Xuất dữ liệu thống kê thành công!",
        type: "success",
      });
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xuất dữ liệu thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  // Get Collaborators
  useEffect(() => {
    dispatch(getCollaborators());
  }, [dispatch]);

  // Handle event when click outside of Form
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
          formRef.current &&
          !formRef.current.contains(e.target as Node) &&
          (showForm || showFormCommission)
      ) {
        setShowForm(false);
        setShowFormCommission(false);
        reset();
        setIsEditing(false);
      }
    };

    if (showForm || showFormCommission) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showForm, showFormCommission, reset]);

  // Handle Error Notifications
  useEffect(() => {
    if (error) {
      setNotification({
        message: `Lỗi ${error.code}: ${error.message}`,
        type: "error",
      });
    }
  }, [error]);

  // Aggregate data
  const totalSpent = collaborators.reduce(
      (sum, col) => sum + (col.user.totalSpent || 0),
      0
  );
  const totalOrders = collaborators.reduce(
      (sum, col) => sum + (col.totalOrdersHandled || 0),
      0
  );
  const totalSurveys = collaborators.reduce(
      (sum, col) => sum + (col.totalSurveyHandled || 0),
      0
  );
  const totalCommission = collaborators.reduce(
      (sum, col) => sum + (col.totalCommissionEarned || 0),
      0
  );

  // Data for charts
  const roleDistribution = collaborators.reduce(
      (acc: { [key: string]: number }, collaborator) => {
        const role = collaborator.user.role;
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {}
  );

  const totalSpentDistribution = collaborators.map(
      (collaborator) => collaborator.user.totalSpent || 0
  );

  const commissionRateDistribution = collaborators.map(
      (collaborator) => collaborator.commissionRate || 0
  );

  const ordersHandledChartData = {
    labels: collaborators.map((collaborator) => collaborator.user.username),
    datasets: [
      {
        label: "Tổng đơn đã xử lý",
        data: collaborators.map(
            (collaborator) => collaborator.totalOrdersHandled || 0
        ),
        backgroundColor: "#4caf50",
        hoverBackgroundColor: "#66bb6a",
      },
    ],
  };

  const surveyHandledChartData = {
    labels: collaborators.map((collaborator) => collaborator.user.username),
    datasets: [
      {
        label: "Tổng câu hỏi đã giải quyết",
        data: collaborators.map(
            (collaborator) => collaborator.totalSurveyHandled || 0
        ),
        backgroundColor: "#f44336",
        hoverBackgroundColor: "#e57373",
      },
    ],
  };

  const commissionEarnedChartData = {
    labels: collaborators.map((collaborator) => collaborator.user.username),
    datasets: [
      {
        label: "Tổng hoa hồng đã nhận (VND)",
        data: collaborators.map(
            (collaborator) => collaborator.totalCommissionEarned || 0
        ),
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
      },
    ],
  };

  const roleChartData = {
    labels: Object.keys(roleDistribution),
    datasets: [
      {
        data: Object.values(roleDistribution),
        backgroundColor: ["#4caf50", "#f44336", "#2196f3", "#ff9800"],
        hoverBackgroundColor: ["#66bb6a", "#e57373", "#64b5f6", "#ffb74d"],
      },
    ],
  };

  const totalSpentChartData = {
    labels: collaborators.map((collaborator) => collaborator.user.username),
    datasets: [
      {
        label: "Tổng chi tiêu (VND)",
        data: totalSpentDistribution,
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
      },
    ],
  };

  const commissionRateChartDataPie = {
    labels: collaborators.map((collaborator) => collaborator.user.username),
    datasets: [
      {
        label: "Tỉ lệ hoa hồng",
        data: Object.values(commissionRateDistribution),
        backgroundColor: ["#4caf50", "#f44336", "#2196f3", "#ff9800"],
        hoverBackgroundColor: ["#66bb6a", "#e57373", "#64b5f6", "#ffb74d"],
      },
    ],
  };

  if (loading) return <p>Đang tải cộng tác viên...</p>;

  return (
      <div className="p-4">
        {/* Notification */}
        {notification && (
            <div className="fixed top-4 right-4 z-50 transition-opacity">
              <Notification
                  message={notification.message}
                  type={notification.type}
                  onClose={() => setNotification(null)}
              />
            </div>
        )}

        <div className="p-4 mx-auto ">
          {/* Header */}
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-semibold text-indigo-700">
              Quản lý Cộng Tác Viên
            </h2>
            <div className="flex space-x-2">
              <button
                  className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportStatisticsToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất Thống Kê ra Excel
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất ra Excel
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={() => {
                    setIsEditing(false);
                    reset();
                    setShowForm(true);
                    setShowFormCommission(false);
                  }}
              >
                <FaUserPlus className="mr-2" />
                Thêm Cộng Tác Viên Mới
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleShowConfirmPopup}
                  disabled={selectedCollaborators.length === 0}
              >
                <FaTrash className="mr-2" />
                Xóa Nhiều Cộng Tác Viên
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-4 justify-end items-center">
            <div>
              <label className="block text-gray-700">
                Lọc theo tỉ lệ hoa hồng:
              </label>
              <select
                  value={commissionRateFilter || ""}
                  onChange={(e) =>
                      setCommissionRateFilter(
                          e.target.value ? Number(e.target.value) : null
                      )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
              >
                <option value="">Lọc theo tỉ lệ hoa hồng</option>
                <option value="0.1">{">"}= 0.1</option>
                <option value="0.2">{">"}= 0.2</option>
                <option value="0.3">{">"}= 0.3</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700">
                Lọc theo tổng đơn đã xử lý:
              </label>
              <select
                  value={totalOrdersFilter || ""}
                  onChange={(e) =>
                      setTotalOrdersFilter(
                          e.target.value ? Number(e.target.value) : null
                      )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
              >
                <option value="">Lọc theo tổng đơn hàng</option>
                <option value="10">{">"}= 10 đơn</option>
                <option value="20">{">"}= 20 đơn</option>
                <option value="50">{">"}= 50 đơn</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700">
                Lọc theo tổng hoa hồng đã nhận:
              </label>
              <select
                  value={commissionEarnedFilter || ""}
                  onChange={(e) =>
                      setCommissionEarnedFilter(
                          e.target.value ? Number(e.target.value) : null
                      )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
              >
                <option value="">Lọc theo hoa hồng đã nhận</option>
                <option value="100000">{">"}= 100.000đ</option>
                <option value="200000">{">"}= 200.000đ</option>
                <option value="500000">{">"}= 500.000đ</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700">
                Lọc theo tổng câu hỏi đã giải quyết:
              </label>
              <select
                  value={surveyHandledFilter || ""}
                  onChange={(e) =>
                      setSurveyHandledFilter(
                          e.target.value ? Number(e.target.value) : null
                      )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
              >
                <option value="">Lọc theo tổng câu hỏi</option>
                <option value="5">{">"}= 5 câu hỏi</option>
                <option value="10">{">"}= 10 câu hỏi</option>
                <option value="50">{">"}= 50 câu hỏi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Confirm Popup */}
        {showConfirmPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm transition-opacity duration-300 ease-out">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300 ease-out scale-95">
                <h3 className="mb-6 text-lg font-semibold text-gray-800 text-center">
                  Bạn có chắc chắn muốn xóa {selectedCollaborators.length} cộng tác
                  viên đã chọn không?
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
                    Xác Nhận
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Form Add & Update Collaborator */}
        {showForm && (
            <>
              <div
                  className="fixed inset-0 bg-black opacity-50 z-40 backdrop-blur-sm"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                    setIsEditing(false);
                  }}
              ></div>
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <FormProvider {...methods}>
                  <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-50"
                      ref={formRef}
                  >
                    <h3 className="text-lg font-semibold mb-4">
                      {isEditing
                          ? "Cập nhật cộng tác viên"
                          : "Thêm Cộng Tác Viên Mới"}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Tên đăng nhập */}
                      <InputTextForm
                          name="username"
                          label="Tên đăng nhập"
                          placeholder="Tên đăng nhập"
                          required={!isEditing}
                          validation={{
                            minLength: {
                              value: 4,
                              message: "Tên đăng nhập phải có ít nhất 4 ký tự",
                            },
                          }}
                          disabled={isEditing}
                      />

                      {/* Mật khẩu */}
                      {!isEditing && (
                          <InputTextForm
                              name="password"
                              label="Mật khẩu"
                              placeholder="Mật khẩu"
                              type="password"
                              required={!isEditing}
                              validation={{
                                minLength: {
                                  value: 8,
                                  message: "Mật khẩu phải có ít nhất 8 ký tự",
                                },
                              }}
                              isPassword
                          />
                      )}

                      {/* Email */}
                      <InputTextForm
                          name="email"
                          label="Email"
                          placeholder="Email"
                          type="email"
                          required
                          validation={{
                            pattern: {
                              value:
                                  /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                              message: "Email không hợp lệ",
                            },
                          }}
                      />

                      {/* Tên */}
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

                      {/* Họ */}
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

                      {/* Số điện thoại */}
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

                      {/* Ngày sinh */}
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
                                  value <= today ||
                                  "Ngày sinh không được vượt quá ngày hôm nay"
                              );
                            },
                          }}
                      />

                      {/* Tỉ lệ hoa hồng */}
                      {!isEditing && (
                          <InputTextForm
                              name="commissionRate"
                              label="Tỉ lệ hoa hồng"
                              placeholder="Tỉ lệ hoa hồng"
                              type="number"
                              required={!isEditing}
                              validation={{
                                min: {
                                  value: 0,
                                  message: "Tỉ lệ hoa hồng phải lớn hơn hoặc bằng 0",
                                },
                                max: {
                                  value: 1,
                                  message: "Tỉ lệ hoa hồng phải nhỏ hơn hoặc bằng 1",
                                },
                              }}
                          />
                      )}
                    </div>

                    <div className="flex justify-end mt-4 space-x-2">
                      <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            reset();
                            setIsEditing(false);
                          }}
                          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-400 hover:text-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105"
                      >
                        Hủy
                      </button>
                      <button
                          type="submit"
                          className="px-6 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                      >
                        {isEditing ? "Cập nhật" : "Tạo mới"}
                      </button>
                    </div>
                  </form>
                </FormProvider>
              </div>
            </>
        )}

        {/* Form Update Commission Collaborator */}
        {showFormCommission && (
            <>
              <div
                  className="fixed inset-0 bg-black opacity-50 z-40 backdrop-blur-sm"
                  onClick={() => {
                    setShowFormCommission(false);
                    reset();
                    setIsEditing(false);
                  }}
              ></div>
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <FormProvider {...methods}>
                  <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-50"
                      ref={formRef}
                  >
                    <h3 className="text-lg font-semibold mb-4">
                      Chỉnh sửa tỉ lệ hoa hồng
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Tỉ lệ hoa hồng */}
                      <InputTextForm
                          name="commissionRate"
                          label="Tỉ lệ hoa hồng"
                          placeholder="Tỉ lệ hoa hồng"
                          type="number"
                          required
                          validation={{
                            min: {
                              value: 0,
                              message: "Tỉ lệ hoa hồng phải lớn hơn hoặc bằng 0",
                            },
                            max: {
                              value: 1,
                              message: "Tỉ lệ hoa hồng phải nhỏ hơn hoặc bằng 1",
                            },
                          }}
                      />
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <button
                          type="button"
                          onClick={() => {
                            setShowFormCommission(false);
                            reset();
                            setIsEditing(false);
                          }}
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

        {/* Table Collaborators */}
        <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
          <table className="min-w-full bg-white border rounded-lg shadow-sm">
            <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="px-4 py-2 text-center">STT</th>
              <th className="px-4 py-2 text-center">Tên đăng nhập</th>
              <th className="px-4 py-2 text-center">Email</th>
              <th className="px-4 py-2 text-center">Vai trò</th>
              <th className="px-4 py-2 text-center">Tên</th>
              <th className="px-4 py-2 text-center">Họ</th>
              <th className="px-4 py-2 text-center">Số điện thoại</th>
              <th className="px-4 py-2 text-center">Ngày tham gia</th>
              <th className="px-4 py-2 text-center">Tổng chi tiêu (VND)</th>
              <th className="px-4 py-2 text-center">Ngày sinh</th>
              <th className="px-4 py-2 text-center">Mã giới thiệu</th>
              <th className="px-4 py-2 text-center">Tỉ lệ hoa hồng</th>
              <th className="px-4 py-2 text-center">Tổng đơn đã xử lý</th>
              <th className="px-4 py-2 text-center">
                Tổng câu hỏi đã giải quyết
              </th>
              <th className="px-4 py-2 text-center">Tổng hoa hồng đã nhận (VND)</th>
              <th className="px-4 py-2 text-center">Chỉnh sửa</th>
              <th className="px-4 py-2 text-center">Xóa</th>
            </tr>
            </thead>
            <tbody>
            {paginatedCollaborators.length > 0 ? (
                paginatedCollaborators.map((collaborator, index) => (
                    <tr
                        key={collaborator.id}
                        className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                            selectedCollaborators.includes(collaborator.user.id)
                                ? "bg-indigo-100"
                                : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          handleRowSelect(collaborator.user.id);
                          handleRowSelectCollaborator(collaborator.id);
                        }}
                    >
                      <td className="border px-4 py-2 text-center">
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="border px-4 py-2 text-center">
                    <span className="text-indigo-600 font-medium">
                      {collaborator.user.username}
                    </span>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {collaborator.user.email}
                      </td>
                      <td className="border px-4 py-2 text-center">
                    <span
                        className={`px-2 py-1 rounded-full text-white text-sm ${
                            collaborator.user.role === "Admin"
                                ? "bg-green-500"
                                : collaborator.user.role === "Collaborator"
                                    ? "bg-red-500"
                                    : "bg-indigo-500"
                        }`}
                    >
                      {collaborator.user.role}
                    </span>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {collaborator.user.firstName}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {collaborator.user.lastName}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {formatPhoneNumber(collaborator.user.phoneNumber)}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {new Date(
                            collaborator.user.dateJoined
                        ).toLocaleDateString()}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {formatCurrencyVND(collaborator.user.totalSpent)}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {collaborator.user.birthDate
                            ? new Date(
                                collaborator.user.birthDate
                            ).toLocaleDateString()
                            : "N/A"}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {collaborator.referralCode}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {collaborator.commissionRate}
                        <button
                            className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110 p-2 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(collaborator);
                            }}
                        >
                          <FaPen />
                        </button>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {collaborator.totalOrdersHandled}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {collaborator.totalSurveyHandled}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {formatCurrencyVND(collaborator.totalCommissionEarned)}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <button
                            className="text-red-600 hover:text-red-800 transition transform hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollaborator(collaborator.user.id);
                            }}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                ))
            ) : (
                <tr>
                  <td colSpan={17} className="text-center py-4">
                    Không có cộng tác viên
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>

        {/* FormOrder Component */}
        {selectedCollaboratorId && (
            <div className="mt-4">
              <FormOrder collaboratorId={selectedCollaboratorId} />
            </div>
        )}

        {/* Pagination with Showing Entries */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Đang hiển thị từ{" "}
            {Math.min((currentPage - 1) * rowsPerPage + 1, collaborators.length)}{" "}
            đến{" "}
            {Math.min(currentPage * rowsPerPage, collaborators.length)} trong tổng
            cộng {collaborators.length} mục
          </div>

          <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
          />
        </div>

        {/* Thống kê tổng hợp */}
        <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
          <h3 className="text-lg font-semibold text-center mb-4">
            Thống kê tổng hợp
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-4">
            <div>
              <p className="text-xl font-bold">
                {formatCurrencyVND(totalSpent)}
              </p>
              <p>Tổng chi tiêu (VND)</p>
            </div>
            <div>
              <p className="text-xl font-bold">{totalOrders}</p>
              <p>Tổng đơn đã xử lý</p>
            </div>
            <div>
              <p className="text-xl font-bold">{totalSurveys}</p>
              <p>Tổng câu hỏi đã giải quyết</p>
            </div>
            <div>
              <p className="text-xl font-bold">
                {formatCurrencyVND(totalCommission)}
              </p>
              <p>Tổng hoa hồng (VND)</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 mx-auto max-w-8xl px-4">
          <Chart
              type="pie"
              data={roleChartData}
              options={{ maintainAspectRatio: true }}
              title="Phân phối vai trò"
          />
          <Chart
              type="bar"
              data={totalSpentChartData}
              options={barChartOptions}
              title="Phân phối tổng chi tiêu (VND)"
          />
          <Chart
              type="bar"
              data={commissionRateChartDataPie}
              options={barChartOptions}
              title="Phân phối tỉ lệ hoa hồng"
          />
          <Chart
              type="bar"
              data={ordersHandledChartData}
              options={barChartOptions}
              title="Tổng đơn đã xử lý"
          />
          <Chart
              type="bar"
              data={surveyHandledChartData}
              options={barChartOptions}
              title="Tổng câu hỏi đã giải quyết"
          />
          <Chart
              type="bar"
              data={commissionEarnedChartData}
              options={barChartOptions}
              title="Tổng hoa hồng đã nhận (VND)"
          />
        </div>
      </div>
  );
};

export default FormCollaboratorAdmin;
