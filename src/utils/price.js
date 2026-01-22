const parseNumericValue = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^0-9,.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === ",") return null;
  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");
  let normalized = cleaned;

  if (hasDot && hasComma) {
    // es-AR style: thousands "." and decimal ","
    normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else if (hasComma) {
    // "1,500" or "1,50"
    const commaThousands = /^-?\d{1,3}(,\d{3})+$/.test(cleaned);
    const commaDecimal = /^-?\d+,\d{1,2}$/.test(cleaned);
    if (commaThousands) {
      normalized = cleaned.replace(/,/g, "");
    } else if (commaDecimal) {
      normalized = cleaned.replace(/,/g, ".");
    } else if (/^-?\d+,\d{3}$/.test(cleaned)) {
      normalized = cleaned.replace(/,/g, "");
    } else {
      normalized = cleaned.replace(/,/g, ".");
    }
  } else if (hasDot) {
    const dotThousands = /^-?\d{1,3}(\.\d{3})+$/.test(cleaned);
    const dotDecimal = /^-?\d+\.\d{1,2}$/.test(cleaned);
    if (dotThousands) {
      normalized = cleaned.replace(/\./g, "");
    } else if (dotDecimal) {
      normalized = cleaned;
    } else if (/^-?\d+\.\d{3}$/.test(cleaned)) {
      normalized = cleaned.replace(/\./g, "");
    } else {
      normalized = cleaned;
    }
  }

  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
};

const pickFirstPrice = (...values) => {
  let sawZero = false;
  for (const value of values) {
    const num = parseNumericValue(value);
    if (!Number.isFinite(num)) continue;
    if (num > 0) return num;
    if (num === 0) sawZero = true;
  }
  return sawZero ? 0 : null;
};

export const getTicketPriceValue = (ticket) => {
  if (!ticket) return null;
  return pickFirstPrice(
    ticket.price,
    ticket.amount,
    ticket.value,
    ticket.cost,
    ticket.ticketPrice,
    ticket.ticket_price
  );
};

export const getEventBasePriceValue = (event) => {
  if (!event) return null;
  const direct = pickFirstPrice(
    event.price,
    event.amount,
    event.basePrice,
    event.defaultPrice,
    event.ticketPrice,
    event.ticket_price,
    event.ticketAmount,
    event.cost
  );
  if (direct !== null) return direct;
  if (event.ticket) return getTicketPriceValue(event.ticket);
  return null;
};

export const getMinTicketPrice = (event) => {
  if (!event) return null;
  const lists = [
    event.ticketTypes,
    event.tickettypes,
    event.ticket_types,
    event.ticketOptions,
    event.tickets,
  ].filter(Array.isArray);

  const prices = [];
  lists.forEach((list) => {
    list.forEach((ticket) => {
      const price = getTicketPriceValue(ticket);
      if (Number.isFinite(price)) prices.push(price);
    });
  });

  if (!prices.length) return null;
  return Math.min(...prices);
};

export const getEventPriceValue = (event) => {
  const minTicketPrice = getMinTicketPrice(event);
  if (Number.isFinite(minTicketPrice)) return minTicketPrice;
  const basePrice = getEventBasePriceValue(event);
  if (Number.isFinite(basePrice)) return basePrice;
  return 0;
};
