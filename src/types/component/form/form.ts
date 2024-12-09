export interface FormUserData {
    username: string;
    password?: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthDate: Date | null;
}

export interface FormCollaboratorData {
    username: string;
    password?: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthDate: Date | null;
    commissionRate: number;
}

export interface FormCreateProductData {
    productName: string;
    price: number;
    description: string;
    stock: number;
    subscriptionDuration: number;
    category: string;
}

export interface FormUpdateProductData {
    productName: string;
    price: number;
    description: string;
    stock: number;
    subscriptionDuration: number;
}


export interface UserFormProps {
    isEditing: boolean;
    isPasswordUpdated: boolean;
    onClose: () => void;
    onSubmit: (data: FormUserData) => void;
    onTogglePasswordUpdate?: () => void;
}

export interface CollaboratorFormProps {
    isEditing: boolean;
    onClose: () => void;
    onSubmit: (data: FormCollaboratorData) => void;
}