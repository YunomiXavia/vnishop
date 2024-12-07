"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useRef, useState } from "react";
import { getSurveys } from "@/store/survey/surveySlice";
import Notification from "@/components/notification/Notification";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import Pagination from "@/components/pagination/Pagination";
import Chart from "@/components/chart/Chart";
import { barChartOptions } from "@/types/component/chart/chart";

const FormSurveyAdmin = () => {
  const dispatch = useAppDispatch();
  const { surveys, loading, error } = useAppSelector((state) => state.surveys);

  const [showForm, setShowForm] = useState(false);
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(surveys.length / rowsPerPage);

  const [createdDateFilter, setCreatedDateFilter] = useState<string | null>(
      null
  );
  const [responseDateFilter, setResponseDateFilter] = useState<string | null>(
      null
  );

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Lọc câu hỏi theo ngày tạo và ngày phản hồi
  const filteredSurveys = surveys.filter((survey) => {
    const createdDateCondition = createdDateFilter
        ? new Date(survey.createdAt).toLocaleDateString() === createdDateFilter
        : true;

    const responseDateCondition = responseDateFilter
        ? survey.responseAt
            ? new Date(survey.responseAt).toLocaleDateString() === responseDateFilter
            : false
        : true;

    return createdDateCondition && responseDateCondition;
  });

  const paginatedSurveys = filteredSurveys.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
  );

  const formRef = useRef<HTMLFormElement>(null);

  // Chọn dòng câu hỏi
  const handleRowSelect = (surveyId: string) => {
    setSelectedSurveys((prevSurveys) =>
        prevSurveys.includes(surveyId)
            ? prevSurveys.filter((id) => id !== surveyId)
            : [...prevSurveys, surveyId]
    );
  };

  // Xuất dữ liệu ra Excel
  const handleExportToExcel = () => {
    try {
      const excelData = surveys.map((survey, index) => ({
        STT: index + 1,
        ["ID Câu Hỏi"]: survey.id,
        ["ID Người Dùng"]: survey.user.id,
        ["Tên đăng nhập"]: survey.user.username,
        ["ID Cộng Tác Viên"]: survey.collaborator?.id || "N/A",
        ["Tên đăng nhập Cộng Tác Viên"]: survey.collaborator?.username || "N/A",
        ["Tổng câu hỏi đã xử lý bởi Cộng Tác Viên"]:
            survey.collaborator?.totalSurveyHandled || 0,
        ["ID Trạng Thái"]: survey.status.id,
        ["Tên Trạng Thái"]: survey.status.statusName,
        ["Câu Hỏi"]: survey.question,
        ["Phản Hồi"]: survey.response || "N/A",
        ["Ngày Tạo"]: survey.createdAt,
        ["Ngày Phản Hồi"]: survey.responseAt,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "CauHoi");

      XLSX.writeFile(workbook, "CauHoi.xlsx");

      setNotification({
        message: "Xuất dữ liệu thành công!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: `Xuất dữ liệu thất bại: ${error}`,
        type: "error",
      });
    }
  };

  // Xuất dữ liệu thống kê ra Excel
  const totalSurveys = surveys.length;

  const statusDistribution = surveys.reduce(
      (acc: { [key: string]: number }, survey) => {
        acc[survey.status.statusName] = (acc[survey.status.statusName] || 0) + 1;
        return acc;
      },
      {}
  );

  const topCollaborators = [...surveys]
      .filter((survey) => survey.collaborator)
      .sort(
          (a, b) =>
              (b.collaborator?.totalSurveyHandled || 0) -
              (a.collaborator?.totalSurveyHandled || 0)
      )
      .slice(0, 5)
      .map((survey) => ({
        username: survey.collaborator?.username || "Không xác định",
        totalSurveyHandled: survey.collaborator?.totalSurveyHandled || 0,
      }));

  const responseTimes = surveys
      .filter((survey) => survey.responseAt && survey.createdAt)
      .map((survey) => {
        const responseTime =
            new Date(survey.responseAt).getTime() -
            new Date(survey.createdAt).getTime();
        return responseTime / (1000 * 60 * 60 * 24);
      });

  const avgResponseTime =
      responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

  const handleExportStatisticsToExcel = () => {
    try {
      const overviewData = [
        { ["Chỉ số"]: "Tổng số câu hỏi", ["Giá trị"]: totalSurveys },
        {
          ["Chỉ số"]: "Phân phối trạng thái câu hỏi",
          ["Giá trị"]: JSON.stringify(statusDistribution, null, 2),
        },
        {
          ["Chỉ số"]: "Số câu hỏi đã phản hồi",
          ["Giá trị"]: responseTimes.length,
        },
        {
          ["Chỉ số"]: "Thời gian phản hồi trung bình (ngày)",
          ["Giá trị"]: avgResponseTime.toFixed(2),
        },
      ];

      const topCollaboratorsData = topCollaborators.map((collab, index) => ({
        ["Hạng"]: index + 1,
        ["Cộng Tác Viên"]: collab.username,
        ["Tổng câu hỏi đã xử lý"]: collab.totalSurveyHandled,
      }));

      const overviewWorksheet = XLSX.utils.json_to_sheet(overviewData);
      const collaboratorsWorksheet = XLSX.utils.json_to_sheet(topCollaboratorsData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, overviewWorksheet, "ThongKeTongQuan");
      XLSX.utils.book_append_sheet(workbook, collaboratorsWorksheet, "CongTacVienHangDau");

      XLSX.writeFile(workbook, "ThongKe_CauHoi.xlsx");

      setNotification({
        message: "Xuất dữ liệu thống kê thành công!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: `Xuất dữ liệu thống kê thất bại: ${error}`,
        type: "error",
      });
    }
  };

  // Lấy dữ liệu câu hỏi khi load
  useEffect(() => {
    dispatch(getSurveys());
  }, [dispatch]);

  const uniqueCreatedDates = Array.from(
      new Set(surveys.map((survey) => new Date(survey.createdAt).toLocaleDateString()))
  );
  const uniqueResponseDates = Array.from(
      new Set(
          surveys.map((survey) =>
              survey.responseAt
                  ? new Date(survey.responseAt).toLocaleDateString()
                  : ""
          )
      )
  ).filter((date) => date !== "");

  // Xử lý khi click ra ngoài form
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

  const statusChartData = {
    labels: Object.keys(statusDistribution),
    datasets: [
      {
        data: Object.values(statusDistribution),
        backgroundColor: ["#4caf50", "#f44336", "#ff9800", "#2196f3"],
        hoverBackgroundColor: ["#66bb6a", "#e57373", "#ffb74d", "#64b5f6"],
      },
    ],
  };

  const topCollaboratorsData = {
    labels: topCollaborators.map((collab) => collab.username),
    datasets: [
      {
        label: "Tổng câu hỏi đã xử lý",
        data: topCollaborators.map((collab) => collab.totalSurveyHandled),
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
      },
    ],
  };

  const responseTimeData = {
    labels: ["Thời gian phản hồi trung bình"],
    datasets: [
      {
        label: "Ngày",
        data: [avgResponseTime],
        backgroundColor: "#ff9800",
        hoverBackgroundColor: "#ffb74d",
      },
    ],
  };

  if (loading) return <p>Đang tải câu hỏi...</p>;
  if (error) return <p>Lỗi {error.code}: {error.message}</p>;

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

        <div className="p-4 mx-auto ">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-semibold text-indigo-700">Quản lý câu hỏi</h2>
            <div className="flex space-x-2">
              <button
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportStatisticsToExcel}
              >
                <FaFileExcel className="mr-2" />
                Phân tích dữ liệu sang excel
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
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
                Lọc theo ngày tạo:
              </label>
              <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  value={createdDateFilter || ""}
                  onChange={(e) => setCreatedDateFilter(e.target.value || null)}
              >
                <option value="">Lọc theo ngày tạo</option>
                {uniqueCreatedDates.map((date, index) => (
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  value={responseDateFilter || ""}
                  onChange={(e) => setResponseDateFilter(e.target.value || null)}
              >
                <option value="">Lọc theo ngày phản hồi</option>
                {uniqueResponseDates.map((date, index) => (
                    <option key={index} value={date}>
                      {date}
                    </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredSurveys.length > 0 && (
            <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
              <table className="min-w-full bg-white border rounded-lg shadow-sm">
                <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-4 py-2 text-center">STT</th>
                  <th className="px-4 py-2 text-center">Tên đăng nhập</th>
                  <th className="px-4 py-2 text-center">Tên đăng nhập của cộng tác viên</th>
                  <th className="px-4 py-2 text-center">Tổng số câu hỏi cộng tác viên đã xử lý</th>
                  <th className="px-4 py-2 text-center">Trạng thái</th>
                  <th className="px-4 py-2 text-center">Câu hỏi</th>
                  <th className="px-4 py-2 text-center">Phản hồi</th>
                  <th className="px-4 py-2 text-center">Ngày tạo</th>
                  <th className="px-4 py-2 text-center">Ngày phản hồi</th>
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
                            {(currentPage - 1) * rowsPerPage + index + 1}
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
                                  : survey.status.statusName === "Close"
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
                        </tr>
                    ))
                ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-4">
                        Không có câu hỏi
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Đang hiển thị từ {Math.min((currentPage - 1) * rowsPerPage + 1, surveys.length)} đến{" "}
            {Math.min(currentPage * rowsPerPage, surveys.length)} trong tổng số{" "}
            {surveys.length} mục
          </p>

          <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
          />
        </div>

        <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
          <h3 className="text-lg font-semibold text-center mb-4">Thống kê tổng quan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 text-center">
            <div>
              <p className="text-xl font-bold">{totalSurveys}</p>
              <p>Tổng câu hỏi</p>
            </div>
            <div>
              <p className="text-xl font-bold">
                {Object.values(statusDistribution).reduce((a, b) => a + b, 0)}
              </p>
              <p>Tổng số câu hỏi theo trạng thái</p>
            </div>
            <div>
              <p className="text-xl font-bold">{responseTimes.length}</p>
              <p>Câu hỏi đã phản hồi</p>
            </div>
            <div>
              <p className="text-xl font-bold">{avgResponseTime.toFixed(2)}</p>
              <p>Thời gian phản hồi trung bình (ngày)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 mt-8 mx-auto max-w-8xl px-4">
          <Chart
              type="pie"
              data={statusChartData}
              options={{ maintainAspectRatio: false }}
              title="Phân phối trạng thái câu hỏi"
          />
          <Chart
              type="bar"
              data={topCollaboratorsData}
              options={{
                ...barChartOptions,
                indexAxis: "y",
              }}
              title="5 cộng tác viên hàng đầu theo câu hỏi đã xử lý"
          />
          <Chart
              type="bar"
              data={responseTimeData}
              options={barChartOptions}
              title="Thời gian phản hồi trung bình"
          />
        </div>
      </div>
  );
};

export default FormSurveyAdmin;
