import { Survey, SurveyState } from "@/types/survey/survey";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import {ErrorResponseProps} from "@/types/error/error";
import {extractError} from "@/utils/utils/helper";

const initialState: SurveyState = {
    surveys: [],
    loading: false,
    error: null,
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 5,
};

// Get All Surveys
export const getSurveys = createAsyncThunk<
    { content: Survey[]; currentPage: number; totalPages: number; totalElements: number; pageSize: number },
    { page: number; size: number },
    { rejectValue: ErrorResponseProps }>(
    "/collaborator/surveys/getSurveys",
    async ({ page, size }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.get(`/collaborator/surveys?page=${page}&size=${size}`);
        if (response.data.code === 2000) {
            const data = response.data.result.data;
            return {
                content: data.content,
                currentPage: data.number,
                totalPages: data.totalPages,
                totalElements: data.totalElements,
                pageSize: data.size,
            };
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        return rejectWithValue(extractError(error));
      }
    }
);

// Handle Single Survey
export const handleSurvey = createAsyncThunk<Survey, { collaboratorId: string; surveyId: string }, { rejectValue: ErrorResponseProps }>(
    "/collaborator/surveys/handleSurvey",
    async ({ collaboratorId, surveyId }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.put(`/collaborator/survey/${collaboratorId}/${surveyId}`);
        if (response.data.code === 2000) {
          return response.data.result as Survey;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        return rejectWithValue(extractError(error));
      }
    }
);

// Handle Surveys
export const handleSurveys = createAsyncThunk<Survey[], { collaboratorId: string; surveyIds: string[] }, { rejectValue: ErrorResponseProps }>(
    "/collaborator/surveys/handleSurveys",
    async ({ collaboratorId, surveyIds }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.put(`/collaborator/survey/${collaboratorId}`, { surveyIds });
        if (response.data.code === 2000) {
          return response.data.result as Survey[];
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        return rejectWithValue(extractError(error));
      }
    }
);

// Response Survey
export const responseSurvey = createAsyncThunk<Survey, { surveyId: string; collaboratorId: string; responseText: string }, { rejectValue: ErrorResponseProps }>(
    "/collaborator/surveys/response",
    async ({ surveyId, collaboratorId, responseText }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.post(`/collaborator/survey/${surveyId}/${collaboratorId}`, {
          response: responseText,
        });
        if (response.data.code === 2000) {
          return response.data.result as Survey;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        return rejectWithValue(extractError(error));
      }
    }
);

// Update Survey Status to Complete
export const completeSurvey = createAsyncThunk<Survey, { surveyId: string }, { rejectValue: ErrorResponseProps }>(
    "/collaborator/surveys/complete",
    async ({ surveyId }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.put(`/collaborator/survey/${surveyId}/complete`);
        if (response.data.code === 2000) {
          return response.data.result as Survey;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        return rejectWithValue(extractError(error));
      }
    }
);

// Survey slice
const surveySlice = createSlice({
  name: "surveys",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get All Surveys
        .addCase(getSurveys.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getSurveys.fulfilled, (state, action) => {
            state.loading = false;
            state.surveys = action.payload.content;
            state.currentPage = action.payload.currentPage;
            state.totalPages = action.payload.totalPages;
            state.totalElements = action.payload.totalElements;
            state.pageSize = action.payload.pageSize;
        })
        .addCase(getSurveys.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Lấy danh sách các câu hỏi thất bại." };
        })
      // Handle Survey
        .addCase(handleSurvey.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(handleSurvey.fulfilled, (state, action) => {
          state.loading = false;
          const updatedSurvey = action.payload;
          state.surveys = state.surveys.map((survey) =>
              survey.id === updatedSurvey.id ? updatedSurvey : survey
          );
        })
        .addCase(handleSurvey.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Xử lý câu hỏi người dùng thất bại." };
        })
      // Handle Surveys
        .addCase(handleSurveys.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(handleSurveys.fulfilled, (state, action) => {
          state.loading = false;
          const updatedSurveys = action.payload;
          state.surveys = state.surveys.map(
              (survey) => updatedSurveys.find((updated: Survey) => updated.id === survey.id) || survey
          );
        })
        .addCase(handleSurveys.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Xử lý các câu hỏi người dùng thất bại." };
        })
      // Response Survey
        .addCase(responseSurvey.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(responseSurvey.fulfilled, (state, action) => {
          state.loading = false;
          const updatedSurvey = action.payload;
          state.surveys = state.surveys.map((survey) => (survey.id === updatedSurvey.id ? updatedSurvey : survey));
        })
        .addCase(responseSurvey.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Phản hồi câu hỏi của người dùng thất bại." };
        })
      // Complete Survey
        .addCase(completeSurvey.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(completeSurvey.fulfilled, (state, action) => {
          state.loading = false;
          const updatedSurvey = action.payload;
          state.surveys = state.surveys.map((survey) => (survey.id === updatedSurvey.id ? updatedSurvey : survey));
        })
        .addCase(completeSurvey.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Hoàn thành câu hỏi của người dùng thất bại." };
        });
  },
});

export default surveySlice.reducer;
