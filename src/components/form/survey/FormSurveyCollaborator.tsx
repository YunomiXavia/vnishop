"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useRef, useState } from "react";
import {
  completeSurvey,
  getSurveysForCollaborator,
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
import { extractError } from "@/utils/utils/helper";
import Cookies from "js-cookie"; // Import js-cookie để truy xuất cookies

const FormSurveyCollaborator: React.FC = () => {
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

  const [showForm, setShowForm] = useState(false);
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [formData, setFormData] = useState({
    response: "",
  });

  const formRef = useRef<HTMLFormElement>(null);
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null);

  // Lấy username hiện tại từ cookies
  const currentUsername = Cookies.get("username") || "";

  // Fetch Collaborator ID
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

  // Handle Input Change
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
        STT: (currentPage - 1) * pageSize + index + 1,
        ["ID Câu hỏi"]: survey.id,
        ["ID Người mua"]: survey.user.id,
        ["Tên người mua"]: survey.user.username,
        ["ID Cộng tác viên"]: survey.collaborator?.id || "N/A",
        ["Tên cộng tác viên"]: survey.collaborator?.username || "N/A",
        ["Tổng số câu hỏi cộng tác viên đã xử lý"]:
          survey.collaborator?.totalSurveyHandled || 0,
        ["ID Trạng thái"]: survey.status.id,
        ["Trạng thái"]: survey.status.statusName,
        ["Câu hỏi"]: survey.question,
        ["Phản hồi"]: survey.response || "N/A",
        ["Tạo lúc"]: new Date(survey.createdAt).toLocaleString(),
        ["Phản hồi lúc"]: survey.responseAt
          ? new Date(survey.responseAt).toLocaleString()
          : "N/A",
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
        message: `Xuất dữ liệu thất bại: ${error}`,
        type: "error",
      });
    }
  };

  const handleExportStatisticsToExcel = () => {
    try {
      // Chuẩn bị dữ liệu thống kê
      const surveyStatusDistribution = surveys.reduce((acc, survey) => {
        acc[survey.status.statusName] =
          (acc[survey.status.statusName] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const surveyByQuestion = surveys.reduce((acc, survey) => {
        const question = survey.question || "Không xác định";
        acc[question] = (acc[question] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const excelData = [
        { ["Chỉ_số"]: "Tổng số câu hỏi", ["Giá_trị"]: totalElements },
        {
          ["Chỉ_số"]: "Tổng số câu hỏi đã xử lý",
          ["Giá_trị"]: surveys.filter(
            (survey) => (survey.collaborator?.totalSurveyHandled ?? 0) > 0
          ).length,
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
        message: `Xuất dữ liệu thống kê thất bại: ${error}`,
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

      dispatch(
        getSurveysForCollaborator({ page: currentPage - 1, size: pageSize })
      );
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

      dispatch(
        getSurveysForCollaborator({ page: currentPage - 1, size: pageSize })
      );
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
      dispatch(
        getSurveysForCollaborator({ page: currentPage - 1, size: pageSize })
      );
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
      dispatch(
        getSurveysForCollaborator({ page: currentPage - 1, size: pageSize })
      );
      setShowForm(false);
      setFormData({ response: "" });
    } catch (error) {
      setNotification({
        message: "Phản hồi câu hỏi thất bại: " + error,
        type: "error",
      });
    }
  };

  useEffect(() => {
    dispatch(
      getSurveysForCollaborator({ page: currentPage - 1, size: pageSize })
    );
    dispatch(getMyInfo());
  }, [dispatch, currentPage, pageSize]);

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

  // Thống kê tổng quan
  const totalSurveys = totalElements;

  const totalHandledSurveys = surveys.filter(
    (survey) => (survey.collaborator?.totalSurveyHandled ?? 0) > 0
  ).length;

  const surveyStatusDistribution = surveys.reduce((acc, survey) => {
    acc[survey.status.statusName] = (acc[survey.status.statusName] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const surveyByQuestion = surveys.reduce((acc, survey) => {
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

      {/* Form Response Survey */}
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
              <div className="mb-4">
                <label htmlFor="response" className="block text-gray-700">
                  Nội dung phản hồi:
                </label>
                <input
                  type="text"
                  name="response"
                  id="response"
                  placeholder="Nhập nội dung phản hồi"
                  value={formData.response}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200 ease-in-out transform hover:scale-105"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
                >
                  Gửi
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-semibold text-indigo-700">
          Quản lý câu hỏi
        </h2>
        <div className="flex space-x-2">
          <button
            className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
            onClick={handleSurveyAction}
          >
            <FaQuestion className="mr-2" />
            Xử lý câu hỏi người dùng
          </button>
          <button
            className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
            onClick={handleExportStatisticsToExcel}
          >
            <FaQuestion className="mr-2" />
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

      {/* Bảng danh sách câu hỏi */}
      {surveys.length > 0 && (
        <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
          <table className="min-w-full bg-white border rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2 text-center">STT</th>
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
                <th className="px-4 py-2 text-center">Xử lý</th>
                <th className="px-4 py-2 text-center">Phản hồi</th>
                <th className="px-4 py-2 text-center">Hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey, index) => {
                const isHandledByCurrentUser =
                  survey.collaborator?.username === currentUsername ||
                  !survey.collaborator?.username;

                return (
                  <tr
                    key={survey.id}
                    className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                      selectedSurveys.includes(survey.id)
                        ? "bg-indigo-100"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      if (isHandledByCurrentUser) {
                        handleRowSelect(survey.id);
                      }
                    }}
                  >
                    <td className="border px-4 py-2 text-center">
                      {(currentPage - 1) * pageSize + index + 1}
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
                          !isHandledByCurrentUser ||
                          survey.status.statusName === "In Progress" ||
                          survey.status.statusName === "Complete"
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                        disabled={
                          !isHandledByCurrentUser ||
                          survey.status.statusName === "In Progress" ||
                          survey.status.statusName === "Complete"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSurveyClick(survey.id);
                        }}
                        title={
                          !isHandledByCurrentUser
                            ? "Không thể xử lý câu hỏi của người khác."
                            : survey.status.statusName === "In Progress" ||
                              survey.status.statusName === "Complete"
                            ? "Không thể xử lý câu hỏi ở trạng thái này."
                            : "Xử lý câu hỏi."
                        }
                      >
                        <FaChevronCircleLeft />
                      </button>
                    </td>
                    <td className="border px-4 py-2 text-center space-x-2">
                      <button
                        className={`text-blue-600 hover:text-blue-800 transition transform ${
                          !isHandledByCurrentUser ||
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
                          !isHandledByCurrentUser ||
                          survey.status.statusName === "Complete" ||
                          survey.status.statusName === "Open"
                        }
                        title={
                          !isHandledByCurrentUser
                            ? "Không thể phản hồi câu hỏi của người khác."
                            : survey.status.statusName === "Complete" ||
                              survey.status.statusName === "Open"
                            ? "Không thể phản hồi câu hỏi ở trạng thái này."
                            : "Phản hồi câu hỏi."
                        }
                      >
                        <FaReply />
                      </button>
                    </td>
                    <td className="border px-4 py-2 text-center space-x-2">
                      <button
                        className={`text-green-600 hover:text-green-800 transition transform ${
                          !isHandledByCurrentUser ||
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
                          !isHandledByCurrentUser ||
                          survey.status.statusName === "Open" ||
                          survey.status.statusName === "Complete"
                        }
                        title={
                          !isHandledByCurrentUser
                            ? "Không thể hoàn thành câu hỏi của người khác."
                            : survey.status.statusName === "Open" ||
                              survey.status.statusName === "Complete"
                            ? "Không thể hoàn thành câu hỏi ở trạng thái này."
                            : "Hoàn thành câu hỏi."
                        }
                      >
                        <FaCheck />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Phân Trang */}
      <div className="flex justify-between items-center mt-4 mb-6">
        <p className="text-sm text-gray-600">
          Đang hiển thị từ {(currentPage - 1) * pageSize + 1} đến{" "}
          {Math.min(currentPage * pageSize, totalElements)} trên tổng số{" "}
          {totalElements} mục
        </p>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            if (newPage > 0 && newPage <= totalPages) {
              dispatch(
                getSurveysForCollaborator({ page: newPage - 1, size: pageSize })
              );
            }
          }}
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
