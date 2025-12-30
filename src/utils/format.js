import dayjs from "dayjs";

export const formatDate = (value, fmt = "DD MMM. YYYY") => {
  if (!value) return "";
  return dayjs(String(value).slice(0, 10)).format(fmt);
};

export const formatCurrency = (value, currency = "ARS") => {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};
