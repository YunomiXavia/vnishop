// Survey User Props for Response
import {ErrorResponseProps} from "@/types/error/error";

export interface SurveyUserProps {
  id: string;
  username: string;
}

// Status of Survey
export interface SurveyStatusProps {
  id: string;
  statusName: string;
}

// Survey Collaborator Props for Response
export interface SurveyCollaboratorProps {
  id?: string | null;
  username?: string | null;
  totalSurveyHandled?: number | null;
}

// Survey Props for Response
export interface Survey {
  id: string;
  user: SurveyUserProps;
  collaborator: SurveyCollaboratorProps | null;
  status: SurveyStatusProps;
  question: string;
  response: string | null;
  createdAt: Date;
  responseAt: Date;
}

// Survey State
export interface SurveyState {
  surveys: Survey[];
  loading: boolean;
  error: ErrorResponseProps | null;
  currentPage: number,
  totalPages: number,
  totalElements: number,
  pageSize: number,
}
