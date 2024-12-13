import ButtonTable from "@/components/button/ButtonTable";
import InputTextForm from "@/components/input/InputTextForm";
import { useFormContext } from "react-hook-form";
import {
  CollaboratorFormProps,
  FormCollaboratorData,
} from "@/types/component/form/form";

const CollaboratorForm: React.FC<CollaboratorFormProps> = ({
  isEditing,
  onClose,
  onSubmit,
}) => {
  const { handleSubmit } = useFormContext<FormCollaboratorData>();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative z-50"
    >
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? "Chỉnh sửa tỉ lệ hoa hồng" : "Thêm Cộng Tác Viên Mới"}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {!isEditing && (
          <>
            {/* Tên đăng nhập */}
            <InputTextForm
              name="username"
              label="Tên đăng nhập"
              placeholder="Tên đăng nhập"
              required
              validation={{
                minLength: {
                  value: 4,
                  message: "Tên đăng nhập phải có ít nhất 4 ký tự",
                },
              }}
            />

            {/* Mật khẩu */}
            <InputTextForm
              name="password"
              label="Mật khẩu"
              placeholder="Mật khẩu"
              type="password"
              required
              validation={{
                minLength: {
                  value: 8,
                  message: "Mật khẩu phải có ít nhất 8 ký tự",
                },
              }}
              isPassword
            />
          </>
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
              value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
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
                value <= today || "Ngày sinh không được vượt quá ngày hôm nay"
              );
            },
          }}
        />

        {/* Tỉ lệ hoa hồng */}
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
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <ButtonTable type="button" variant="warning" onClick={onClose}>
          Hủy
        </ButtonTable>
        <ButtonTable type="submit" variant="primary">
          {isEditing ? "Cập nhật" : "Tạo mới"}
        </ButtonTable>
      </div>
    </form>
  );
};

export default CollaboratorForm;
