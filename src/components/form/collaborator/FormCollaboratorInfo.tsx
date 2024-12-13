"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCollaboratorByUserId } from "@/store/collaborator/collaboratorSlice";
import { getCollaboratorOrderHistory } from "@/store/order/orderSlice";
import { getCollaboratorRevenueDetails } from "@/store/revenue/revenueSlice";
import { getSurveysForCollaborator } from "@/store/survey/surveySlice";
import Cookies from "js-cookie";

const FormCollaboratorInfo = () => {
  const dispatch = useAppDispatch();

  // Redux states
  const [collaboratorId, setCollaboratorId] = useState<string | null>(null);

  const { totalElements: totalOrdersProcessed, loading: ordersLoading } =
    useAppSelector((state) => state.orders);

  const { totalElements: totalSurveysProcessed, loading: surveysLoading } =
    useAppSelector((state) => state.surveys);

  const { revenueDetails, loading: revenueLoading } = useAppSelector(
    (state) => state.revenue
  );

  const revenueData = revenueDetails.find(
    (item) => item.collaboratorId === collaboratorId
  );

  useEffect(() => {
    const userId = Cookies.get("id"); // User ID from cookies
    if (userId) {
      // Fetch the collaborator ID
      dispatch(getCollaboratorByUserId())
        .unwrap()
        .then((id) => {
          setCollaboratorId(id);

          // Fetch additional data using the collaborator ID
          dispatch(
            getCollaboratorOrderHistory({
              collaboratorId: id,
              page: 0,
              size: 10,
            })
          );
          dispatch(getCollaboratorRevenueDetails(id));
          dispatch(getSurveysForCollaborator({ page: 0, size: 10 }));
        })
        .catch((error) => {
          console.error("Failed to fetch collaborator ID:", error);
        });
    }
  }, [dispatch]);

  if (!collaboratorId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-700 text-lg">
          Collaborator ID not found. Please log in again.
        </p>
      </div>
    );
  }

  const commissionRate = revenueData?.commissionRate || 0;

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 py-10 px-6">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-10 text-center">
        Collaborator Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Commission Rate */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-indigo-500">
          <h2 className="text-lg font-semibold text-gray-700">
            Commission Rate
          </h2>
          {revenueLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <p className="text-3xl font-bold text-indigo-600">
              {commissionRate * 100}%
            </p>
          )}
        </div>

        {/* Total Surveys Processed */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-green-500">
          <h2 className="text-lg font-semibold text-gray-700">
            Surveys Processed
          </h2>
          {surveysLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <p className="text-3xl font-bold text-green-600">
              {totalSurveysProcessed || 0}
            </p>
          )}
        </div>

        {/* Total Orders Processed */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-yellow-500">
          <h2 className="text-lg font-semibold text-gray-700">
            Orders Processed
          </h2>
          {ordersLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <p className="text-3xl font-bold text-yellow-500">
              {totalOrdersProcessed || 0}
            </p>
          )}
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-700">Total Revenue</h2>
          {revenueLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <p className="text-3xl font-bold text-blue-500">
              {revenueData?.totalRevenue?.toLocaleString("vi-VN") || 0} VND
            </p>
          )}
        </div>

        {/* Total Commission */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-purple-500">
          <h2 className="text-lg font-semibold text-gray-700">
            Total Commission
          </h2>
          {revenueLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <p className="text-3xl font-bold text-purple-500">
              {revenueData?.totalCommission?.toLocaleString("vi-VN") || 0} VND
            </p>
          )}
        </div>

        {/* Total Revenue + Commission */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-pink-500">
          <h2 className="text-lg font-semibold text-gray-700">
            Revenue + Commission
          </h2>
          {revenueLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <p className="text-3xl font-bold text-pink-500">
              {revenueData?.totalRevenueWithCommission?.toLocaleString(
                "vi-VN"
              ) || 0}{" "}
              VND
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormCollaboratorInfo;
