"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import { getSurveys } from "@/store/survey/surveySlice";
import Notification from "@/components/notification/Notification";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import Pagination from "@/components/pagination/Pagination";
import Chart from "@/components/chart/Chart";
import { barChartOptions } from "@/types/component/chart/chart";

const FormSurveyAdmin = () => {
  const dispatch = useAppDispatch();
  const {
    surveys,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
  } = useAppSelector((state) => state.surveys);

  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [displayPage, setDisplayPage] = useState<number>(1);

  const [createdFromDate, setCreatedFromDate] = useState<string>("");
  const [createdToDate, setCreatedToDate] = useState<string>("");
  const [responseFromDate, setResponseFromDate] = useState<string>("");
  const [responseToDate, setResponseToDate] = useState<string>("");

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setDisplayPage(newPage);
      dispatch(getSurveys({ page: newPage - 1, size: pageSize }));
    }
  };

  const displayedSurveys = surveys.filter((survey) => {
    let condition: boolean = true;

    // Lọc theo ngày tạo
    if (createdFromDate) {
      condition =
        condition && new Date(survey.createdAt) >= new Date(createdFromDate);
    }
    if (createdToDate) {
      condition =
        condition && new Date(survey.createdAt) <= new Date(createdToDate);
    }

    // Lọc theo ngày phản hồi
    if (responseFromDate) {
      condition =
        condition &&
        survey.responseAt &&
        new Date(survey.responseAt) >= new Date(responseFromDate);
    }
    if (responseToDate) {
      condition =
        condition &&
        survey.responseAt &&
        new Date(survey.responseAt) <= new Date(responseToDate);
    }

    return condition;
  });

  const handleRowSelect = (surveyId: string) => {
    setSelectedSurveys((prevSurveys) =>
      prevSurveys.includes(surveyId)
        ? prevSurveys.filter((id) => id !== surveyId)
        : [...prevSurveys, surveyId]
    );
  };

  // Xuất excel
  const handleExportToExcel = () => {
    try {
      const excelData = surveys.map((survey, index) => ({
        STT: index + 1,
        ["ID Câu Hỏi"]: survey.id,
        ["ID Người Dùng"]: survey.user.id,
        ["Tên đăng nhập"]: survey.user.username,
        ["ID Cộng Tác Viên"]: survey.collaborator?.id || "N/A",
        ["Tên đăng nhập CTV"]: survey.collaborator?.username || "N/A",
        ["SL CTV đã xử lý"]: survey.collaborator?.totalSurveyHandled || 0,
        ["ID Trạng Thái"]: survey.status.id,
        ["Tên Trạng Thái"]: survey.status.statusName,
        ["Câu Hỏi"]: survey.question,
        ["Phản Hồi"]: survey.response || "N/A",
        ["Ngày Tạo"]: new Date(survey.createdAt).toLocaleDateString(),
        ["Ngày Phản Hồi"]: survey.responseAt
          ? new Date(survey.responseAt).toLocaleDateString()
          : "N/A",
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

  // Thống kê
  const totalSurveys = totalElements; // Tổng số câu hỏi từ backend
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
      const responseTime = new Date(survey.responseAt).getTime();
      new Date(survey.createdAt).getTime();
      return responseTime / (1000 * 60 * 60 * 24);
    });

  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length
      : 0;

  const handleExportStatisticsToExcel = () => {
    try {
      const overviewData = [
        { ["Chỉ số"]: "Tổng SP", ["Giá trị"]: totalSurveys },
        {
          ["Chỉ số"]: "Phân phối trạng thái",
          ["Giá trị"]: Object.entries(statusDistribution)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n"),
        },
        {
          ["Chỉ số"]: "Câu hỏi đã phản hồi",
          ["Giá trị"]: responseTimes.length,
        },
        {
          ["Chỉ số"]: "Thời gian phản hồi TB (ngày)",
          ["Giá trị"]: avgResponseTime.toFixed(2),
        },
      ];

      const topCollaboratorsData = topCollaborators.map((collab, index) => ({
        ["Hạng"]: index + 1,
        ["CTV"]: collab.username,
        ["SL CTV xử lý"]: collab.totalSurveyHandled,
      }));

      const overviewWorksheet = XLSX.utils.json_to_sheet(overviewData);
      const collaboratorsWorksheet =
        XLSX.utils.json_to_sheet(topCollaboratorsData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, overviewWorksheet, "Tổng quan");
      XLSX.utils.book_append_sheet(workbook, collaboratorsWorksheet, "Top CTV");

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

  // Khi load trang lần đầu và khi displayPage thay đổi
  useEffect(() => {
    dispatch(getSurveys({ page: currentPage, size: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  // Cập nhật displayPage khi currentPage thay đổi
  useEffect(() => {
    setDisplayPage(currentPage);
  }, [currentPage]);

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

  const topCollaboratorsDataChart = {
    labels: topCollaborators.map((collab) => collab.username),
    datasets: [
      {
        label: "SL CTV đã xử lý",
        data: topCollaborators.map((collab) => collab.totalSurveyHandled),
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
      },
    ],
  };

  const responseTimeData = {
    labels: ["Thời gian phản hồi TB"],
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
  if (error)
    return (
      <p>
        Lỗi {error.code}: {error.message}
      </p>
    );

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

      <div className="p-4 mx-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-semibold text-indigo-700">QL Câu Hỏi</h2>
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
          </div>
        </div>

        <div className="flex gap-4 mb-4 justify-end items-center">
          {/* Lọc theo ngày tạo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ngày tạo từ:
            </label>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              value={createdFromDate}
              onChange={(e) => setCreatedFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Đến:
            </label>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              value={createdToDate}
              onChange={(e) => setCreatedToDate(e.target.value)}
            />
          </div>

          {/* Lọc theo ngày phản hồi */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ngày phản hồi từ:
            </label>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              value={responseFromDate}
              onChange={(e) => setResponseFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Đến:
            </label>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              value={responseToDate}
              onChange={(e) => setResponseToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {displayedSurveys.length > 0 && (
        <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
          <table className="min-w-full bg-white border rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2 text-center">#</th>
                <th className="px-4 py-2 text-center">Tên ĐN</th>
                <th className="px-4 py-2 text-center">CTV ĐN</th>
                <th className="px-4 py-2 text-center">SL CTV Xử lý</th>
                <th className="px-4 py-2 text-center">TT</th>
                <th className="px-4 py-2 text-center">Câu hỏi</th>
                <th className="px-4 py-2 text-center">Phản hồi</th>
                <th className="px-4 py-2 text-center">Ngày tạo</th>
                <th className="px-4 py-2 text-center">Ngày phản hồi</th>
              </tr>
            </thead>
            <tbody>
              {displayedSurveys.length > 0 ? (
                displayedSurveys.map((survey, index) => (
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
                      {currentPage * pageSize + index + 1}
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
                  <td colSpan={9} className="text-center py-4">
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
          Đang hiển thị trang {currentPage * pageSize + 1} trên{" "}
          {Math.min(
            currentPage * pageSize + displayedSurveys.length,
            totalElements
          )}{" "}
          , tổng số {totalElements} mục
        </p>

        <Pagination
          currentPage={displayPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
        <h3 className="text-lg font-semibold text-center mb-4">
          Thống kê tổng hợp
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 text-center">
          <div>
            <p className="text-xl font-bold">{totalSurveys}</p>
            <p>Tổng Câu Hỏi</p>
          </div>
          <div>
            <p className="text-xl font-bold">
              {Object.values(statusDistribution).reduce((a, b) => a + b, 0)}
            </p>
            <p>TT Câu Hỏi</p>
          </div>
          <div>
            <p className="text-xl font-bold">{responseTimes.length}</p>
            <p>Câu Hỏi Đã Phản Hồi</p>
          </div>
          <div>
            <p className="text-xl font-bold">{avgResponseTime.toFixed(2)}</p>
            <p>Thời gian TB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 mt-8 mx-auto max-w-8xl px-4">
        <Chart
          type="pie"
          data={statusChartData}
          options={{ maintainAspectRatio: false }}
          title="Phân phối TT Câu Hỏi"
        />
        <Chart
          type="bar"
          data={topCollaboratorsDataChart}
          options={{
            ...barChartOptions,
            indexAxis: "y",
          }}
          title="Top 5 CTV Xử lý"
        />
        <Chart
          type="bar"
          data={responseTimeData}
          options={barChartOptions}
          title="Thời gian phản hồi TB"
        />
      </div>
    </div>
  );
};

export default FormSurveyAdmin;
