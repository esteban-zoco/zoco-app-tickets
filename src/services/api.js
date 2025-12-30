import axios from "axios";
import client from "./client";
import { API_BASE_URL } from "./config";

export const GOOGLE_USER_INFO_API = "https://www.googleapis.com/oauth2/v3/userinfo";

const withToken = (token) =>
  token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : undefined;

// Public
export const getCategory = () => client.get("/api/app/category/getcategory");
export const getState = () => client.get("/api/app/state/getstate");
export const getCity = () => client.get("/api/app/city/getcity");
export const getCityByStateId = (data) => client.post("/api/app/city/getcitybystateid", data);
export const getVenue = () => client.get("/api/app/venue/getvenue");
export const getVenueByCityId = (data) => client.post("/api/app/venue/getvenuebycityid", data);

export const getFeaturedEvent = () => client.get("/api/app/event/featuredevent");
export const getCount = () => client.get("/api/app/event/counts");
export const getSearchEvent = (data, page = 1) => client.post(`/api/app/event/allEvent?page=${page}`, data);
export const getEventById = (id) => client.get(`/api/app/event/event/${id}`);
export const getSessionByDayId = (data) => client.post("/api/app/event/getshedule", data);
export const getSearchSuggestion = (data) => client.post("/api/app/event/serceSuggetion", data);
export const getEventSponsor = (data) => client.post("/api/app/event/getsponsor", data);

export const getLatestBlog = () => client.get("/api/app/blog/getlatestblog");
export const getAllBlog = (page = 1) => client.get(`/api/app/blog/getallblog?page=${page}`);
export const getBlogById = (id) => client.post("/api/app/blog/getblogbyid", { id });
export const getSponsor = () => client.get("/api/app/sponser/getsponser");

// Auth
export const registerApi = (data) => client.post("/api/app/user/register", data);
export const verifyEmailApi = (data) => client.post("/api/app/user/verifyemail", data);
export const loginApi = (data) => client.post("/api/app/user/login", data);
export const googleUserInfoApi = (token) => axios.get(GOOGLE_USER_INFO_API, { headers: { Authorization: `Bearer ${token}` } });
export const socialLoginApi = (data) => client.post("/api/app/user/socialLogin", data);
export const checkEmailApi = (data) => client.post("/api/app/user/checkemail", data);
export const verifyOtpApi = (data) => client.post("/api/app/user/verifyotp", data);
export const forgotPasswordApi = (data) => client.post("/api/app/user/forgotpassword", data);
export const getPopupImageApi = () => client.get("/api/app/user/popupimage");
export const getAppSettings = () => client.get("/api/app/user/getappsetting");

export const sendMessageApi = (data) => client.post("/api/app/contectus/sendmessage", data);

// Cart / Orders
export const getCartApi = (token) => client.get("/api/app/cart/getcart", withToken(token));
export const addCartApi = (data, token) => client.post("/api/app/cart/addtocart", data, withToken(token));
export const removeCartApi = (data, token) => client.post("/api/app/cart/removefromcart", data, withToken(token));
export const updateCartApi = (data, token) => client.post("/api/app/cart/updatecart", data, withToken(token));

export const applyDiscountApi = (data, token) => client.post("/api/app/cart/applycuponcode", data, withToken(token));
export const getDiscountApi = (token) => client.get("/api/app/cart/getcuponcode", withToken(token));

export const createOrderApi = (data, token) => client.post("/api/app/order/createorder", data, withToken(token));
export const verifyPaymentApi = (data, token) => client.post("/api/app/orders/successpayment", data, withToken(token));
export const getOrderApi = (token) => client.get("/api/app/order/getorders", withToken(token));
export const getOrderByIdApi = (id) => client.post("/api/app/order/getorderbyid", { id });
export const postReviewApi = (token, data) => client.post("/api/app/order/addrating", data, withToken(token));
export const getMyEventsApi = (token) => client.get("/api/app/order/myevents", withToken(token));
export const getMyEventDetailApi = (token, eventId) => client.get(`/api/app/order/myevents/${eventId}`, withToken(token));

// Profile
export const updateUserProfileApi = (token, data) => client.post("/api/app/user/updateprofile", data, withToken(token));
export const changePasswordApi = (token, data) => client.post("/api/app/user/changepassword", data, withToken(token));

