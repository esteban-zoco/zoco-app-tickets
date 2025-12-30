export const FISERV_CARD_OPTIONS = [
  {
    id: "visa",
    label: "Visa",
    storeId: "59307167997660",
    installments: [
      { value: 1, label: "1 cuota (sin interes)", rate: 0 },
      { value: 3, label: "3 cuotas", rate: 0.1 },
      { value: 6, label: "6 cuotas", rate: 0.2 },
      { value: 12, label: "12 cuotas", rate: 0.3 },
    ],
  },
  {
    id: "mastercard",
    label: "Mastercard",
    storeId: "59307167997661",
    installments: [
      { value: 1, label: "1 cuota (sin interes)", rate: 0 },
      { value: 3, label: "3 cuotas", rate: 0.05 },
      { value: 6, label: "6 cuotas", rate: 0.1 },
      { value: 12, label: "12 cuotas", rate: 0.15 },
    ],
  },
  {
    id: "maestro",
    label: "Maestro",
    storeId: "59307167997662",
    installments: [
      { value: 1, label: "1 cuota (sin interes)", rate: 0 },
      { value: 3, label: "3 cuotas", rate: 0.1 },
      { value: 6, label: "6 cuotas", rate: 0.15 },
    ],
  },
];

export const calculateInstallmentTotal = (baseAmount = 0, rate = 0) => {
  const amount = Number(baseAmount) || 0;
  const surcharge = Number(rate) || 0;
  return amount * (1 + surcharge);
};
