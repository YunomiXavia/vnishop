"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useRef, useState } from "react";
import {
  completeSurvey,
  getSurveys,
  handleSurvey,
  handleSurveys,
  responseSurvey,
} from "@/store/survey/surveySlice";
import Notification from "@/components/notification/Notification";
import {
  FaCheck,
  FaChevronCircleLeft,
  FaFileExcel,
  FaQuestion,
  FaReply,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { getMyInfo } from "@/store/user/userSlice";
import { getCollaboratorByUserId } from "@/store/collaborator/collaboratorSlice";
import Pagination from "@/components/pagination/Pagination";
import Chart from "@/components/chart/Chart";
import { barChartOptions } from "@/types/component/chart/chart";
import { ErrorResponseProps } from "@/types/error/error";
import {extractError} from "@/utils/utils/helper";

const FormSurveyCollaborator = () => {
  const dispatch = useAppDispatch();
  const { surveys, loading, error } = useAppSelector((state) => state.surveys);

  const [showForm, setShowForm] = useState(false);
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [filters, setFilters] = useState({
    username: "",
    collaboratorUsername: "",
    status: "",
    totalRevenue: "",
    createAt: "",
    responseAt: "",
  });

  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredSurveys = surveys.filter((survey) => {
    const matchesUsername =
        filters.username === "" || survey.user.username === filters.username;

    const matchesCollaborator =
        filters.collaboratorUsername === "" ||
        survey.collaborator?.username === filters.collaboratorUsername;

    const matchesStatus =
        filters.status === "" || survey.status.statusName === filters.status;

    const matchesCreateAt =
        filters.createAt === "" ||
        new Date(survey.createdAt).toLocaleDateString() === filters.createAt;

    const matchesResponseAt =
        filters.responseAt === "" ||
        (survey.responseAt &&
            new Date(survey.responseAt).toLocaleDateString() === filters.responseAt);

    return (
        matchesUsername &&
        matchesCollaborator &&
        matchesStatus &&
        matchesCreateAt &&
        matchesResponseAt
    );
  });

  const rowsPerPage = 5;
  const totalPages = Math.ceil(filteredSurveys.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const paginatedSurveys = filteredSurveys.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
  );

  const [formData, setFormData] = useState({
    response: "",
  });

  const formRef = useRef<HTMLFormElement>(null);

  const fetchCollaboratorId = async () => {
    try {
      return await dispatch(getCollaboratorByUserId()).unwrap();
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Lấy ID cộng tác viên thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Chọn dòng
  const handleRowSelect = (surveyId: string) => {
    setSelectedSurveys((prevSurveys) =>
        prevSurveys.includes(surveyId)
            ? prevSurveys.filter((id) => id !== surveyId)
            : [...prevSurveys, surveyId]
    );
  };

  // Xuất ra Excel
  const handleExportToExcel = () => {
    try {
      const excelData = surveys.map((survey, index) => ({
        STT: index + 1,
        ["ID Câu hỏi"]: survey.id,
        ["ID Người mua"]: survey.user.id,
        ["Tên người mua"]: survey.user.username,
        ["ID Cộng tác viên"]: survey.collaborator?.id || "N/A",
        ["Tên cộng tác viên"]: survey.collaborator?.username || "N/A",
        ["Tổng số câu hỏi đã xử lý"]: survey.collaborator?.totalSurveyHandled || 0,
        ["ID Trạng thái"]: survey.status.id,
        ["Trạng thái"]: survey.status.statusName,
        ["Câu hỏi"]: survey.question,
        ["Phản hồi"]: survey.response,
        ["Tạo lúc"]: survey.createdAt,
        ["Phản hồi lúc"]: survey.responseAt,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Câu hỏi");

      XLSX.writeFile(workbook, "CauHoi.xlsx");

      setNotification({
        message: "Xuất dữ liệu thành công!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: `Xuất dữ liệu thất bại: ${error}` + error,
        type: "error",
      });
    }
  };

  const handleExportStatisticsToExcel = () => {
    try {
      const excelData = [
        {
          ["Chỉ_số"]: "Tổng số câu hỏi",
          ["Giá_trị"]: totalSurveys,
        },
        {
          ["Chỉ_số"]: "Tổng số câu hỏi đã xử lý",
          ["Giá_trị"]: totalHandledSurveys,
        },
        ...Object.entries(surveyStatusDistribution).map(([status, count]) => ({
          ["Chỉ_số"]: `Trạng thái: ${status}`,
          ["Giá_trị"]: count,
        })),
        ...Object.entries(surveyByQuestion).map(([question, count]) => ({
          ["Chỉ_số"]: `Câu hỏi: ${question}`,
          ["Giá_trị"]: count,
        })),
      ];

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Thống kê câu hỏi");

      XLSX.writeFile(workbook, "ThongKe_CauHoi.xlsx");

      setNotification({
        message: "Xuất dữ liệu thống kê thành công!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: `Xuất dữ liệu thống kê thất bại: ${error}` + error,
        type: "error",
      });
    }
  };

  const handleSurveyAction = async () => {
    if (selectedSurveys.length === 0) {
      setNotification({
        message: "Vui lòng chọn ít nhất một câu hỏi để xử lý",
        type: "info",
      });
      return;
    }
    try {
      const collaboratorId = await fetchCollaboratorId();

      if (!collaboratorId) {
        setNotification({
          message: "Không tìm thấy ID cộng tác viên",
          type: "error",
        });
        return;
      }

      if (selectedSurveys.length === 1) {
        const surveyId = selectedSurveys[0];
        await dispatch(handleSurvey({ collaboratorId, surveyId })).unwrap();
        setNotification({
          message: "Xử lý câu hỏi thành công!",
          type: "success",
        });
      } else {
        await dispatch(
            handleSurveys({ collaboratorId, surveyIds: selectedSurveys })
        ).unwrap();
        setNotification({
          message: "Xử lý các câu hỏi thành công!",
          type: "success",
        });
      }

      dispatch(getSurveys());
      setSelectedSurveys([]);
    } catch (error) {
      setNotification({
        message: "Xử lý câu hỏi thất bại: " + error,
        type: "error",
      });
    }
  };

  const handleSurveyClick = async (surveyId: string) => {
    try {
      const collaboratorId = await fetchCollaboratorId();

      if (!collaboratorId) {
        setNotification({
          message: "Không tìm thấy ID cộng tác viên",
          type: "error",
        });
        return;
      }

      await dispatch(handleSurvey({ collaboratorId, surveyId })).unwrap();
      setNotification({
        message: "Xử lý câu hỏi thành công!",
        type: "success",
      });

      dispatch(getSurveys());
    } catch (error) {
      setNotification({
        message: "Xử lý câu hỏi thất bại: " + error,
        type: "error",
      });
    }
  };

  const handleCompleteSurvey = async (surveyId: string) => {
    try {
      await dispatch(completeSurvey({ surveyId })).unwrap();
      setNotification({
        message: "Hoàn thành câu hỏi thành công!",
        type: "success",
      });
      dispatch(getSurveys());
    } catch (error) {
      setNotification({
        message: "Hoàn thành câu hỏi thất bại: " + error,
        type: "error",
      });
    }
  };

  const handleResponseSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSurveyId) return;

    try {
      const collaboratorId = await fetchCollaboratorId();

      if (!collaboratorId) {
        setNotification({
          message: "Không tìm thấy ID cộng tác viên",
          type: "error",
        });
        return;
      }

      await dispatch(
          responseSurvey({
            surveyId: currentSurveyId,
            collaboratorId,
            responseText: formData.response,
          })
      ).unwrap();
      setNotification({
        message: "Phản hồi câu hỏi thành công!",
        type: "success",
      });
      dispatch(getSurveys());
      setShowForm(false);
    } catch (error) {
      setNotification({
        message: "Phản hồi câu hỏi thất bại: " + error,
        type: "error",
      });
    }
  };

  useEffect(() => {
    dispatch(getSurveys());
    dispatch(getMyInfo());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getMyInfo()).then(() => dispatch(getCollaboratorByUserId()));
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

  const totalSurveys = filteredSurveys.length;

  const totalHandledSurveys = filteredSurveys.filter(
      (survey) => (survey.collaborator?.totalSurveyHandled ?? 0) > 0
  ).length;

  const surveyStatusDistribution = filteredSurveys.reduce((acc, survey) => {
    acc[survey.status.statusName] = (acc[survey.status.statusName] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const surveyByQuestion = filteredSurveys.reduce((acc, survey) => {
    const question = survey.question || "Không xác định";
    acc[question] = (acc[question] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const statusChartData = {
    labels: Object.keys(surveyStatusDistribution),
    datasets: [
      {
        data: Object.values(surveyStatusDistribution),
        backgroundColor: ["#4caf50", "#ff9800", "#f44336"],
        hoverBackgroundColor: ["#66bb6a", "#ffb74d", "#e57373"],
      },
    ],
  };

  const questionChartData = {
    labels: Object.keys(surveyByQuestion),
    datasets: [
      {
        label: "Số câu hỏi",
        data: Object.values(surveyByQuestion),
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
      },
    ],
  };

  if (loading) return <p>Đang tải câu hỏi...</p>;
  if (error) {
    const err = error as ErrorResponseProps;
    return (
        <p>
          Lỗi {err.code}: {err.message}
        </p>
    );
  }

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
                  className="fixed inset-0 bg-black opacity-50 z-40 backdrop-blur-sm"
                  onClick={() => setShowForm(false)}
              ></div>
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <form
                    className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-50"
                    ref={formRef}
                    onSubmit={handleResponseSurvey}
                >
                  <h3 className="text-lg font-semibold mb-4">Phản hồi câu hỏi</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        name="response"
                        placeholder="Nhập nội dung phản hồi"
                        value={formData.response}
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
                      Gửi
                    </button>
                  </div>
                </form>
              </div>
            </>
        )}

        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-semibold text-indigo-700">Quản lý câu hỏi</h2>
          <div className="flex space-x-2">
            <button
                className="flex items-center px-3 py-1 bg-green-500 text-white
                        rounded-lg hover:bg-green-600 transition duration-200
                        ease-in-out transform hover:scale-105"
                onClick={handleSurveyAction}
            >
              <FaQuestion className="mr-2" />
              Xử lý câu hỏi người dùng
            </button>
            <button
                className="flex items-center px-3 py-1 bg-green-500 text-white
                        rounded-lg hover:bg-green-600 transition duration-200
                        ease-in-out transform hover:scale-105"
                onClick={handleExportStatisticsToExcel}
            >
              <FaQuestion className="mr-2" />
              Phân tích dữ liệu sang excel
            </button>
            <button
                className="flex items-center px-3 py-1 bg-indigo-500 text-white
                        rounded-lg hover:bg-indigo-600 transition duration-200
                        ease-in-out transform hover:scale-105"
                onClick={handleExportToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất ra excel
            </button>
          </div>
        </div>

        <div className="flex space-x-4 mb-4 justify-end items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lọc theo người mua:
            </label>
            <select
                name="username"
                value={filters.username}
                onChange={handleFilterChange}
                className="mt-1 p-2 border rounded-md"
            >
              <option value="">Lọc theo tên người dùng</option>
              {Array.from(new Set(surveys.map((survey) => survey.user.username))).map(
                  (username, index) => (
                      <option key={index} value={username}>
                        {username}
                      </option>
                  )
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lọc theo cộng tác viên:
            </label>
            <select
                name="collaboratorUsername"
                value={filters.collaboratorUsername}
                onChange={handleFilterChange}
                className="mt-1 p-2 border rounded-md"
            >
              <option value="">Lọc theo tên cộng tác viên</option>
              {Array.from(
                  new Set(
                      surveys.map((survey) => survey.collaborator?.username || "N/A")
                  )
              ).map((username, index) => (
                  <option key={index} value={username}>
                    {username}
                  </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lọc theo trạng thái câu hỏi:
            </label>
            <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="mt-1 border p-2 rounded"
            >
              <option value="">Lọc theo trạng thái câu hỏi</option>
              {Array.from(
                  new Set(surveys.map((survey) => survey.status.statusName))
              ).map((status, index) => (
                  <option key={index} value={status}>
                    {status}
                  </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lọc theo tổng doanh thu:
            </label>
            <select
                name="totalRevenue"
                value={filters.totalRevenue}
                onChange={handleFilterChange}
                className="mt-1 border p-2 rounded"
            >
              <option value="">Lọc theo tổng doanh thu ({"≥"})</option>
              <option value="100000">100,000</option>
              <option value="500000">500,000</option>
              <option value="1000000">1,000,000</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lọc theo ngày tạo:
            </label>
            <select
                name="createAt"
                value={filters.createAt}
                onChange={handleFilterChange}
                className="mt-1 border p-2 rounded"
            >
              <option value="">Lọc theo ngày tạo</option>
              {Array.from(
                  new Set(
                      surveys.map((survey) =>
                          new Date(survey.createdAt).toLocaleDateString()
                      )
                  )
              ).map((date, index) => (
                  <option key={index} value={date}>
                    {date}
                  </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lọc theo ngày phản hồi:
            </label>
            <select
                name="responseAt"
                value={filters.responseAt ?? ""}
                onChange={handleFilterChange}
                className="mt-1 border p-2 rounded"
            >
              <option value="">Lọc theo ngày phản hồi</option>
              {Array.from(
                  new Set(
                      surveys
                          .map((survey) =>
                              survey.responseAt
                                  ? new Date(survey.responseAt).toLocaleDateString()
                                  : null
                          )
                          .filter((date) => date)
                  )
              ).map((date, index) => (
                  <option key={index} value={date ?? ""}>
                    {date}
                  </option>
              ))}
            </select>
          </div>
        </div>

        {surveys.length > 0 && (
            <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
              <table className="min-w-full bg-white border rounded-lg shadow-sm">
                <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-4 py-2 text-center">Id</th>
                  <th className="px-4 py-2 text-center">Tên người dùng</th>
                  <th className="px-4 py-2 text-center">Tên cộng tác viên</th>
                  <th className="px-4 py-2 text-center">
                    Tổng số câu hỏi cộng tác viên đã xử lý
                  </th>
                  <th className="px-4 py-2 text-center">Trạng thái</th>
                  <th className="px-4 py-2 text-center">Câu hỏi</th>
                  <th className="px-4 py-2 text-center">Phản hồi</th>
                  <th className="px-4 py-2 text-center">Tạo lúc</th>
                  <th className="px-4 py-2 text-center">Phản hồi lúc</th>
                </tr>
                </thead>
                <tbody>
                {paginatedSurveys.length > 0 ? (
                    paginatedSurveys.map((survey, index) => (
                        <tr
                            key={survey.id}
                            className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                                selectedSurveys.includes(survey.id)
                                    ? "bg-indigo-100"
                                    : "hover:bg-gray-50"
                            }`}
                            onClick={() => handleRowSelect(survey.id)}
                        >
                          <td className="border px-4 py-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {survey.user.username}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {survey.collaborator?.username || "N/A"}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {survey.collaborator?.totalSurveyHandled || 0}
                          </td>
                          <td className="border px-4 py-2 text-center">
                      <span
                          className={`px-3 py-1 rounded-full text-white text-sm whitespace-nowrap flex justify-center items-center ${
                              survey.status.statusName === "Open"
                                  ? "bg-green-500"
                                  : survey.status.statusName === "Complete"
                                      ? "bg-slate-400"
                                      : "bg-indigo-500"
                          }`}
                      >
                        {survey.status.statusName}
                      </span>
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {survey.question}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {survey.response || "N/A"}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {new Date(survey.createdAt).toLocaleDateString()}
                          </td>
                          <td className="border px-4 py-2 text-center">
                            {survey.responseAt
                                ? new Date(survey.responseAt).toLocaleDateString()
                                : "N/A"}
                          </td>
                          <td className="border px-4 py-2 text-center space-x-2">
                            <button
                                className={`text-yellow-600 hover:text-yellow-800 transition transform ${
                                    survey.status.statusName === "In Progress" ||
                                    survey.status.statusName === "Complete"
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:scale-110"
                                }`}
                                disabled={
                                    survey.status.statusName === "Complete" ||
                                    survey.status.statusName === "In Progress"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSurveyClick(survey.id);
                                }}
                            >
                              <FaChevronCircleLeft />
                            </button>
                          </td>
                          <td className="border px-4 py-2 text-center space-x-2">
                            <button
                                className={`text-blue-600 hover:text-blue-800 transition transform ${
                                    survey.status.statusName === "Complete" ||
                                    survey.status.statusName === "Open"
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:scale-110"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentSurveyId(survey.id);
                                  setShowForm(true);
                                }}
                                disabled={
                                    survey.status.statusName === "Complete" ||
                                    survey.status.statusName === "Open"
                                }
                            >
                              <FaReply />
                            </button>
                          </td>
                          <td className="border px-4 py-2 text-center space-x-2">
                            <button
                                className={`text-green-600 hover:text-green-800 transition transform ${
                                    survey.status.statusName === "Open" ||
                                    survey.status.statusName === "Complete"
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:scale-110"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteSurvey(survey.id);
                                }}
                                disabled={
                                    survey.status.statusName === "Open" ||
                                    survey.status.statusName === "Complete"
                                }
                            >
                              <FaCheck />
                            </button>
                          </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                      <td colSpan={14} className="text-center py-4">
                        Không có câu hỏi
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
        )}

        <div className="flex justify-between items-center mt-4 mb-6">
          <p className="text-sm text-gray-600">
            Đang hiển thị từ {(currentPage - 1) * rowsPerPage + 1} đến{" "}
            {Math.min(currentPage * rowsPerPage, surveys.length)} trên tổng số{" "}
            {surveys.length} mục
          </p>

          <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
          />
        </div>

        {/* Thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Tổng số câu hỏi
            </h3>
            <p className="text-3xl font-bold text-indigo-600">{totalSurveys}</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Tổng số câu hỏi đã xử lý
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {totalHandledSurveys}
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Trạng thái câu hỏi
            </h3>
            <ul className="text-gray-600">
              {Object.entries(surveyStatusDistribution).map(([status, count]) => (
                  <li key={status}>
                    {status}: {count}
                  </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Biểu đồ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Chart
              type="pie"
              data={statusChartData}
              options={{ maintainAspectRatio: false }}
              title="Phân phối trạng thái câu hỏi"
          />
          <Chart
              type="bar"
              data={questionChartData}
              options={barChartOptions}
              title="Phân phối câu hỏi theo nội dung"
          />
        </div>
      </div>
  );
};

export default FormSurveyCollaborator;