// Banners
export const getActiveBannersApi = () => client.get("/api/app/banners");
export const getActiveBannerByCodeApi = (code) => client.get(`/api/app/banners/${code}`);

// Organizer
export const organizerMeApi = () => client.get("/api/organizer/me");
export const organizerUpdateMeApi = (data) => client.patch("/api/organizer/me", data);
export const organizerListEventsApi = () => client.get("/api/organizer/events/all");
export const organizerAddEventApi = (formData) =>
  client.post("/api/organizer/events/add", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const organizerUpdateEventApi = (formData) =>
  client.post("/api/organizer/events/update", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const organizerDeleteEventApi = (data) => client.post("/api/organizer/events/delete", data);

const __scannerPayload = (id) => ({ id, eventId: id, eventid: id });
export const organizerScannerEventDetailsApi = (eventId) => client.post("/api/scanner/eventdetails", __scannerPayload(eventId));
export const organizerScannerAttendeeListApi = (eventId) => client.post("/api/scanner/attendeelist", __scannerPayload(eventId));

export const organizerListScannersApi = () => client.get("/api/organizer/scanners");
export const organizerCreateScannerApi = (data) => client.post("/api/organizer/scanners", data);
export const organizerDeleteScannerApi = (id) => client.delete(`/api/organizer/scanners/${id}`);
export const organizerAssignScannerApi = (data) => client.post("/api/organizer/scanners/assign", data);
export const organizerUnassignScannerApi = (data) => client.post("/api/organizer/scanners/unassign", data);
export const organizerAssignScannerWithTypesApi = (data) => client.post("/api/organizer/scanners/assign-with-types", data);

export const organizerListSellersApi = () => client.get("/api/organizer/sellers");
export const organizerCreateSellerApi = (data) => client.post("/api/organizer/sellers", data);
export const organizerDeleteSellerApi = (id) => client.delete(`/api/organizer/sellers/${id}`);
export const organizerAssignSellerApi = (data) => client.post("/api/organizer/sellers/assign", data);
export const organizerUnassignSellerApi = (data) => client.post("/api/organizer/sellers/unassign", data);
export const organizerAssignSellerWithTypesApi = (data) => client.post("/api/organizer/sellers/assign-with-types", data);

export const organizerListOrdersApi = () => client.get("/api/organizer/orders");
export const organizerOrdersIncomeApi = () => client.get("/api/organizer/orders/income");

export const organizerCreateCouponApi = (data) => client.post("/api/organizer/coupons/create", data);
export const organizerListCouponsApi = () => client.get("/api/organizer/coupons/all");
export const organizerUpdateCouponApi = (data) => client.post("/api/organizer/coupons/update", data);

export const organizerAddSponsorApi = (formData) =>
  client.post("/api/organizer/eventsponsor/addeventsponsor", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const organizerUpdateSponsorApi = (formData) =>
  client.post("/api/organizer/eventsponsor/updateeventsponsor", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const organizerListSponsorsApi = () => client.get("/api/organizer/eventsponsor/alleventsponsor");
export const organizerDeleteSponsorApi = (data) => client.post("/api/organizer/eventsponsor/deleteeventsponsor", data);
export const organizerSponsorsByEventApi = (data) => client.post("/api/organizer/eventsponsor/geteventsponsorbyeventid", data);

export const organizerReportsDaywiseIncomeApi = () => client.get("/api/organizer/reports/daywiseincome");
export const organizerReportsTotalsApi = () => client.get("/api/organizer/reports/totals");

export const organizerTicketTypesByEventApi = (data) => client.post("/api/organizer/tickettypes/by-event", data);
export const organizerCreateTicketTypeApi = (data) => client.post("/api/organizer/tickettypes/create", data);
export const organizerUpdateTicketTypeApi = (data) => client.post("/api/organizer/tickettypes/update", data);
export const organizerDeleteTicketTypeApi = (data) => client.post("/api/organizer/tickettypes/delete", data);

// Ticket transfer
export const acceptTicketTransferApi = (accessToken, token) =>
  client.post(`/api/tickets/transfer/accept?token=${encodeURIComponent(token)}`, {}, withToken(accessToken));
export const initiateTicketTransferApi = (accessToken, ticketId, toEmail) =>
  client.post(`/api/tickets/${ticketId}/transfer/initiate`, { toEmail }, withToken(accessToken));

export const API_INFO = {
  baseUrl: API_BASE_URL,
};
