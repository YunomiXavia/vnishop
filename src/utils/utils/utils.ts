export const formatPhoneNumber = (phoneNumber: string | null | undefined) => {
  const cleaned = ("" + (phoneNumber ?? "")).replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+84 ${match[1]} ${match[2]} ${match[3]}`;
  }
  return phoneNumber ?? "";
};

export const formatCurrencyVND = (amount: number | null | undefined) => {
  const validAmount = amount ?? 0;
  return validAmount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};
